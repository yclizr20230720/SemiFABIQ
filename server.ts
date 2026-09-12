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

let pendingAgentActions: {
  id: string;
  type: string;
  target: string;
  desc: string;
  confidence: number;
  status: string;
  impact?: string;
}[] = [
  { id: "act_1", type: "LOT_HOLD", target: "LOT_109", desc: "Place lot LOT_109 on hold due to 85.0% yield drop excursion", confidence: 96, status: "PENDING", impact: "Zero customer escape risk" },
  { id: "act_2", type: "RECIPE_ADJUST", target: "EL23S18", desc: "Adjust target bias voltage setpoint by -2.5V to stabilize shape shift", confidence: 88, status: "PENDING", impact: "+9.2% expected yield recovery" },
  { id: "act_3", type: "PM_SCHEDULE", target: "CMP-05", desc: "Schedule immediate PM clean cycle on pad conditioning arm", confidence: 91, status: "PENDING", impact: "Prevents secondary thickness variation" }
];

interface SessionMeta {
  id: string;
  title: string;
  focusLot?: string;
  focusEquipment?: string;
  status: "ACTIVE" | "RESOLVED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
}

let sessionMetaList: SessionMeta[] = [
  {
    id: "session_lot_109",
    title: "LOT_109 Yield Excursion & Gate Oxide RCA",
    focusLot: "LOT_109",
    focusEquipment: "EL23S18",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: "session_cmp_05",
    title: "CMP-05 Health Score & Pad Degradation",
    focusLot: "LOT_144",
    focusEquipment: "CMP-05",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString()
  }
];

