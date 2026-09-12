import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  CheckCircle,
  XCircle,
  Brain,
  Terminal,
  Loader2,
  Sparkles,
  RefreshCw,
  Plus,
  FileText,
  Sliders,
  ChevronRight,
  FolderTree,
  ShieldAlert,
  Zap,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  Code2,
  Radio,
  Map,
  BarChart2,
  Bug,
  UserCheck,
  ExternalLink
} from "lucide-react";
import { Lot, Equipment, Alarm, AgentAction, Message, InvestigationSession, AiRecommendation, RcaHypothesis, EngineerVerdict } from "../types";
import RcaHypothesisTree from "./RcaHypothesisTree";
import AiRecommendationCard from "./AiRecommendationCard";
import ToolExecutionViewer from "./ToolExecutionViewer";
import YieldSimulationModal from "./YieldSimulationModal";
import Report8DModal from "./Report8DModal";
import MarkdownRenderer from "./MarkdownRenderer";
import RcaEvidenceInspectorModal from "./RcaEvidenceInspectorModal";

interface AgentChatProps {
  lots: Lot[];
  equipment: Equipment[];
  pendingActions: AgentAction[];
  onActionExecuted: () => void;
  onNavigateTab?: (tabId: "yms" | "wat" | "cp" | "spc" | "fdc" | "defect" | "msc" | "traces" | "agent" | "fab" | "mrb" | "burnin") => void;
}

