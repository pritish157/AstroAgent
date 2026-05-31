const { StateGraph, Annotation, END } = require("@langchain/langgraph");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { geocodePlace } = require("./tools/geocoder");
const { computeBirthChart, getDailyTransits } = require("./tools/astrology");
const { knowledgeLookup } = require("./tools/knowledge");

const AgentState = Annotation.Root({
  messages: Annotation({
    reducer: (oldMessages, newMessages) => oldMessages.concat(newMessages),
    default: () => [],
  }),
  birthDetails: Annotation({
    reducer: (oldValue, newValue) => newValue || oldValue,
    default: () => null,
  }),
  natalChart: Annotation({
    reducer: (oldValue, newValue) => newValue || oldValue,
    default: () => null,
  }),
  toolLogs: Annotation({
    reducer: (oldLogs, newLogs) => oldLogs.concat(newLogs),
    default: () => [],
  }),
});

const tools = [
  {
    type: "function",
    function: {
      name: "geocode_place",
      description: "Get lat/lng/timezone for a place name.",
      parameters: {
        type: "object",
        properties: { placeName: { type: "string" } },
        required: ["placeName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "compute_birth_chart",
      description: "Compute natal chart from birth date, time, and coordinates.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string" },
          time: { type: "string" },
          latitude: { type: "number" },
          longitude: { type: "number" },
          timezone: { type: "string" },
        },
        required: ["date", "time", "latitude", "longitude", "timezone"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_daily_transits",
      description: "Get today's planet transits. Needs transitDate as YYYY-MM-DD.",
      parameters: {
        type: "object",
        properties: { transitDate: { type: "string" } },
        required: ["transitDate"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "knowledge_lookup",
      description: "Look up astrology meanings for signs, houses, or placements.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
];

const MAX_API_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1200;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hasGeminiKey() {
  return Boolean(
    process.env.GEMINI_API_KEY &&
    !process.env.GEMINI_API_KEY.includes("your-gemini-api-key")
  );
}

async function invokeWithRetries(model, messages) {
  let attempt = 0;

  while (attempt < MAX_API_RETRIES) {
    try {
      return await model.invoke(messages);
    } catch (error) {
      attempt += 1;
      const message = String(error?.message || error || "Unknown error");
      const status = error?.status || error?.response?.status || error?.response?.statusCode;
      const isRateLimit = status === 429 || /too many requests/i.test(message);

      if (!isRateLimit || attempt >= MAX_API_RETRIES) {
        throw error;
      }

      const delay = BASE_RETRY_DELAY_MS * attempt;
      console.warn(`AI rate limit hit, retry ${attempt}/${MAX_API_RETRIES} after ${delay}ms: ${message}`);
      await sleep(delay);
    }
  }

  throw new Error("Model retries exhausted.");
}

function buildSystemPrompt(state) {
  // Compact birth summary — avoids dumping full JSON every call
  let birthLine = "No birth details provided yet. Ask for date, time, and place.";
  let system = 'western';
  if (state.birthDetails) {
    const b = state.birthDetails;
    system = b.system || 'western';
    birthLine = `Born: ${b.date || '?'} at ${b.time || '?'} in ${b.place || '?'} (${b.latitude},${b.longitude} TZ:${b.timezone} System:${system})`;
  }

  // Compact natal chart — only planet:sign pairs, not full objects
  let chartLine = "No chart computed yet.";
  if (state.natalChart && state.natalChart.length > 0) {
    chartLine = state.natalChart
      .map(p => `${p.name}:${p.sign}(H${p.house})`)
      .join(', ');
  }

  let systemInstructions = "";
  if (system === 'vedic') {
    systemInstructions = "\n- Calculation System: Indian Vedic (Sidereal) Zodiac (Lahiri Ayanamsa).\n- Terminology: You MUST refer to the Rising Sign/Ascendant as 'Lagna' and the Moon Sign as 'Rashi'. Maintain a traditional, warm, and highly respectful Vedic/spiritual tone.";
  } else {
    systemInstructions = "\n- Calculation System: Western (Tropical) Zodiac (Equal House).\n- Terminology: Refer to the Rising Sign as 'Ascendant' and explain placements using standard modern Western archetypes with warmth and spiritual insight.";
  }

  const userName = state.birthDetails?.name || 'the seeker';

  return `You are AstroAgent, a warm spiritual astrology companion for ${userName}.${systemInstructions}
Rules: Be gentle, concise, beginner-friendly. Use tools for calculations. Never give medical/legal/financial certainty. If birth details are missing and you need to calculate their personal birth chart, ask for them. For other queries (such as explaining placements, signs, houses, or general transits), prioritize calling the appropriate tools directly to answer their questions.
User: ${birthLine}
Chart: ${chartLine}`;
}

async function callModel(state) {
  if (!hasGeminiKey()) {
    return {
      messages: [{
        role: "assistant",
        content: "Namaste. Please add GEMINI_API_KEY in backend/.env to activate AstroAgent.",
      }],
    };
  }

  const model = new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
    temperature: 0.5,
    maxOutputTokens: 1024,
    apiKey: process.env.GEMINI_API_KEY,
  }).bindTools(tools);

  let response;
  try {
    response = await invokeWithRetries(model, [
      { role: "system", content: buildSystemPrompt(state) },
      ...state.messages,
    ]);
  } catch (error) {
    console.error("AI model invoke failed:", error);
    const msg = String(error?.message || error || "");
    const isQuotaExceeded = msg.includes("quota") || msg.includes("429") || msg.includes("limit") || msg.includes("exhausted");
    
    const replyText = isQuotaExceeded
      ? "Namaste. Your daily cosmic credit have been reached for today."
      : "AstroAgent is temporarily rate-limited or unavailable. Please wait a few seconds and try again.";

    return {
      messages: [
        {
          role: "assistant",
          content: replyText,
        },
      ],
    };
  }

  return { messages: [response] };
}

function getToolArgs(toolCall) {
  const rawArgs = toolCall.args || toolCall.arguments || toolCall.function?.arguments || {};
  return typeof rawArgs === "string" ? JSON.parse(rawArgs || "{}") : rawArgs;
}

async function executeTools(state) {
  const lastMessage = state.messages[state.messages.length - 1];
  const toolCalls = lastMessage.tool_calls || [];
  const toolMessages = [];
  const toolLogs = [];
  let newNatalChart = null;

  for (const toolCall of toolCalls) {
    const name = toolCall.name || toolCall.function?.name;
    const args = getToolArgs(toolCall);
    let result;

    try {
      if (name === "geocode_place") {
        toolLogs.push(`Geocoding ${args.placeName}`);
        result = await geocodePlace(args.placeName);
      } else if (name === "compute_birth_chart") {
        toolLogs.push("Computing birth chart");
        result = computeBirthChart(args.date, args.time, args.latitude, args.longitude, args.timezone, state.birthDetails?.system || 'western');
        newNatalChart = [result.ascendant, ...result.planets];
      } else if (name === "get_daily_transits") {
        toolLogs.push(`Computing transits for ${args.transitDate}`);
        result = getDailyTransits(state.natalChart || [], args.transitDate, state.birthDetails?.system || 'western');
      } else if (name === "knowledge_lookup") {
        toolLogs.push(`Looking up ${args.query}`);
        result = knowledgeLookup(args.query);
      } else {
        result = `Unknown tool: ${name}`;
      }
    } catch (error) {
      result = `Tool error: ${error.message}`;
      toolLogs.push(result);
    }

    toolMessages.push({
      role: "tool",
      name,
      tool_call_id: toolCall.id,
      content: typeof result === "string" ? result : JSON.stringify(result),
    });
  }

  return {
    messages: toolMessages,
    natalChart: newNatalChart,
    toolLogs,
  };
}

function routeAfterModel(state) {
  const lastMessage = state.messages[state.messages.length - 1];
  return lastMessage?.tool_calls?.length ? "tools" : END;
}

const workflow = new StateGraph(AgentState)
  .addNode("agent", callModel)
  .addNode("tools", executeTools)
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", routeAfterModel, {
    tools: "tools",
    __end__: END,
  })
  .addEdge("tools", "agent");

module.exports = {
  compiledAgent: workflow.compile(),
  AgentState,
};