let agentSessions: { [key: string]: any[] } = {
  session_lot_109: [
    {
      id: "msg_init_1",
      role: "agent",
      content: `### Semimind++ RCA Investigation Active: LOT_109

I have initialized cross-domain telemetry correlation for **LOT_109** (Product_01 on Tester_04).
- **Yield Delta**: **85.00%** gross yield (−10.1% vs 95.1% baseline). Soft Bin Limit (SBL) breached.
- **Parametric Trigger**: Bin 106 (Gate Oxide Dielectric Breakdown / Ioff Leakage) spiked to **8.4%** fallout.
- **Chamber Correlation**: Processed on **EL23S18_PM3** (CVD/Etch module), which is flagged with 15 sensor alarms.

You can ask me to isolate the physics mechanism, compare chamber traces, or evaluate candidate mitigation recipes.`,
      timestamp: "02:35",
      toolsUsed: [
        {
          tool: "query_lot_telemetry",
          name: "YMS Lot Query",
          params: { lot_id: "LOT_109" },
          status: "complete",
          executionTimeMs: 142,
          result: {
            yield: 85.0,
            baseline: 95.1,
            failed_bins: [
              { bin: 106, name: "GateOx_Leakage", fallout_pct: 8.4 },
              { bin: 104, name: "Bridging_Short", fallout_pct: 3.8 }
            ],
            spatial_signature: "Wafer Edge Ring (r > 135mm)"
          }
        },
        {
          tool: "query_fdc_chamber_traces",
          name: "FDC Sensor Anomaly Extractor",
          params: { equipment_id: "EL23S18" },
          status: "complete",
          executionTimeMs: 284,
          result: {
            chamber: "EL23S18_PM3",
            pressure_mTorr: 31.2,
            baseline_pressure: 24.5,
            dtw_distance: 0.88,
            esc_temp_delta: "7.8°C (Center vs Edge)"
          }
        }
      ],
      hypotheses: [
        {
          id: "hyp_1",
          name: "RF Bias Voltage & Gas Pressure Non-uniformity",
          category: "PLASMA_ETCH",
          likelihood: 94,
          status: "CONFIRMED",
          supportingEvidence: "FDC chamber EL23S18 pressure jumped +6.7 mTorr with 0.88 DTW drift; match phase angle shifted by 14.2° causing edge plasma over-density.",
          suggestedTest: "Apply -2.5V bias offset to restore center-to-edge sheath uniform profile."
        },
        {
          id: "hyp_2",
          name: "Post-CMP Oxide Slurry Micro-scratching",
          category: "CMP_PLANARIZATION",
          likelihood: 26,
          status: "RULED_OUT",
          supportingEvidence: "CMP-05 pad conditioner has low health (68), but inline KLA defect inspection shows no radial micro-scratches on center dies.",
          counterEvidence: "WAT Tox thickness is un-scratched; electrical leakage is confined purely to outer die perimeter."
        }
      ],
      recommendations: [
        {
          id: "rec_1",
          title: "Immediate Containment: Lock LOT_109 on Engineering Hold",
          type: "LOT_HOLD",
          severity: "CRITICAL",
          confidence: 96,
          target: "LOT_109",
          description: "Prevent 20 suspect wafers from advancing to wire-bond / packaging until SEM cross-section is verified.",
          suggestedAction: "Set LOT_109 status to HOLD with HOT priority.",
          impactEstimate: "Eliminates $86,000 risk of assembly scrap & field escape.",
          status: "READY",
          actionPayload: { lot_id: "LOT_109", priority: "HOT" }
        },
        {
          id: "rec_2",
          title: "Process Recipe Offset: Recalibrate RF Bias setpoint by -2.5V",
          type: "RECIPE_ADJUST",
          severity: "HIGH",
          confidence: 92,
          target: "EL23S18",
          description: "Shift RF Bias generator setpoint from 145V to 142.5V on EL23S18 to compensate for edge plasma drift.",
          suggestedAction: "Upload recipe delta to chamber controller and queue 1 qualification wafer.",
          impactEstimate: "+9.2% expected yield recovery on next scheduled lot.",
          status: "READY",
          actionPayload: { equipment_id: "EL23S18", biasOffsetV: -2.5 }
        },
        {
          id: "rec_3",
          title: "Maintenance Interlock: Schedule PM Clean on CMP-05",
          type: "PM_SCHEDULE",
          severity: "MEDIUM",
          confidence: 89,
          target: "CMP-05",
          description: "Health score at 68/100 due to pad conditioner arm degradation. Clean diamond conditioner disc.",
          suggestedAction: "Switch tool status to MAINTENANCE for 2-hour conditioning cycle.",
          impactEstimate: "Prevents secondary thickness variation across subsequent production lots.",
          status: "READY",
          actionPayload: { equipment_id: "CMP-05" }
        }
      ],
      followUpQuestions: [
        "What was the exact DTW distance on chamber pressure for EL23S18?",
        "Can we check if other lots processed on EL23S18 show the same edge ring pattern?",
        "Simulate yield recovery if we apply the -2.5V bias offset recipe",
        "Generate 8D Root Cause Analysis report for management sign-off"
      ]
    }
  ],
  session_cmp_05: [
    {
      id: "msg_cmp_init",
      role: "agent",
      content: `### Semimind++ Tool Health Diagnostic: CMP-05 Planarizer

Telemetry analysis indicates **CMP-05** has degraded to Health Score **68 / 100**:
- **Conditioning Arm Torque**: +18% above standard threshold, suggesting diamond disc glaze.
- **Slurry Flow Rate**: Fluctuating ±4.2 mL/min on platen 2.
- **Wafers Processed**: 1,240 wafers since last major PM (exceeding 1,200 limit).

I recommend scheduling a pad conditioner clean cycle before processing higher-density N5 critical layer lots.`,
      timestamp: "00:45",
      hypotheses: [
        {
          id: "hyp_cmp_1",
          name: "Diamond Conditioner Disc Glazing",
          category: "CMP_PLANARIZATION",
          likelihood: 91,
          status: "CONFIRMED",
          supportingEvidence: "Pad profile scan shows center glazing and decreased removal rate (RR dropped from 240 nm/min to 208 nm/min).",
          suggestedTest: "Perform 15-minute high-pressure DIW disc flush and condition pad with high-grit sweep."
        }
      ],
      recommendations: [
        {
          id: "rec_cmp_1",
          title: "Preventive Maintenance: Schedule CMP-05 Conditioner Clean",
          type: "PM_SCHEDULE",
          severity: "HIGH",
          confidence: 94,
          target: "CMP-05",
          description: "Interlock CMP-05 from receiving new WIP until diamond conditioner disc is flushed.",
          suggestedAction: "Set tool status to MAINTENANCE and trigger automated clean cycle.",
          impactEstimate: "Restores removal rate to 240 nm/min and protects wafer planarity.",
          status: "READY",
          actionPayload: { equipment_id: "CMP-05" }
        }
      ],
      followUpQuestions: [
        "Which upcoming lots are scheduled to run on CMP-05?",
        "What is the wafer planarity oxide thickness variation right now?",
        "Approve the PM schedule now"
      ]
    }
  ]
};

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

// ==========================================
// AGENT AI & RCA COLLABORATION ENDPOINTS
// ==========================================

app.get("/api/agent/sessions", (req, res) => {
  const result = sessionMetaList.map(s => ({
    ...s,
    messageCount: (agentSessions[s.id] || []).length
  }));
  res.json(result);
});

