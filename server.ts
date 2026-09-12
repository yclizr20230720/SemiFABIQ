import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ==========================================
// IN-MEMORY SIMULATED DATABASE STATE
// ==========================================

let lots = [
  { lot_id: "LOT_146", tester: "Tester_05", yield: 94.53, uph: 793, rework: 11.11, status: "COMPLETE", count: 32520, date: "8/6", priority: "NORMAL" },
  { lot_id: "LOT_139", tester: "Tester_05", yield: 96.64, uph: 797, rework: 9.54, status: "COMPLETE", count: 3659, date: "8/6", priority: "NORMAL" },
  { lot_id: "LOT_138", tester: "Tester_05", yield: 95.73, uph: 871, rework: 9.30, status: "COMPLETE", count: 32977, date: "8/7", priority: "NORMAL" },
  { lot_id: "LOT_144", tester: "Tester_02", yield: 89.26, uph: 697, rework: 20.93, status: "COMPLETE", count: 32919, date: "8/7", priority: "NORMAL" },
  { lot_id: "LOT_109", tester: "Tester_04", yield: 85.00, uph: 268, rework: 50.00, status: "HOLD", count: 20, date: "8/8", priority: "HOT" },
  { lot_id: "LOT_110", tester: "Tester_05", yield: 100.00, uph: 238, rework: 4.44, status: "COMPLETE", count: 90, date: "8/8", priority: "NORMAL" },
  { lot_id: "LOT_116", tester: "Tester_05", yield: 95.98, uph: 829, rework: 11.96, status: "COMPLETE", count: 7091, date: "8/9", priority: "NORMAL" },
  { lot_id: "LOT_117", tester: "Tester_05", yield: 98.70, uph: 201, rework: 6.49, status: "COMPLETE", count: 77, date: "8/9", priority: "NORMAL" },
  { lot_id: "LOT_113", tester: "Tester_02", yield: 94.79, uph: 860, rework: 10.15, status: "COMPLETE", count: 31605, date: "8/10", priority: "NORMAL" },
  { lot_id: "LOT_122", tester: "Tester_04", yield: 95.88, uph: 787, rework: 9.40, status: "COMPLETE", count: 32914, date: "8/10", priority: "NORMAL" }
];

let equipment = [
  { equipment_id: "EL23S13", name: "EL23S13_PM1", type: "ETCH", status: "PRODUCTION", utilization: 88, health: 96, wph: 42, alarms: 0 },
  { equipment_id: "EL23S14", name: "EL23S13_PM2", type: "ETCH", status: "PRODUCTION", utilization: 82, health: 94, wph: 39, alarms: 0 },
  { equipment_id: "EL23S18", name: "EL23S18_PM3", type: "CVD", status: "HOLD", utilization: 68, health: 58, wph: 25, alarms: 15 },
  { equipment_id: "EL23S19", name: "EL23S18_PM4", type: "CVD", status: "PRODUCTION", utilization: 91, health: 92, wph: 45, alarms: 0 },
  { equipment_id: "CVD-01", name: "CVD GateOx", type: "CVD", status: "PRODUCTION", utilization: 85, health: 88, wph: 34, alarms: 1 },
  { equipment_id: "ETCH-07", name: "Etch HighPress", type: "ETCH", status: "DOWN", utilization: 22, health: 42, wph: 10, alarms: 5 },
  { equipment_id: "CMP-05", name: "CMP Planarizer", type: "CMP", status: "MAINTENANCE", utilization: 45, health: 68, wph: 18, alarms: 3 },
  { equipment_id: "LITHO-02", name: "ASML Litho 02", type: "LITHO", status: "PRODUCTION", utilization: 95, health: 97, wph: 55, alarms: 0 }
];

let alarms = [
  { id: 1, type: "critical", title: "FDC Critical — Etch-07 Pressure Anomaly", meta: "Lot M900472 · Score: 0.96 · Auto-abort pending", time: "03:47" },
  { id: 2, type: "critical", title: "Yield Excursion — LOT_109 @ 85.0%", meta: "Product_01 · FT1 · −10.1% vs baseline", time: "02:31" },
  { id: 3, type: "warning", title: "SPC Rule-5 — CVD-04 OXIDE_THK_S3", meta: "2/3 pts > 2σ · Probe check recommended", time: "01:14" },
  { id: 4, type: "warning", title: "PM Due — CMP-05 Health Score 68/100", meta: "Pad conditioner degradation trend", time: "00:42" },
  { id: 5, type: "info", title: "Agent RCA Complete — M900123", meta: "Root cause: DHF_TEMP × GATOX interaction", time: "23:55" }
];