export default function AgentChat({ lots, equipment, pendingActions, onActionExecuted, onNavigateTab }: AgentChatProps) {
  // Sessions state
  const [sessions, setSessions] = useState<InvestigationSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("session_lot_109");
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionLot, setNewSessionLot] = useState("LOT_109");
  const [newSessionEquip, setNewSessionEquip] = useState("EL23S18");

  // Messages and streaming state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const [activeTools, setActiveTools] = useState<{ tool: string; params: any; status: string }[]>([]);
  const [currentMetadata, setCurrentMetadata] = useState<{
    hypotheses?: RcaHypothesis[];
    recommendations?: AiRecommendation[];
    followUpQuestions?: string[];
    simulationData?: any;
  } | null>(null);

  // Modals state
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [is8DModalOpen, setIs8DModalOpen] = useState(false);
  const [simRecommendation, setSimRecommendation] = useState<AiRecommendation | null>(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [evidenceInitialDomain, setEvidenceInitialDomain] = useState<"fdc" | "cp" | "wat" | "spc" | "defect" | "verdict">("fdc");
  const [engineerVerdict, setEngineerVerdict] = useState<EngineerVerdict | null>(null);

  const handleOpenEvidence = (domain: "fdc" | "cp" | "wat" | "spc" | "defect" | "verdict" = "fdc") => {
    setEvidenceInitialDomain(domain);
    setIsEvidenceModalOpen(true);
  };

  // Message view mode & copy state
  const [msgViewMode, setMsgViewMode] = useState<Record<string, "rendered" | "raw">>({});
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const toggleMsgViewMode = (id: string) => {
    setMsgViewMode((prev) => ({
      ...prev,
      [id]: prev[id] === "raw" ? "rendered" : "raw",
    }));
  };

  const copyMessageContent = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Load sessions list on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Load history when active session changes
  useEffect(() => {
    if (!activeSessionId) return;
    loadSessionHistory(activeSessionId);
  }, [activeSessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentResponse, activeTools]);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/agent/sessions");
      const data = await res.json();
      setSessions(data);
      if (data.length > 0 && !activeSessionId) {
        setActiveSessionId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  const loadSessionHistory = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/agent/history/${sessionId}`);
      const history = await res.json();
      setMessages(history);
      setCurrentResponse("");
      setCurrentMetadata(null);
      setActiveTools([]);
    } catch (err) {
      console.error("Failed to fetch session history", err);
    }
  };

  const handleCreateSession = async () => {
    try {
      const res = await fetch("/api/agent/sessions/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `RCA Excursion — ${newSessionLot} (${newSessionEquip})`,
          focusLot: newSessionLot,
          focusEquipment: newSessionEquip
        })
      });
      const data = await res.json();
      setSessions((prev) => [data.session, ...prev]);
      setActiveSessionId(data.session.id);
      setMessages(data.messages || []);
      setIsCreatingSession(false);
    } catch (err) {
      console.error("Failed to create new session", err);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || streaming) return;

    if (!textToSend) setInputValue("");

    const activeSession = sessions.find((s) => s.id === activeSessionId);
    const targetLot = activeSession?.focusLot || "LOT_109";
    const targetEquip = activeSession?.focusEquipment || "EL23S18";

    // Add user message to UI immediately
    const userMsg: Message = {
      id: `msg_u_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })
    };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);
    setCurrentResponse("");
    setCurrentMetadata(null);
    setActiveTools([]);

    try {
      // 1. Post query to server
      const queryRes = await fetch("/api/agent/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          session_id: activeSessionId,
          focusLot: targetLot,
          focusEquipment: targetEquip
        })
      });
      const queryData = await queryRes.json();
      const sessionId = queryData.session_id || activeSessionId;

      // 2. Open EventSource for SSE streaming
      const eventSource = new EventSource(`/api/agent/stream/${sessionId}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "thinking") {
            setActiveTools([
              { tool: "Fab Cross-Correlation Engine", params: { context: data.content }, status: "running" }
            ]);
          } else if (data.type === "tool_call") {
            setActiveTools((prev) => [
              ...prev.map((t) => (t.status === "running" ? { ...t, status: "complete" } : t)),
              { tool: data.content.name || data.content.tool, params: data.content.params, status: "complete" }
            ]);
          } else if (data.type === "chunk") {
            setCurrentResponse((prev) => prev + data.content);
          } else if (data.type === "rca_metadata") {
            setCurrentMetadata(data.content);
          } else if (data.type === "complete") {
            // Re-fetch full history to ensure state consistency
            loadSessionHistory(sessionId);
            setStreaming(false);
            setCurrentResponse("");
            setActiveTools([]);
            eventSource.close();
            onActionExecuted();
            fetchSessions();
          } else if (data.type === "error") {
            console.error("SSE Stream error:", data.content);
            setStreaming(false);
            eventSource.close();
          }
        } catch (parseErr) {
          console.error("SSE payload parsing error", parseErr);
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE connection closed or error", err);
        setStreaming(false);
        eventSource.close();
        loadSessionHistory(sessionId);
      };
    } catch (err) {
      console.error("Agent query failed:", err);
      setStreaming(false);
    }
  };

  const handleRecommendationExecute = async (rec: AiRecommendation, autoApprove: boolean) => {
    try {
      const res = await fetch("/api/agent/apply-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendation_id: rec.id,
          action_type: rec.type,
          target: rec.target,
          details: rec.suggestedAction || rec.description,
          impact: rec.impactEstimate,
          auto_approve: autoApprove
        })
      });
      const data = await res.json();
      if (data.success) {
        onActionExecuted();
        // Add confirmation message to chat
        const confirmMsg: Message = {
          id: `msg_conf_${Date.now()}`,
          role: "agent",
          content: autoApprove
            ? `✅ **Executed Real-Time Control Change**: Applied **${rec.type}** on **${rec.target}**. Controller setpoints and fab dispatch rules updated.`
            : `📋 **Queued For Human Approval**: Proposal for **${rec.type}** on **${rec.target}** transferred to engineering review queue.`,
          timestamp: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, confirmMsg]);
      }
    } catch (err) {
      console.error("Failed to execute recommendation", err);
    }
  };

  const handleAction = async (actionId: string, approve: boolean) => {
    try {
      const res = await fetch("/api/robot/execute-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_id: actionId, approve })
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "agent",
            content: `✅ Action **${approve ? "APPROVED" : "REJECTED"}**: Control instruction sent to fab controllers.`,
            timestamp: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })
          }
        ]);
        onActionExecuted();
      }
    } catch (err) {
      console.error("Action execution failed:", err);
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  return (
    <div className="space-y-4" id="agent-chat-root">
      {/* TOP WORKSPACE CONTROLS & SESSION SELECTOR */}
      <div className="bg-[#131B2E] border border-white/5 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
            <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
            <span>Semimind++ Autonomous RCA Engine</span>
          </div>

          {/* Session Switcher Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                  activeSessionId === s.id
                    ? "bg-[#00E5C4]/15 border-[#00E5C4]/40 text-[#00E5C4]"
                    : "bg-[#0A0F1C] border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10"
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>{s.title}</span>
                <span className="px-1.5 py-0.2 rounded bg-white/10 text-[9px] font-mono">
                  {s.messageCount || 0}
                </span>
              </button>
            ))}

            <button
              onClick={() => setIsCreatingSession(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#00E5C4] hover:bg-[#00E5C4]/10 border border-[#00E5C4]/20 transition-all whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New RCA Session</span>
            </button>
          </div>
        </div>

        {/* Global Action Modals */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEvidence("fdc")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00E5C4]/15 hover:bg-[#00E5C4]/25 border border-[#00E5C4]/30 text-[#00E5C4] text-xs font-semibold transition-all shadow-sm"
            title="Inspect Cross-Domain Telemetry Proof & Data Tracing"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Evidence &amp; Tracing</span>
            <span className="w-2 h-2 rounded-full bg-[#00E5C4] animate-pulse" />
          </button>

          <button
            onClick={() => {
              setSimRecommendation(null);
              setIsSimModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-all"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Yield Simulator</span>
          </button>

          <button
            onClick={() => setIs8DModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-semibold transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-[#00E5C4]" />
            <span>Export 8D Report</span>
          </button>
        </div>
      </div>

      {/* NEW SESSION CREATION MODAL */}
      {isCreatingSession && (
        <div className="p-4 bg-[#131B2E] border border-[#00E5C4]/30 rounded-2xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#00E5C4]/10 text-[#00E5C4]">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-100">Create New Investigation Workspace</h4>
              <p className="text-[11px] text-slate-400">Initialize multi-domain correlation for lot or equipment</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-mono">Focus Lot:</span>
              <select
                value={newSessionLot}
                onChange={(e) => setNewSessionLot(e.target.value)}
                className="bg-[#0A0F1C] border border-white/10 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#00E5C4]"
              >
                {lots.map((l) => (
                  <option key={l.lot_id} value={l.lot_id}>
                    {l.lot_id} ({l.yield}% · {l.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-mono">Target Tool:</span>
              <select
                value={newSessionEquip}
                onChange={(e) => setNewSessionEquip(e.target.value)}
                className="bg-[#0A0F1C] border border-white/10 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#00E5C4]"
              >
                {equipment.map((e) => (
                  <option key={e.equipment_id} value={e.equipment_id}>
                    {e.equipment_id} ({e.name} · {e.status})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCreateSession}
              className="px-4 py-1.5 bg-[#00E5C4] hover:bg-[#00c4a7] text-[#0A0F1C] text-xs font-semibold rounded-xl transition-all shadow-sm"
            >
              Start Investigation
            </button>
            <button
              onClick={() => setIsCreatingSession(false)}
              className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* INTERACTIVE CHAT & RCA TIMELINE (Left & Center Columns) */}
        <div className="lg:col-span-2 bg-[#131B2E] border border-white/5 rounded-2xl p-5 flex flex-col h-[640px] relative">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <h3 className="font-display text-sm font-semibold text-slate-200">
                  {activeSession?.title || "Semimind++ Yield Intelligence Co-Pilot"}
                </h3>
                <span className="text-[10px] text-[#00E5C4] font-mono">
                  FOCUS: Lot {activeSession?.focusLot || "LOT_109"} · Chamber {activeSession?.focusEquipment || "EL23S18"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-[#0A0F1C] px-2.5 py-1 rounded-lg border border-white/5">
              <span>gemini-3.8-flash</span>
              <span className="text-emerald-400">● LIVE</span>
            </div>
          </div>

          {/* MESSAGES FLOW */}
          <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-2">
            {messages.map((m, i) => (
              <div
                key={m.id || i}
                className={`flex flex-col max-w-[92%] ${
                  m.role === "user" ? "ml-auto items-end" : "mr-auto items-start w-full"
                }`}
              >
                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed w-full ${
                    m.role === "user"
                      ? "bg-[#00E5C4]/15 border border-[#00E5C4]/30 text-slate-200 rounded-br-none ml-auto max-w-[85%]"
                      : "bg-[#0A0F1C] border border-white/10 text-slate-200 rounded-bl-none shadow-lg"
                  }`}
                >
                  {/* Tool Execution Badges */}
                  {m.toolsUsed && m.toolsUsed.length > 0 && (
                    <ToolExecutionViewer tools={m.toolsUsed} />
                  )}

                  {/* Message Content Parser */}
                  {m.role === "user" ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  ) : (
                    <div>
                      {/* AI Response Top Controls */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[10px] font-mono text-slate-400">
                        <div className="flex items-center gap-1.5 text-[#00E5C4]">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span className="font-semibold tracking-wide">Semimind++ RCA Diagnostics</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleMsgViewMode(m.id || `msg_${i}`)}
                            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-1 border border-white/5"
                            title="Toggle between Rendered HTML and Raw Markdown"
                          >
                            <Code2 className="w-3 h-3 text-purple-400" />
                            <span>
                              {msgViewMode[m.id || `msg_${i}`] === "raw" ? "Formatted View" : "View Raw MD"}
                            </span>
                          </button>
                          <button
                            onClick={() => copyMessageContent(m.id || `msg_${i}`, m.content)}
                            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-1 border border-white/5"
                            title="Copy response markdown"
                          >
                            {copiedMsgId === (m.id || `msg_${i}`) ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {msgViewMode[m.id || `msg_${i}`] === "raw" ? (
                        <pre className="p-3 bg-[#070B14] rounded-lg border border-white/10 font-mono text-[11px] text-slate-300 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                          {m.content}
                        </pre>
                      ) : (
                        <MarkdownRenderer content={m.content} />
                      )}
                    </div>
                  )}

                  {/* Multi-Domain Proof & Data Tracing Bar */}
                  {m.role === "agent" && (
                    <div className="mt-3 p-3 bg-[#070B14] rounded-xl border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#00E5C4]">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span className="font-semibold uppercase tracking-wider">
                            Domain Proof &amp; Telemetry Tracing:
                          </span>
                        </div>
                        <button
                          onClick={() => handleOpenEvidence("verdict")}
                          className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Engineer Sign-off / Verdict</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => handleOpenEvidence("fdc")}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-[10px] font-mono transition-colors"
                          title="Inspect 60-second chamber pressure & RF match traces"
                        >
                          <Radio className="w-3 h-3 text-sky-400" />
                          <span>FDC: 31.2 mTorr (DTW 0.88, +3.4σ)</span>
                        </button>

                        <button
                          onClick={() => handleOpenEvidence("cp")}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono transition-colors"
                          title="Inspect CP Sort radial yield cliff & Pareto"
                        >
                          <Map className="w-3 h-3 text-emerald-400" />
                          <span>CP: Bin 106 Edge Ring (8.4%)</span>
                        </button>

                        <button
                          onClick={() => handleOpenEvidence("wat")}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-mono transition-colors"
                          title="Inspect gate oxide thickness histogram & Ioff correlation"
                        >
                          <Sliders className="w-3 h-3 text-purple-400" />
                          <span>WAT: Tox 1.82nm (Cpk 0.94, r=0.91)</span>
                        </button>

                        <button
                          onClick={() => handleOpenEvidence("spc")}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-mono transition-colors"
                          title="Inspect Western Electric Rule-5 & Rule-1 run alarms"
                        >
                          <BarChart2 className="w-3 h-3 text-amber-400" />
                          <span>SPC: Rule-5 Out-of-Control (+3σ)</span>
                        </button>

                        <button
                          onClick={() => handleOpenEvidence("defect")}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-mono transition-colors"
                          title="Inspect inline defect zone density & classification"
                        >
                          <Bug className="w-3 h-3 text-rose-400" />
                          <span>Defect: 92x Bevel Adder Density</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* RCA Hypothesis Matrix Card */}
                  {m.hypotheses && m.hypotheses.length > 0 && (
                    <RcaHypothesisTree
                      hypotheses={m.hypotheses}
                      onTestRequested={(hyp) => {
                        handleSend(`Run physical validation check on hypothesis: "${hyp.name}"`);
                      }}
                      onInspectEvidence={(hyp, domain) => {
                        handleOpenEvidence(domain || "fdc");
                      }}
                    />
                  )}

                  {/* Actionable Recommendations Cards */}
                  {m.recommendations && m.recommendations.length > 0 && (
                    <AiRecommendationCard
                      recommendations={m.recommendations}
                      onExecute={handleRecommendationExecute}
                      onSimulate={(rec) => {
                        setSimRecommendation(rec);
                        setIsSimModalOpen(true);
                      }}
                    />
                  )}
                </div>

                <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">
                  {m.role === "user" ? "Process Engineer" : "Semimind++"} · {m.timestamp}
                </span>
              </div>
            ))}

            {/* LIVE STREAMING & ACTIVE TOOL PROGRESS */}
            {streaming && (
              <div className="flex flex-col mr-auto items-start w-full max-w-[92%] gap-2 animate-in fade-in duration-150">
                {activeTools.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 bg-slate-900 border border-white/10 rounded-lg text-[10px] font-mono text-slate-400 w-full"
                  >
                    <Terminal className="w-3.5 h-3.5 text-[#00E5C4]" />
                    <span>
                      Querying Fab Telemetry: <strong className="text-[#00E5C4]">{t.tool}</strong>
                    </span>
                    {t.status === "running" && <Loader2 className="w-3 h-3 text-[#00E5C4] animate-spin ml-auto" />}
                    {t.status === "complete" && <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-auto" />}
                  </div>
                ))}

                {currentResponse && (
                  <div className="p-4 rounded-2xl text-xs leading-relaxed bg-[#0A0F1C] border border-white/10 text-slate-200 rounded-bl-none w-full shadow-lg">
                    <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-white/5 text-[10px] font-mono text-[#00E5C4]">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      <span className="font-semibold tracking-wide">Synthesizing RCA Findings & Physics Model...</span>
                    </div>
                    <MarkdownRenderer content={currentResponse} />
                    <span className="inline-block w-2 h-3.5 bg-[#00E5C4] animate-pulse ml-0.5 align-middle mt-1" />
                  </div>
                )}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* DYNAMIC COLLABORATION FOLLOW-UP QUESTIONS */}
          {!streaming && messages.length > 0 && (
            <div className="py-2 border-t border-white/5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mb-1.5">
                <HelpCircle className="w-3 h-3 text-purple-400" />
                <span>Suggested Follow-Up Engineering Inquiries:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {(
                  messages[messages.length - 1]?.followUpQuestions || [
                    "What was the exact DTW distance on chamber pressure for EL23S18?",
                    "Simulate yield recovery if we apply the -2.5V bias offset recipe",
                    "Can we check if other lots on EL23S18 show the edge ring pattern?",
                    "Generate 8D Root Cause Analysis report for management sign-off"
                  ]
                ).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-[10px] font-medium text-slate-300 hover:text-[#00E5C4] hover:bg-[#00E5C4]/10 border border-white/10 hover:border-[#00E5C4]/30 px-2.5 py-1 rounded-full transition-all text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* INPUT FORM */}
          <div className="flex gap-2 pt-2 border-t border-white/5">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={`Ask Semimind++ to isolate root cause for ${activeSession?.focusLot || "LOT_109"} or propose recipe setpoints...`}
              className="flex-1 bg-[#0A0F1C] text-xs text-slate-200 px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#00E5C4] placeholder-slate-500 transition-colors"
              disabled={streaming}
            />
            <button
              onClick={() => handleSend()}
              className="p-2.5 bg-[#00E5C4] hover:bg-[#00c4a7] text-[#0A0F1C] rounded-xl transition-all shadow-md shadow-[#00E5C4]/10 disabled:opacity-50"
              disabled={streaming}
            >
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* PENDING APPROVALS QUEUE & AUTOMATION MONITOR (Right column) */}
        <div className="bg-[#131B2E] border border-white/5 rounded-2xl p-5 flex flex-col h-[640px] gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-display text-sm font-semibold text-slate-200">AI Control Approvals</h3>
                <span className="text-[10px] text-slate-400 font-mono">Human-in-the-Loop Interlock</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold">
              {pendingActions.length} Actions
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {pendingActions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2 opacity-80" />
                <p className="text-xs font-semibold text-slate-300">All Fab Controls Optimized</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  No pending recipe offsets or lot holds awaiting engineering sign-off.
                </p>
              </div>
            ) : (
              pendingActions.map((action) => (
                <div
                  key={action.id}
                  className="p-3.5 bg-[#0A0F1C] border border-white/10 hover:border-white/20 rounded-xl flex flex-col gap-2.5 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30">
                      {action.type}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                      {action.confidence}% Confidence
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-200 leading-snug">
                    {action.desc}
                  </div>

                  {action.impact && (
                    <div className="text-[10px] text-[#00E5C4] font-medium bg-[#00E5C4]/5 p-1.5 rounded border border-[#00E5C4]/15">
                      Impact: {action.impact}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-1 pt-1 border-t border-white/5">
                    <button
                      onClick={() => handleAction(action.id, false)}
                      className="flex items-center justify-center gap-1.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-[11px] rounded-lg transition-all border border-rose-500/20"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => handleAction(action.id, true)}
                      className="flex items-center justify-center gap-1.5 py-1.5 bg-[#00E5C4] hover:bg-[#00c4a7] text-[#0A0F1C] font-semibold text-[11px] rounded-lg transition-all shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve & Execute
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Fab Telemetry Summary */}
          <div className="p-3 bg-[#0A0F1C] border border-white/5 rounded-xl text-[10px] font-mono text-slate-400 space-y-1.5">
            <div className="flex justify-between">
              <span>ACTIVE LOTS IN PROCESS:</span>
              <span className="text-slate-200 font-bold">{lots.length}</span>
            </div>
            <div className="flex justify-between">
              <span>HOLD LOTS:</span>
              <span className="text-amber-400 font-bold">
                {lots.filter((l) => l.status === "HOLD").length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>TOOLS IN DOWN/MAINT:</span>
              <span className="text-rose-400 font-bold">
                {equipment.filter((e) => e.status === "DOWN" || e.status === "MAINTENANCE").length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* YIELD SIMULATION MODAL */}
      <YieldSimulationModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        recommendation={simRecommendation}
        targetLot={activeSession?.focusLot || "LOT_109"}
        onApplyRecipe={async (offsetV) => {
          await handleRecommendationExecute(
            {
              id: `rec_sim_${Date.now()}`,
              title: `Recipe Delta Applied: RF Bias Offset ${offsetV}V`,
              type: "RECIPE_ADJUST",
              severity: "HIGH",
              confidence: 94,
              target: activeSession?.focusEquipment || "EL23S18",
              description: `Adjusted RF bias setpoint by ${offsetV}V on ${activeSession?.focusEquipment || "EL23S18"}.`,
              suggestedAction: `Upload ${offsetV}V bias delta and switch tool to QUALIFICATION.`,
              impactEstimate: "+9.4% Projected Yield Recovery",
              status: "READY"
            },
            true
          );
        }}
      />

      {/* 8D RCA REPORT EXPORT MODAL */}
      <Report8DModal
        isOpen={is8DModalOpen}
        onClose={() => setIs8DModalOpen(false)}
        sessionId={activeSessionId}
      />

      {/* MULTI-DOMAIN EVIDENCE & TELEMETRY PROOF INSPECTOR */}
      <RcaEvidenceInspectorModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        lotId={activeSession?.focusLot || "LOT_109"}
        equipmentId={activeSession?.focusEquipment || "EL23S18"}
        sessionId={activeSessionId}
        initialDomain={evidenceInitialDomain}
        onNavigateTab={onNavigateTab}
        onVerdictUpdated={(verdict) => setEngineerVerdict(verdict)}
      />
    </div>
  );
}