app.post("/api/agent/sessions/new", (req, res) => {
  const { title, focusLot, focusEquipment } = req.body;
  const newId = `session_${Date.now()}`;
  const newSession: SessionMeta = {
    id: newId,
    title: title || `RCA Investigation — ${focusLot || focusEquipment || "General Fab"}`,
    focusLot: focusLot || "LOT_109",
    focusEquipment: focusEquipment || "EL23S18",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  sessionMetaList.unshift(newSession);
  agentSessions[newId] = [
    {
      id: `msg_${Date.now()}`,
      role: "agent",
      content: `### Semimind++ RCA Workspace Initialized\nFocusing on **${newSession.focusLot}** and equipment **${newSession.focusEquipment}**.\nTelemetry channels are open for cross-correlation across YMS wafer sort, FDC SVID sensors, and WAT parametric tests. What anomaly shall we investigate first?`,
      timestamp: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
      followUpQuestions: [
        `Run full telemetry correlation for ${newSession.focusLot}`,
        `Inspect FDC chamber sensor drift on ${newSession.focusEquipment}`,
        "Compare wafer sort signature vs baseline",
        "Check inline defect density adder counts"
      ]
    }
  ];

  res.json({ session: newSession, messages: agentSessions[newId] });
});

app.delete("/api/agent/sessions/:session_id", (req, res) => {
  const { session_id } = req.params;
  sessionMetaList = sessionMetaList.filter(s => s.id !== session_id);
  delete agentSessions[session_id];
  res.json({ success: true });
});

app.get("/api/agent/history/:session_id", (req, res) => {
  const { session_id } = req.params;
  const messages = agentSessions[session_id] || [];
  res.json(messages);
});

app.post("/api/agent/query", (req, res) => {
  const { question, session_id, focusLot, focusEquipment } = req.body;
  const sessionId = session_id || "session_lot_109";

  if (!agentSessions[sessionId]) {
    agentSessions[sessionId] = [];
  }

  const session = sessionMetaList.find(s => s.id === sessionId);
  if (session) {
    session.updatedAt = new Date().toISOString();
    if (focusLot) session.focusLot = focusLot;
    if (focusEquipment) session.focusEquipment = focusEquipment;
  }

  const userMsg = {
    id: `msg_u_${Date.now()}`,
    role: "user",
    content: question,
    timestamp: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })
  };

  agentSessions[sessionId].push(userMsg);
  res.json({ session_id: sessionId, userMsg });
});

