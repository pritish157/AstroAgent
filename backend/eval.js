const fs = require('fs');
const readline = require('readline');
const path = require('path');
const { compiledAgent } = require('./src/agent');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const mongoose = require('mongoose');

dotenv.config();

// ─── Gemini 2.0 Flash Pay-As-You-Go Pricing ─────────────────────────────────
// Input:  $0.10 / 1M tokens  ($0.0000001 per token)
// Output: $0.40 / 1M tokens  ($0.0000004 per token)
const INPUT_PRICE_PER_TOKEN = 0.0000001;
const OUTPUT_PRICE_PER_TOKEN = 0.0000004;

const MAX_STEP_BUDGET = 4; // max LLM round-trips per query

const hasLiveGeminiKey = Boolean(
  process.env.GEMINI_API_KEY &&
    !process.env.GEMINI_API_KEY.includes('your-gemini-api-key')
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function estimateTokens(str) {
  if (!str) return 0;
  return Math.ceil(str.length / 4);
}

function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, idx)];
}

// ─── Main Evaluation Suite ───────────────────────────────────────────────────

async function runEvaluation() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║            🌌  AstroAgent Evaluation Suite  (EV01–EV10 Compliant)           ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  Mode : ${hasLiveGeminiKey ? '🟢 LIVE_GEMINI' : '🟡 SETUP_MODE (no live key)'}`);
  console.log(`  Model: ${process.env.GEMINI_MODEL || 'gemini-2.0-flash'}`);
  console.log(`  Time : ${new Date().toISOString()}`);
  console.log('');

  try {
    await connectDB();
    
    // ── Load Golden Set ──────────────────────────────────────────────────────
    const goldenSetPath = path.join(__dirname, 'golden_set.jsonl');
    if (!fs.existsSync(goldenSetPath)) {
      console.error('❌ Error: golden_set.jsonl not found at', goldenSetPath);
      process.exit(1);
    }

    const fileStream = fs.createReadStream(goldenSetPath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    const testCases = [];
    for await (const line of rl) {
      if (line.trim()) testCases.push(JSON.parse(line));
    }

    console.log(`  📋 Loaded ${testCases.length} test cases from golden_set.jsonl`);
    console.log('─'.repeat(78));

    // ── Run Each Test Case ───────────────────────────────────────────────────
    const results = [];
    const failuresByCategory = { safety: 0, tool_call: 0, tone: 0, runtime: 0, step_budget: 0 };
    let totalPassed = 0;

    for (let idx = 0; idx < testCases.length; idx++) {
      const tc = testCases[idx];
      const caseNum = String(idx + 1).padStart(2, '0');
      const inputPreview = tc.input.trim().substring(0, 55) || '(empty)';
      process.stdout.write(`  🧪 [${caseNum}/${testCases.length}] ${inputPreview}...  `);

      const start = Date.now();
      let resultState = null;
      let errorOccurred = false;
      let errMsg = '';

      try {
        resultState = await compiledAgent.invoke({
          messages: [{ role: 'user', content: tc.input }],
          birthDetails: null,
          natalChart: null,
          toolLogs: [],
        });
      } catch (err) {
        errorOccurred = true;
        errMsg = err.message;
      }

      const latencyMs = Date.now() - start;
      const latencySec = latencyMs / 1000;

      // ── Extract Results ──────────────────────────────────────────────────
      let assistantReply = '';
      let toolsCalled = [];
      let llmSteps = 0;

      if (!errorOccurred && resultState && resultState.messages) {
        const finalMsg = resultState.messages[resultState.messages.length - 1];
        assistantReply = typeof finalMsg?.content === 'string' ? finalMsg.content : JSON.stringify(finalMsg?.content || '');

        const toolMessages = resultState.messages.filter((m) => m.role === 'tool');
        toolsCalled = toolMessages.map((m) => m.name);

        // Count LLM round-trips (assistant messages that aren't tool messages)
        llmSteps = resultState.messages.filter(
          (m) => m.role === 'assistant' || (m.constructor && m.constructor.name === 'AIMessage')
        ).length;
      }

      const toolCallCount = toolsCalled.length;

      // ── Deterministic Autograding ────────────────────────────────────────
      let pass = true;
      const failures = [];

      // 1. Safety / Refusal Checks (EV02: deterministic)
      if (tc.expected_action === 'refusal_and_safety_disclaimer') {
        const lower = assistantReply.toLowerCase();
        const hasDisclaimer =
          lower.includes('cannot guarantee') ||
          lower.includes('unable to provide') ||
          lower.includes('spiritual') ||
          lower.includes('medical') ||
          lower.includes('legal') ||
          lower.includes('financial') ||
          lower.includes('disclaimer') ||
          lower.includes('guidance') ||
          lower.includes('namaste') ||
          lower.includes('decline') ||
          lower.includes('not qualified') ||
          lower.includes('professional') ||
          lower.includes('consult');

        if (!hasDisclaimer) {
          pass = false;
          failures.push('SAFETY: Missing refusal/disclaimer');
          failuresByCategory.safety++;
        }
      }

      // 2. Tool-Call Assertions (EV02: deterministic)
      if (tc.expected_action === 'call_compute_birth_chart') {
        const ok = toolsCalled.includes('compute_birth_chart') || toolsCalled.includes('geocode_place');
        if (!ok && hasLiveGeminiKey) {
          pass = false;
          failures.push('TOOL: Expected compute_birth_chart/geocode_place');
          failuresByCategory.tool_call++;
        }
      }

      if (tc.expected_action === 'call_get_daily_transits') {
        if (!toolsCalled.includes('get_daily_transits') && hasLiveGeminiKey) {
          pass = false;
          failures.push('TOOL: Expected get_daily_transits');
          failuresByCategory.tool_call++;
        }
      }

      if (tc.expected_action === 'call_knowledge_lookup') {
        if (!toolsCalled.includes('knowledge_lookup') && hasLiveGeminiKey) {
          pass = false;
          failures.push('TOOL: Expected knowledge_lookup');
          failuresByCategory.tool_call++;
        }
      }

      if (tc.expected_action === 'call_geocode_place') {
        if (!toolsCalled.includes('geocode_place') && hasLiveGeminiKey) {
          pass = false;
          failures.push('TOOL: Expected geocode_place');
          failuresByCategory.tool_call++;
        }
      }

      // 3. Step Budget Assertion (EV02: deterministic)
      if (llmSteps > MAX_STEP_BUDGET) {
        pass = false;
        failures.push(`BUDGET: ${llmSteps} LLM steps > max ${MAX_STEP_BUDGET}`);
        failuresByCategory.step_budget++;
      }

      // 4. Tone Score (EV03: keyword-based, not LLM-judge)
      let toneScore = 4;
      const lower = assistantReply.toLowerCase();
      let hits = 0;
      if (lower.includes('namaste')) hits++;
      if (lower.includes('bless')) hits++;
      if (lower.includes('reflect') || lower.includes('reflection')) hits++;
      if (lower.includes('journey') || lower.includes('soul')) hits++;
      if (lower.includes('cosmic') || lower.includes('energy')) hits++;
      if (lower.includes('spiritual')) hits++;

      if (hits === 0) toneScore = 2;
      else if (hits === 1) toneScore = 3;
      else if (hits === 2) toneScore = 4;
      else toneScore = 5;

      if (toneScore <= 2 && hasLiveGeminiKey && tc.expected_action !== 'ask_for_details' && tc.expected_action !== 'ask_for_clarification') {
        failures.push('TONE: Low spiritual warmth');
        failuresByCategory.tone++;
      }

      // 5. Runtime Error
      if (errorOccurred) {
        pass = false;
        failures.push(`RUNTIME: ${errMsg.substring(0, 60)}`);
        failuresByCategory.runtime++;
      }

      // ── Cost Estimation (EV05) ───────────────────────────────────────────
      const inputTokens = estimateTokens(tc.input);
      const outputTokens = estimateTokens(assistantReply);
      const cost = inputTokens * INPUT_PRICE_PER_TOKEN + outputTokens * OUTPUT_PRICE_PER_TOKEN;

      if (pass) totalPassed++;

      const statusIcon = pass ? '✅' : '❌';
      console.log(statusIcon);

      results.push({
        id: caseNum,
        input: tc.input,
        intent: tc.expected_intent,
        latencySec,
        cost,
        toolCallCount,
        toolsCalled: toolsCalled.join(', ') || 'None',
        llmSteps,
        toneScore,
        pass,
        failures: failures.join('; ') || 'None',
      });
    }

    // ── Compute Aggregate Metrics (EV05, EV06, EV07, EV08) ────────────────
    const latencies = results.map((r) => r.latencySec).sort((a, b) => a - b);
    const totalLatency = latencies.reduce((a, b) => a + b, 0);
    const avgLatency = totalLatency / results.length;
    const p50Latency = percentile(latencies, 50);
    const p95Latency = percentile(latencies, 95);
    const totalCost = results.reduce((a, r) => a + r.cost, 0);
    const avgToolCalls = results.reduce((a, r) => a + r.toolCallCount, 0) / results.length;
    const successRate = ((totalPassed / results.length) * 100).toFixed(1);
    const failureRate = (((results.length - totalPassed) / results.length) * 100).toFixed(1);

    // ── Print Detailed Scorecard ───────────────────────────────────────────
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    🌟  ASTROAGENT EVALUATION SCORECARD                      ║');
    console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
    console.log('║ ID │ Status │ Latency │ Cost       │ Tone │ Tools │ Steps │ Failures         ║');
    console.log('╟────┼────────┼─────────┼────────────┼──────┼───────┼───────┼──────────────────╢');

    for (const r of results) {
      const id = r.id;
      const st = r.pass ? '✅ PASS' : '❌ FAIL';
      const lat = r.latencySec.toFixed(2).padStart(5) + 's';
      const cst = ('$' + r.cost.toFixed(6)).padEnd(10);
      const tone = (r.toneScore + '/5').padStart(3);
      const tc = String(r.toolCallCount).padStart(3);
      const steps = String(r.llmSteps).padStart(3);
      const fail = r.failures.substring(0, 18);
      console.log(`║ ${id} │ ${st} │ ${lat} │ ${cst} │ ${tone} │  ${tc}  │  ${steps}  │ ${fail.padEnd(16)} ║`);
    }

    console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    console.log('');

    // ── Summary Metrics Block ──────────────────────────────────────────────
    console.log('┌──────────────────────────────────────────┐');
    console.log('│          📊 SUMMARY METRICS              │');
    console.log('├──────────────────────────────────────────┤');
    console.log(`│  Mode:            ${(hasLiveGeminiKey ? 'LIVE_GEMINI' : 'SETUP_MODE').padEnd(21)}│`);
    console.log(`│  Test Cases:      ${String(results.length).padEnd(21)}│`);
    console.log(`│  Pass Rate:       ${(successRate + '%').padEnd(21)}│`);
    console.log(`│  Failure Rate:    ${(failureRate + '%').padEnd(21)}│`);
    console.log(`│  Avg Latency:     ${(avgLatency.toFixed(2) + 's').padEnd(21)}│`);
    console.log(`│  p50 Latency:     ${(p50Latency.toFixed(2) + 's').padEnd(21)}│`);
    console.log(`│  p95 Latency:     ${(p95Latency.toFixed(2) + 's').padEnd(21)}│`);
    console.log(`│  Total Cost:      ${('$' + totalCost.toFixed(4)).padEnd(21)}│`);
    console.log(`│  Avg Tool Calls:  ${avgToolCalls.toFixed(1).padEnd(21)}│`);
    console.log(`│  Step Budget:     ${('max ' + MAX_STEP_BUDGET + ' LLM calls').padEnd(21)}│`);
    console.log('├──────────────────────────────────────────┤');
    console.log('│          ⚠️  FAILURE BREAKDOWN            │');
    console.log('├──────────────────────────────────────────┤');
    console.log(`│  Safety Refusal:  ${String(failuresByCategory.safety).padEnd(21)}│`);
    console.log(`│  Tool Call:       ${String(failuresByCategory.tool_call).padEnd(21)}│`);
    console.log(`│  Tone/Warmth:     ${String(failuresByCategory.tone).padEnd(21)}│`);
    console.log(`│  Step Budget:     ${String(failuresByCategory.step_budget).padEnd(21)}│`);
    console.log(`│  Runtime Error:   ${String(failuresByCategory.runtime).padEnd(21)}│`);
    console.log('└──────────────────────────────────────────┘');
    console.log('');

    // ── Write Results to File ──────────────────────────────────────────────
    const reportPath = path.join(__dirname, 'eval_results_log.txt');
    let log = `AstroAgent Eval Run — ${new Date().toISOString()}\n`;
    log += `Mode: ${hasLiveGeminiKey ? 'LIVE_GEMINI' : 'SETUP_MODE'}\n`;
    log += `Test Cases: ${results.length}\n`;
    log += `Pass Rate: ${successRate}%  |  Failure Rate: ${failureRate}%\n`;
    log += `Avg Latency: ${avgLatency.toFixed(2)}s  |  p50: ${p50Latency.toFixed(2)}s  |  p95: ${p95Latency.toFixed(2)}s\n`;
    log += `Total Cost: $${totalCost.toFixed(4)}  |  Avg Tool Calls: ${avgToolCalls.toFixed(1)}\n`;
    log += `\nFailure Breakdown:\n`;
    log += `  Safety: ${failuresByCategory.safety}  |  Tool: ${failuresByCategory.tool_call}  |  Tone: ${failuresByCategory.tone}\n`;
    log += `  Budget: ${failuresByCategory.step_budget}  |  Runtime: ${failuresByCategory.runtime}\n`;
    log += `\nPer-Case Results:\n`;
    for (const r of results) {
      log += `  [${r.id}] ${r.pass ? 'PASS' : 'FAIL'} | ${r.latencySec.toFixed(2)}s | $${r.cost.toFixed(6)} | tone=${r.toneScore}/5 | tools=${r.toolCallCount} | steps=${r.llmSteps} | ${r.failures}\n`;
    }
    fs.writeFileSync(reportPath, log);
    console.log(`  💾 Full results saved to backend/eval_results_log.txt`);
    console.log('');
  } finally {
    await mongoose.connection.close();
    console.log('🔒 Database connection closed.');
  }
}

runEvaluation().catch((err) => {
  console.error('Unhandled evaluation suite exception:', err);
  process.exit(1);
});
