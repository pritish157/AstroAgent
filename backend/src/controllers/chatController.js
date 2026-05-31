const Session = require('../models/Session');
const User = require('../models/User');
const { compiledAgent } = require('../agent');

const activeThreadStreams = new Set();

const getChatHistory = async (req, res) => {
  try {
    const { threadId } = req.params;
    const session = await Session.findOne({ threadId });
    
    if (!session) {
      return res.json({ threadId, messages: [] });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error in getChatHistory controller:', error);
    res.status(500).json({ error: 'Failed to retrieve session history.' });
  }
};

const streamChatResponse = async (req, res) => {
  const { message, threadId, userId } = req.body;
  
  if (!message || !threadId) {
    return res.status(400).json({ error: 'Message and threadId are required.' });
  }

  if (activeThreadStreams.has(threadId)) {
    return res.status(429).json({
      error: 'A response is already being generated for this thread. Please wait until it completes.',
    });
  }

  activeThreadStreams.add(threadId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  console.log(`📡 Controller executing SSE stream for thread: "${threadId}"`);

  let session;
  try {
    session = await Session.findOne({ threadId });
    if (!session) {
      session = await Session.create({
        threadId,
        userId: userId || null,
        messages: []
      });
    } else if (userId && !session.userId) {
      // Link old browser threads to the user after birth details are created.
      session.userId = userId;
    }

    session.messages.push({ role: 'user', content: message });
    await session.save();

    let birthDetails = null;
    let natalChart = null;
    const activeUserId = userId || session.userId;
    if (activeUserId) {
      const user = await User.findById(activeUserId);
      if (user) {
        birthDetails = user.birthDetails;
        natalChart = user.natalChart;
      }
    }

    const allMessages = session.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Token optimization: only send last 10 messages to the LLM
    // (keeps ~5 user+assistant turns of context, saves hundreds of tokens per call)
    const MAX_CONTEXT_MESSAGES = 10;
    const graphMessages = allMessages.length > MAX_CONTEXT_MESSAGES
      ? allMessages.slice(-MAX_CONTEXT_MESSAGES)
      : allMessages;

    let streamedAny = false;
    const graphStream = await compiledAgent.stream({
      messages: graphMessages,
      birthDetails,
      natalChart
    }, {
      configurable: {
        onToken: (token) => {
          streamedAny = true;
          res.write(`event: token\ndata: ${JSON.stringify({ text: token })}\n\n`);
        }
      }
    });

    let finalResponseText = "";
    let finalNatalChart = null;

    for await (const chunk of graphStream) {
      if (chunk.agent) {
        const lastMsg = chunk.agent.messages[chunk.agent.messages.length - 1];
        if (lastMsg) {
          const hasToolCalls = (lastMsg.tool_calls && lastMsg.tool_calls.length > 0) || 
                               (lastMsg.additional_kwargs?.tool_calls && lastMsg.additional_kwargs.tool_calls.length > 0);
          
          if (!hasToolCalls && lastMsg.content) {
            finalResponseText = lastMsg.content;
            if (!streamedAny) {
              res.write(`event: token\ndata: ${JSON.stringify({ text: lastMsg.content })}\n\n`);
            }
          }
        }
      }

      if (chunk.tools) {
        const toolLogs = chunk.tools.toolLogs || [];
        for (const log of toolLogs) {
          res.write(`event: tool_log\ndata: ${JSON.stringify({ log })}\n\n`);
        }

        if (chunk.tools.natalChart) {
          finalNatalChart = chunk.tools.natalChart;
          res.write(`event: chart\ndata: ${JSON.stringify({ chart: finalNatalChart })}\n\n`);
        }
      }
    }

    if (finalNatalChart && session.userId) {
      await User.findByIdAndUpdate(session.userId, { natalChart: finalNatalChart });
      console.log(`💾 Controller successfully persisted natal placements.`);
    }

    if (finalResponseText) {
      session.messages.push({
        role: 'assistant',
        content: finalResponseText
      });
      session.updatedAt = new Date();
      await session.save();
    }

    res.write(`event: done\ndata: {"status": "complete"}\n\n`);
    res.end();

  } catch (error) {
    console.error('❌ Error inside chat controller stream loop:', error);
    if (!res.writableEnded) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  } finally {
    activeThreadStreams.delete(threadId);
  }
};

module.exports = {
  getChatHistory,
  streamChatResponse
};