app.get("/api/agent/stream/:session_id", async (req, res) => {
  const { session_id } = req.params;
  const history = agentSessions[session_id] || [];
  const session = sessionMetaList.find(s => s.id === session_id);
  const targetLot = session?.focusLot || "LOT_109";
  const targetEquip = session?.focusEquipment || "EL23S18";

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
  sendEvent("thinking", `Correlating Fab telemetry across YMS (Lot ${targetLot}), FDC (Chamber ${targetEquip}), and WAT parametric database...`);

  // Live Simulated Tools Execution with Realistic Semiconductor Data
  const toolsExecuted: any[] = [];

  // Tool 1: Query Lot Telemetry
  await new Promise(r => setTimeout(r, 600));
  const lotToolResult = {
    lot_id: targetLot,
    yield_actual: targetLot === "LOT_109" ? 85.0 : 94.8,
    baseline_yield: 95.1,
    delta: targetLot === "LOT_109" ? -10.1 : -0.3,
    status: targetLot === "LOT_109" ? "HOLD" : "COMPLETE",
    tester: "Tester_04",
    failed_bins: [
      { bin: 106, name: "GateOx_Leakage (Ioff > 5nA)", count: 168, fallout_pct: 8.4 },
      { bin: 104, name: "Bridging_Defect", count: 76, fallout_pct: 3.8 },
      { bin: 201, name: "Open_Via_Contact", count: 42, fallout_pct: 2.1 }
    ],
    spatial_pattern: "Concentric Edge Ring Failure (Radius > 135mm)"
  };
  const t1 = { tool: "query_lot_telemetry", name: "YMS Lot CP Sort Query", params: { lot_id: targetLot }, status: "complete", executionTimeMs: 138, result: lotToolResult };
  toolsExecuted.push(t1);
  sendEvent("tool_call", t1);

  // Tool 2: FDC Chamber Sensor Traces
  await new Promise(r => setTimeout(r, 700));
  const fdcToolResult = {
    equipment_id: targetEquip,
    chamber: `${targetEquip}_PM3`,
    status: targetEquip === "EL23S18" ? "HOLD" : "PRODUCTION",
    alarms_count: targetEquip === "EL23S18" ? 15 : 0,
    anomalies: [
      { sensor: "CHAMBER_PRESSURE", actual: "31.2 mTorr", baseline: "24.5 mTorr", dtw_distance: 0.88, z_score: 3.4, status: "CRITICAL" },
      { sensor: "RF_MATCH_PHASE", actual: "14.2°", baseline: "3.1°", dtw_distance: 0.72, z_score: 2.9, status: "WARNING" },
      { sensor: "ESC_TEMP_UNIFORMITY", center_temp: "62.1°C", edge_temp: "54.3°C", delta: "7.8°C (Max allowed: 2.5°C)", status: "CRITICAL" }
    ]
  };
  const t2 = { tool: "query_fdc_chamber_traces", name: "FDC SVID Chamber Sensor Diagnostic", params: { equipment_id: targetEquip }, status: "complete", executionTimeMs: 254, result: fdcToolResult };
  toolsExecuted.push(t2);
  sendEvent("tool_call", t2);

  // Tool 3: WAT / PCM Parametric Correlation
  await new Promise(r => setTimeout(r, 500));
  const watToolResult = {
    parameters: [
      { name: "TOX_GATE_OXIDE", mean: "1.82 nm", target: "1.75 nm", cpk: 0.94, rule_violation: "Rule-5: 2 of 3 points > 2σ" },
      { name: "IOFF_LEAKAGE", mean: "12.4 nA/μm", target: "< 5.0 nA/μm", correlation_with_bin106: 0.91 }
    ],
    correlation_finding: "Strong spatial coupling between edge chamber pressure fluctuation, gate dielectric thinning, and Bin 106 Ioff fallout."
  };
  const t3 = { tool: "correlate_wat_pcm", name: "WAT / PCM Parametric Correlation", params: { parameters: ["TOX_GATE_OXIDE", "IOFF_LEAKAGE"] }, status: "complete", executionTimeMs: 180, result: watToolResult };
  toolsExecuted.push(t3);
  sendEvent("tool_call", t3);

  // Define structured RCA hypotheses & recommendations
  const hypotheses = [
    {
      id: "hyp_1",
      name: "Plasma Sheath Compression & RF Bias Non-Uniformity",
      category: "PLASMA_ETCH",
      likelihood: 94,
      status: "CONFIRMED",
      supportingEvidence: `Chamber pressure on ${targetEquip}_PM3 surged to 31.2 mTorr (DTW distance 0.88), collapsing the plasma boundary sheath near wafer bevel (r > 135mm). This produced excessive reactive ion bombardment.`,
      suggestedTest: "Apply -2.5V bias offset to restore uniform ion flux across outer radial zones."
    },
    {
      id: "hyp_2",
      name: "Chamber ESC Chuck Helium Backside Leak",
      category: "PLASMA_ETCH",
      likelihood: 48,
      status: "INVESTIGATING",
      supportingEvidence: "ESC temperature shows a 7.8°C thermal gradient (62.1°C center vs 54.3°C edge), which can occur if backside helium flow is leaking at edge seal.",
      suggestedTest: "Run automated helium rate-of-rise test on EL23S18 chuck."
    },
    {
      id: "hyp_3",
      name: "Pre-Clean Wet Etch Slurry Contamination",
      category: "CMP_PLANARIZATION",
      likelihood: 14,
      status: "RULED_OUT",
      supportingEvidence: "CMP-05 has low health score (68), but KLA defect inspection confirms no slurry scratches on wafer center or mid-radius.",
      counterEvidence: "WAT Tox thickness is unblemished in center; failure is 100% radial edge ring."
    }
  ];

  const recommendations = [
    {
      id: `rec_${Date.now()}_1`,
      title: "Immediate Containment: Maintain Engineering Hold on LOT_109",
      type: "LOT_HOLD",
      severity: "CRITICAL",
      confidence: 96,
      target: targetLot,
      description: `Hold all 20 wafers of ${targetLot} to prevent scrap propagation through bumping and wire-bonding.`,
      suggestedAction: `Set ${targetLot} to HOLD with HOT priority tag.`,
      impactEstimate: "Safeguards $86,000 in downstream packaging cost and zero customer escape risk.",
      status: "READY",
      actionPayload: { lot_id: targetLot, priority: "HOT" }
    },
    {
      id: `rec_${Date.now()}_2`,
      title: "Recipe Setpoint Offset: Adjust RF Bias by -2.5V on EL23S18",
      type: "RECIPE_ADJUST",
      severity: "HIGH",
      confidence: 92,
      target: targetEquip,
      description: `Shift RF bias voltage from 145.0V to 142.5V (-2.5V offset) on ${targetEquip} to widen edge sheath and correct over-etch.`,
      suggestedAction: "Push recipe delta to chamber controller and execute 1 test coupon wafer.",
      impactEstimate: "+9.2% expected yield recovery on next scheduled wafer run.",
      status: "READY",
      actionPayload: { equipment_id: targetEquip, biasOffsetV: -2.5 }
    },
    {
      id: `rec_${Date.now()}_3`,
      title: "Chamber Interlock & Maintenance: Trigger Clean Cycle on CMP-05",
      type: "PM_SCHEDULE",
      severity: "MEDIUM",
      confidence: 89,
      target: "CMP-05",
      description: "Clean diamond conditioner disc and calibrate slurry flow rate before processing next N5 critical lot.",
      suggestedAction: "Set CMP-05 status to MAINTENANCE for 2-hour automated DIW flush.",
      impactEstimate: "Prevents secondary thickness variation across subsequent production lots.",
      status: "READY",
      actionPayload: { equipment_id: "CMP-05" }
    }
  ];

  const followUpQuestions = [
    `Simulate the yield recovery if we apply the -2.5V bias offset to ${targetEquip}`,
    `Run helium backside leak diagnostic on ${targetEquip} ESC chuck`,
    `Generate an 8D Root Cause Analysis report for Lot ${targetLot}`,
    "What other lots were processed on EL23S18 during this pressure excursion?"
  ];

  const simulationData = {
    metric: "Gross CP Yield",
    before: 85.0,
    after: 94.4,
    unit: "%",
    improvement: "+9.4% Recovery"
  };

  // Construct Gemini Multi-Turn Prompt Context
  const previousTurns = history.slice(0, -1);
  let conversationText = "";
  for (const msg of previousTurns) {
    conversationText += `${msg.role === "user" ? "Engineer" : "Semimind AI"}: ${msg.content}\n\n`;
  }
  conversationText += `Engineer: ${latestQuery}\n`;

  const promptContext = `You are Semimind++, a world-class Semiconductor Yield Intelligence and Root Cause Analysis (RCA) AI partner for fab process engineers.
Active Fab Context:
- Target Lot: ${targetLot} (Gross yield: 85.0%, SBL breached, Bin 106 GateOx Leakage 8.4%, spatial signature: concentric edge ring r > 135mm).
- Target Equipment: ${targetEquip}_PM3 (Chamber pressure 31.2 mTorr vs 24.5 baseline, DTW distance 0.88, ESC temp gradient center 62.1°C vs edge 54.3°C).
- Parametric WAT: TOX_GATE_OXIDE mean 1.82nm (Rule-5 violation, Cpk 0.94), IOFF_LEAKAGE 12.4 nA/μm (Pearson r=0.91 with Bin 106).
- Other Equipment: CMP-05 (Health 68/100, PM due), ETCH-07 (DOWN, pressure anomaly).

Previous Conversation History:
${conversationText}

Engineer's Question: "${latestQuery}"

Provide an authoritative, highly collaborative, and mathematically clear response:
1. Directly answer the engineer's question with precise semiconductor physics (plasma boundary sheath, RF match phase impedance, ion angular distribution, reactive chemical species).
2. Detail the confirmed root cause mechanism vs alternative hypotheses considered and ruled out.
3. Outline immediate containment actions, process recipe offset parameters, and equipment PM steps.
4. Conclude with proactive recommendations for next collaborative verification steps.
Speak directly as a senior fab data scientist and process engineer colleague. Do not use generic filler words.`;

  let fullResponseText = "";
  const client = getAiClient();

  if (client) {
    try {
      const responseStream = await client.models.generateContentStream({
        model: "gemini-3.8-flash",
        contents: promptContext,
        config: {
          systemInstruction: "You are Semimind++, a top-tier semiconductor process and yield intelligence data scientist. Communicate concisely, rigorously, and collaboratively. Use structured Markdown."
        }
      });

      for await (const chunk of responseStream) {
        const text = chunk.text || "";
        fullResponseText += text;
        sendEvent("chunk", text);
      }
    } catch (err) {
      console.error("Gemini API stream failed:", err);
      fullResponseText = await generateFallbackStream(latestQuery, targetLot, targetEquip, sendEvent);
    }
  } else {
    fullResponseText = await generateFallbackStream(latestQuery, targetLot, targetEquip, sendEvent);
  }

  // Send metadata for hypotheses, recommendations, and follow-ups
  sendEvent("rca_metadata", {
    hypotheses,
    recommendations,
    followUpQuestions,
    simulationData
  });

  // Save the complete agent response in session history
  const agentMsg = {
    id: `msg_a_${Date.now()}`,
    role: "agent",
    content: fullResponseText,
    timestamp: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
    toolsUsed: toolsExecuted,
    hypotheses,
    recommendations,
    followUpQuestions,
    simulationData
  };

  history.push(agentMsg);

  sendEvent("complete", "RCA analysis complete.");
  res.end();
});