let mrbDecisions = [
  { lot_id: "LOT_63.1", wafer_id: "LOT_63.1_01", partial: false, cluster: false, pattern: true, syl: true, sbl: false, pcm: false, result: "BadWafer" },
  { lot_id: "LOT_63.1", wafer_id: "LOT_63.1_02", partial: false, cluster: false, pattern: false, syl: false, sbl: false, pcm: false, result: "GoodWafer" },
  { lot_id: "LOT_63.1", wafer_id: "LOT_63.1_03", partial: false, cluster: false, pattern: false, syl: false, sbl: false, pcm: true, result: "BadWafer" },
  { lot_id: "LOT_63.1", wafer_id: "LOT_63.1_04", partial: false, cluster: false, pattern: false, syl: false, sbl: false, pcm: false, result: "GoodWafer" },
  { lot_id: "LOT_63.1", wafer_id: "LOT_63.1_05", partial: false, cluster: false, pattern: false, syl: false, sbl: false, pcm: false, result: "GoodWafer" },
  { lot_id: "LOT_63.1", wafer_id: "LOT_63.1_09", partial: true, cluster: false, pattern: true, syl: false, sbl: false, pcm: false, result: "BadWafer" },
  { lot_id: "LOT_63.1", wafer_id: "LOT_63.1_12", partial: false, cluster: false, pattern: false, syl: false, sbl: false, pcm: false, result: "GoodWafer" }
];

let pendingAgentActions = [
  { id: "act_1", type: "LOT_HOLD", target: "LOT_109", desc: "Place lot LOT_109 on hold due to 85.0% yield drop excursion", confidence: 96, status: "PENDING" },
  { id: "act_2", type: "RECIPE_ADJUST", target: "EL23S18", desc: "Adjust target bias voltage setpoint by -2.5V to stabilize shape shift", confidence: 88, status: "PENDING" },
  { id: "act_3", type: "PM_SCHEDULE", target: "CMP-05", desc: "Schedule immediate PM clean cycle on pad conditioning arm", confidence: 91, status: "PENDING" }
];

let agentSessions: { [key: string]: any[] } = {};

// ==========================================
// LAZY GEMINI INITIALIZATION
// ==========================================
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      try {
        aiClient = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      } catch (err) {
        console.error("Failed to initialize GoogleGenAI client:", err);
      }
    }
  }
  return aiClient;
}

// ==========================================
// REST API ENDPOINTS
// ==========================================

app.get("/api/data/lots", (req, res) => {
  res.json(lots);
});

app.get("/api/data/equipment", (req, res) => {
  res.json(equipment);
});

app.get("/api/data/alarms", (req, res) => {
  res.json(alarms);
});

app.get("/api/data/mrb", (req, res) => {
  res.json(mrbDecisions);
});

app.get("/api/data/pending-actions", (req, res) => {
  res.json(pendingAgentActions);
});

app.post("/api/robot/hold", (req, res) => {
  const { lot_id, reason } = req.body;
  const lot = lots.find(l => l.lot_id === lot_id);
  if (lot) {
    lot.status = "HOLD";
    lot.priority = "HOT";
  }
  alarms.unshift({
    id: Date.now(),
    type: "warning",
    title: `Lot Hold Applied — ${lot_id}`,
    meta: reason || "Manual trigger from Fab Control Console",
    time: new Date().toLocaleTimeString("en-US", { hour12: false, hour: '2-digit', minute: '2-digit' })
  });
  res.json({ success: true, lots });
});

app.post("/api/robot/release", (req, res) => {
  const { lot_id } = req.body;
  const lot = lots.find(l => l.lot_id === lot_id);
  if (lot) {
    lot.status = "COMPLETE";
  }
  res.json({ success: true, lots });
});

app.post("/api/robot/pm", (req, res) => {
  const { equipment_id } = req.body;
  const tool = equipment.find(e => e.equipment_id === equipment_id);
  if (tool) {
    tool.status = "MAINTENANCE";
  }
  res.json({ success: true, equipment });
});

app.post("/api/robot/execute-action", (req, res) => {
  const { action_id, approve } = req.body;
  const actionIndex = pendingAgentActions.findIndex(a => a.id === action_id);
  if (actionIndex > -1) {
    const action = pendingAgentActions[actionIndex];
    if (approve) {
      action.status = "APPROVED";
      // Perform structural change
      if (action.type === "LOT_HOLD") {
        const lot = lots.find(l => l.lot_id === action.target);
        if (lot) {
          lot.status = "HOLD";
          lot.priority = "HOT";
        }
      } else if (action.type === "PM_SCHEDULE") {
        const tool = equipment.find(e => e.equipment_id === action.target);
        if (tool) {
          tool.status = "MAINTENANCE";
        }
      } else if (action.type === "RECIPE_ADJUST") {
        const tool = equipment.find(e => e.equipment_id === action.target);
        if (tool) {
          tool.status = "QUALIFICATION";
        }
      }
    } else {
      action.status = "REJECTED";
    }
    // Remove or keep updated
    setTimeout(() => {
      pendingAgentActions = pendingAgentActions.filter(a => a.id !== action_id);
    }, 2000);
  }
  res.json({ success: true, pendingActions: pendingAgentActions, lots, equipment });
});