async function generateFallbackStream(query: string, targetLot: string, targetEquip: string, sendEvent: Function): Promise<string> {
  const queryLower = query.toLowerCase();
  let text = "";

  if (queryLower.includes("dtw") || queryLower.includes("distance") || queryLower.includes("sensor") || queryLower.includes("trace")) {
    text = `### Sensor Trace Deep-Dive: ${targetEquip}_PM3

Examining the Dynamic Time Warping (DTW) sensor traces for **${targetEquip}**:
1. **Chamber Pressure Drift**:
   - Baseline: **24.5 mTorr** ± 0.8 mTorr
   - Lot Processing Excursion: **31.2 mTorr** (+27.3% spike during Step 04 Main Etch)
   - DTW Distance: **0.88** against the golden chamber trace model (Z-score: **+3.4σ**, severe excursion).
2. **RF Match Phase Angle**:
   - Shifted from **3.1°** to **14.2°**, indicating abnormal plasma impedance and reactive capacitance imbalance.
3. **Physical Mechanism**:
   - The elevated pressure compressed the Debye length and narrowed the plasma boundary sheath near the wafer edge bevel ($r > 135\\text{mm}$).
   - This concentrated ion flux density into a radial ring, producing a localized gate oxide over-etch of approximately **0.18 nm** into the silicon substrate, inducing severe dielectric tunneling breakdown (**Bin 106**).`;
  } else if (queryLower.includes("bias") || queryLower.includes("offset") || queryLower.includes("recipe") || queryLower.includes("simulate")) {
    text = `### Recipe Setpoint Optimization & Yield Simulation

To compensate for the edge sheath compression on **${targetEquip}**, we modeled the ion energy distribution function (IEDF) across radial zones:

#### Recommended Recipe Modification:
- **Parameter**: RF Bias Generator Setpoint
- **Current Setpoint**: **145.0 V**
- **Recommended Setpoint**: **142.5 V** (Apply **-2.5 V** delta offset)
- **Secondary Tuning**: Reduce Ar carrier gas flow from **120 sccm** to **112 sccm** during step 04 to stabilize chamber pressure back to **24.8 mTorr**.

#### Projected Simulation Impact:
- **Baseline Yield (LOT_109)**: **85.0%**
- **Simulated Recovery**: **94.4%** (**+9.4%** recovery)
- **Defect Fallout Reduction**: Bin 106 fallout drops from **8.4%** to **< 0.8%**.
- **Financial Protection**: Recovers approximately **$47,200** per 25-wafer lot in avoided scrap.`;
  } else if (queryLower.includes("cmp") || queryLower.includes("pad") || queryLower.includes("slurry")) {
    text = `### CMP-05 Commonality & Correlation Review

We evaluated whether **CMP-05** contributed to the defect signature:
1. **Equipment Status**: CMP-05 Health Score is currently **68/100** with 3 warning alarms regarding pad conditioner glaze.
2. **Inline Defect Geometry**: KLA-2920 broad-band inspection of ${targetLot} reveals zero radial slurry chatter marks or micro-scratches.
3. **Conclusion**:
   - CMP-05 pad condition is **NOT** the root cause of the Bin 106 gate leakage on ${targetLot}.
   - However, because CMP-05 pad conditioner arm torque is +18% above spec, we recommend executing the scheduled PM clean to protect subsequent lots from planarity drift.`;
  } else if (queryLower.includes("8d") || queryLower.includes("report")) {
    text = `### 8D Root Cause Analysis (RCA) Report: Excursion on ${targetLot}

**D1 — Champion Team**:
- Process Integration Engineer (Lead), Fab Etch Area Owner, Semimind++ AI Assistant.

**D2 — Problem Statement**:
- ${targetLot} suffered a **10.1%** yield drop (85.0% actual vs 95.1% baseline) due to an edge ring signature of Bin 106 gate oxide breakdown on Tester_04.

**D3 — Interim Containment Actions (ICA)**:
- Placed ${targetLot} on engineering HOLD with HOT tag.
- Interlocked chamber **${targetEquip}_PM3** from new production lot dispatch.

**D4 — Root Cause Analysis (RCA)**:
- Root Cause: MFC-03 gas calibration drift elevated chamber pressure to 31.2 mTorr (DTW 0.88), compressing the plasma sheath and inducing edge gate-oxide over-etch.

**D5 — Permanent Corrective Actions (PCA)**:
- Recalibrate RF Bias setpoint by **-2.5V** on ${targetEquip}.
- Replace MFC-03 gas mass flow sensor and re-zero baseline.

**D6 — Validation Plan**:
- Process 1 test monitor wafer; confirm Tox within $1.75\\text{nm} \\pm 0.04\\text{nm}$ and Bin 106 fallout $< 0.5\\%$.

**D7 — Preventive Actions**:
- Tighten SPC Rule-5 alarm threshold from 3.0σ to 2.2σ on chamber pressure.`;
  } else {
    text = `### Semimind++ RCA Diagnostic: ${targetLot} on ${targetEquip}

Cross-domain correlation confirms a confirmed root cause mechanism for the yield drop:
1. **Symptom Signature**:
   - Gross Yield dropped to **85.0%** (Soft Bin Limit breach).
   - Spatial Signature: 100% of Bin 106 failure dies are clustered in the wafer perimeter zone ($r > 135\\text{mm}$).
2. **Chamber Fingerprint**:
   - Lot was processed on **${targetEquip}_PM3**, which experienced an abnormal pressure excursion of **31.2 mTorr** (DTW distance **0.88**).
3. **Physical Root Cause**:
   - High chamber pressure altered plasma sheath dynamics, increasing ion directional dispersion and edge over-etch.
   - WAT confirms gate-oxide thinning ($T_{\\text{ox}} = 1.82\\text{nm}$ vs $1.75\\text{nm}$ target, Rule-5 violation), directly driving Bin 106 leakage current.

#### Recommended Action Plan:
- **Containment**: Hold ${targetLot} for cross-section confirmation.
- **Process Offset**: Apply **-2.5V** RF bias offset to ${targetEquip}.
- **Tool Interlock**: Clean pad conditioner on CMP-05.`;
  }

  const tokens = text.split(" ");
  for (const token of tokens) {
    sendEvent("chunk", token + " ");
    await new Promise(r => setTimeout(r, 22));
  }

  return text;
}

// 1-Click Recommendation Execution
app.post("/api/agent/apply-recommendation", (req, res) => {
  const { recommendation_id, action_type, target, details, auto_approve, impact } = req.body;

  if (auto_approve) {
    if (action_type === "LOT_HOLD") {
      const lot = lots.find(l => l.lot_id === target);
      if (lot) {
        lot.status = "HOLD";
        lot.priority = "HOT";
      }
      alarms.unshift({
        id: Date.now(),
        type: "critical",
        title: `AI Autonomous Hold Applied — ${target}`,
        meta: details || "Contained by Semimind++ RCA recommendation",
        time: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })
      });
    } else if (action_type === "RECIPE_ADJUST") {
      const tool = equipment.find(e => e.equipment_id === target);
      if (tool) {
        tool.status = "QUALIFICATION";
      }
      alarms.unshift({
        id: Date.now(),
        type: "info",
        title: `Recipe Offset Applied — ${target}`,
        meta: details || "RF Bias adjusted by -2.5V. Tool in Qualification mode.",
        time: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })
      });
    } else if (action_type === "PM_SCHEDULE") {
      const tool = equipment.find(e => e.equipment_id === target);
      if (tool) {
        tool.status = "MAINTENANCE";
        tool.health = 85;
      }
      alarms.unshift({
        id: Date.now(),
        type: "warning",
        title: `PM Interlock Active — ${target}`,
        meta: details || "Scheduled pad conditioner maintenance cycle.",
        time: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })
      });
    }
  } else {
    // Add to pending approvals queue
    pendingAgentActions.unshift({
      id: `act_${Date.now()}`,
      type: action_type,
      target,
      desc: details || `AI Proposed Action for ${target}`,
      confidence: 94,
      status: "PENDING",
      impact
    });
  }

  res.json({
    success: true,
    action_type,
    target,
    lots,
    equipment,
    alarms,
    pendingActions: pendingAgentActions
  });
});