app.post("/api/agent/query", (req, res) => {
  const { question, session_id } = req.body;
  const sessionId = session_id || `session_${Date.now()}`;
  if (!agentSessions[sessionId]) {
    agentSessions[sessionId] = [];
  }
  agentSessions[sessionId].push({ role: "user", content: question });
  res.json({ session_id: sessionId });
});

app.get("/api/agent/stream/:session_id", async (req, res) => {
  const { session_id } = req.params;
  const history = agentSessions[session_id] || [];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (type: string, content: any) => {
    res.write(`data: ${JSON.stringify({ type, content })}\n\n`);
  };

  if (history.length === 0) {
    sendEvent("error", "No session history found.");
    res.end();
    return;
  }

  const latestQuery = history[history.length - 1].content;
  sendEvent("thinking", "Analyzing lot metrics, SPC charts, and FDC logs...");

  // Mock tool calls simulating RAG / database calls
  await new Promise(r => setTimeout(r, 1200));
  sendEvent("tool_call", { tool: "query_yield_data", params: { lot_id: "LOT_109" }, status: "complete" });
  await new Promise(r => setTimeout(r, 800));
  sendEvent("tool_call", { tool: "query_spc_violations", params: { equipment_id: "EL23S18" }, status: "complete" });

  let promptContext = `You are Semimind++, an advanced semiconductor yield intelligence assistant.
  The current Fab state includes:
  - 10 active lots, including LOT_109 with critical yield loss (85.0%).
  - EL23S18 PM3 chamber showing low health (58) with 15 active alarms.
  - Active alarms: Etch-07 Pressure Anomaly, LOT_109 Yield Excursion.
  
  The user is asking: "${latestQuery}"
  Answer thoroughly using clear technical wording, diagnosing the issue and outlining recommendations.`;

  const client = getAiClient();
  if (client) {
    try {
      const responseStream = await client.models.generateContentStream({
        model: "gemini-3.5-flash",
        contents: promptContext,
        config: {
          systemInstruction: "You are Semimind++, a top-tier Fab data scientist. Speak concisely, clearly, and mathematically. Do not praise yourself. Describe actual physics mechanisms."
        }
      });

      let fullResponseText = "";
      for await (const chunk of responseStream) {
        const text = chunk.text || "";
        fullResponseText += text;
        sendEvent("chunk", text);
      }

      history.push({ role: "agent", content: fullResponseText });
    } catch (err) {
      console.error("Gemini API stream failed:", err);
      // Fallback response if API key fails or errors out
      await handleFallbackStream(latestQuery, sendEvent, history);
    }
  } else {
    // Fallback response if API key not found
    await handleFallbackStream(latestQuery, sendEvent, history);
  }

  sendEvent("complete", "Analysis complete.");
  res.end();
});

async function handleFallbackStream(query: string, sendEvent: Function, history: any[]) {
  const queryLower = query.toLowerCase();
  let fallbackText = "";

  if (queryLower.includes("109") || queryLower.includes("yield")) {
    fallbackText = `### Semimind++ Root Cause Analysis Report: LOT_109

Based on real-time integration across **YMS**, **WAT**, and **FDC**, I have isolated a significant anomaly on **LOT_109**:

1. **Symptom Signature**: Gross yield dropped to **85.0%** on FT1 (Tester_04), breaching the Soft Bin Limit (SBL) of 85.0%.
2. **FDC Commonality**: Lot was processed on Etch chamber **EL23S18_PM3** which is currently in **HOLD** state with 15 active alarms.
3. **Physical Mechanism**: A pressure anomaly (dtw_distance: 0.88 from baseline) caused severe plasma non-uniformity. This resulted in abnormal gate-oxide thickness (z-score: 2.8), yielding severe leakage current issues on Bin 106.

#### Recommended Action Plan:
- **LOT_HOLD**: Maintain current hold on **LOT_109** for further cross-section SEM review.
- **RECIPE_ADJUST**: Apply a bias adjustment of **-2.5V** to the next lot on EL23S18 to offset zone drift.
- **PM_SCHEDULE**: Initiate pad clean on **CMP-05** to resolve secondary thickness variation.`;
  } else {
    fallbackText = `### Semimind++ Operations Briefing

I have queried the active database:
- **Active Alarms**: 7 open. The most critical is Etch-07 Pressure Anomaly (Lot M900472).
- **Fleet Health**: CMP-05 is currently degraded (Health Score: 68) and needs PM.
- **WIP Status**: 143 lots in process, with LOT_109 flagged under critical SBL breach.

Please let me know if you would like me to drill down into any specific Lot ID, WAT parameter, or equipment chamber sensor trace.`;
  }

  const tokens = fallbackText.split(" ");
  for (const token of tokens) {
    sendEvent("chunk", token + " ");
    await new Promise(r => setTimeout(r, 30));
  }
  history.push({ role: "agent", content: fallbackText });
}

// ==========================================
// VITE DEV SERVER OR STATIC PRODUCTION BUILD
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production" && !process.env.DISABLE_VITE) {
    console.log("Starting development server with Vite...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static files from dist...");
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