// Interactive Yield Simulation
app.post("/api/agent/simulate-solution", (req, res) => {
  const { scenario, targetLot, biasOffsetV } = req.body;
  const baseline = targetLot === "LOT_109" ? 85.0 : 91.2;
  const offset = biasOffsetV || -2.5;
  const recovery = Math.min(9.5, Math.abs(offset) * 3.76);
  const projected = +(baseline + recovery).toFixed(2);

  res.json({
    success: true,
    scenario: scenario || "RF Bias Offset & Sheath Uniformity Correction",
    baselineYield: baseline,
    projectedYield: projected,
    deltaYieldPct: +recovery.toFixed(2),
    defectReductionPct: 91.4,
    costSavingsUsd: 47200,
    scrapRiskReduction: "98.2%",
    confidenceScore: 94
  });
});

// 8D RCA Report Export
app.get("/api/agent/export-8d/:session_id", (req, res) => {
  const { session_id } = req.params;
  const session = sessionMetaList.find(s => s.id === session_id);
  const targetLot = session?.focusLot || "LOT_109";
  const targetEquip = session?.focusEquipment || "EL23S18";

  const report = `# FORMAL 8D ROOT CAUSE ANALYSIS & RESOLUTION REPORT
**Fab**: FAB-12 (N5 FinFET / GAA Node)  
**Document ID**: 8D-RCA-${targetLot}-${Date.now().toString().slice(-6)}  
**Date**: ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}  
**Status**: APPROVED & CONTAINED  

---

### D1: Team Members
- **Lead Investigator**: Senior Yield Integration Staff Engineer
- **Domain Co-pilot**: Semimind++ Autonomous Yield Intelligence
- **Process Equipment Owner**: Etch / CVD Module Lead
- **Metrology Specialist**: WAT / Defect DMS Lead

### D2: Problem Statement
Gross probe yield on **${targetLot}** (Product_01 on Tester_04) dropped to **85.00%** (−10.1% excursion below the 95.1% baseline), breaching the fab Soft Bin Limit (SBL). The yield loss was driven primarily by **Bin 106** (Gate Oxide Leakage Breakdown / $I_{\\text{off}}$) with an extreme outer edge ring spatial signature ($r > 135\\text{mm}$).

### D3: Interim Containment Actions (ICA)
1. Placed **${targetLot}** on immediate engineering **HOLD** with **HOT** priority tag to block shipment and packaging assembly.
2. Interlocked process chamber **${targetEquip}_PM3** from accepting subsequent production lots.
3. Conducted inline automated screening on sister lots (${session?.focusLot || "LOT_109"}, LOT_110).

### D4: Root Cause Verification (RCA)
- **Root Cause**: During step 04 main etch on chamber **${targetEquip}_PM3**, MFC gas drift caused chamber pressure to spike to **31.2 mTorr** (DTW distance **0.88**, $+3.4\\sigma$).
- **Physics Mechanism**: The high chamber pressure narrowed the plasma Debye sheath at the outer radius, producing non-uniform ion bombardment and excessive gate oxide erosion ($T_{\\text{ox}} = 1.82\\text{nm}$, Rule-5 SPC violation), inducing catastrophic gate dielectric leakage.
- **Ruled-Out Hypotheses**: CMP-05 pad scratching (ruled out by defect inspection) and lithography overlay drift (ruled out by scatterometry).

### D5: Permanent Corrective Actions (PCA)
1. **Recipe Offset**: Calibrated RF bias voltage setpoint by **-2.5V** (145.0V $\\rightarrow$ 142.5V) on **${targetEquip}** to restore uniform plasma boundary sheath.
2. **Gas Calibration**: Replaced mass flow controller transducer on chamber ${targetEquip}_PM3.
3. **Maintenance**: Executed 2-hour pad conditioner diamond flush on CMP-05.

### D6: Corrective Action Validation
- Processed 1 test monitor qualification wafer on **${targetEquip}**.
- Verified $T_{\\text{ox}}$ gate oxide thickness within target: $1.75\\text{nm} \\pm 0.03\\text{nm}$.
- Bin 106 defect fallout dropped from 8.4% to 0.42%. Projected yield recovery: **+9.4%**.

### D7: Preventive Action & Standardization
- Tightened FDC SVID chamber pressure SPC Rule-5 alarm threshold from $3.0\\sigma$ to $2.2\\sigma$.
- Integrated Semimind++ automated real-time excursion interlock for all N5 plasma chambers.

### D8: Team Sign-Off
- **Approved by**: Yield Management Steering Committee & Quality Assurance Director.
`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(report);
});

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
