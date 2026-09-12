import React, { useState, useEffect, useRef } from "react";
import { Send, CheckCircle, XCircle, Brain, Terminal, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Lot, Equipment, Alarm, AgentAction, Message } from "../types";

interface AgentChatProps {
  lots: Lot[];
  equipment: Equipment[];
  pendingActions: AgentAction[];
  onActionExecuted: () => void;
}

export default function AgentChat({ lots, equipment, pendingActions, onActionExecuted }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "agent",
      content: "### Welcome to Semimind++\nI am connected to the **YMS, SPC, FDC, and MES** databases. Ask me to run an RCA diagnostic or propose control actions for active lots.",
      timestamp: new Date().toLocaleTimeString("en-US", { hour12: false, hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const [activeTools, setActiveTools] = useState<{ tool: string; params: any; status: string }[]>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentResponse, activeTools]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || streaming) return;

    if (!textToSend) setInputValue("");

    // Add user message
    const userMsg: Message = {
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("en-US", { hour12: false, hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);
    setCurrentResponse("");
    setActiveTools([]);

    try {
      // 1. Post query to get session
      const queryRes = await fetch("/api/agent/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text })
      });
      const queryData = await queryRes.json();
      const sessionId = queryData.session_id;

      // 2. Open EventSource for streaming
      const eventSource = new EventSource(`/api/agent/stream/${sessionId}`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "thinking") {
          setActiveTools([{ tool: "AI Reasoning Engine", params: { task: "Context Analysis" }, status: "running" }]);
        } else if (data.type === "tool_call") {
          setActiveTools((prev) => [
            ...prev.map((t) => (t.status === "running" ? { ...t, status: "complete" } : t)),
            { tool: data.content.tool, params: data.content.params, status: "complete" }
          ]);
        } else if (data.type === "chunk") {
          setCurrentResponse((prev) => prev + data.content);
        } else if (data.type === "complete") {
          setMessages((prev) => [
            ...prev,
            {
              role: "agent",
              content: currentResponse + (data.content !== "Analysis complete." ? data.content : ""),
              timestamp: new Date().toLocaleTimeString("en-US", { hour12: false, hour: '2-digit', minute: '2-digit' })
            }
          ]);
          setCurrentResponse("");
          setStreaming(false);
          setActiveTools([]);
          eventSource.close();
          onActionExecuted(); // refresh state
        } else if (data.type === "error") {
          console.error("SSE Stream error:", data.content);
          setStreaming(false);
          eventSource.close();
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE connection error", err);
        setStreaming(false);
        eventSource.close();
      };
    } catch (err) {
      console.error("Agent query failed:", err);
      setStreaming(false);
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
            content: `✅ Action **${approve ? "APPROVED" : "REJECTED"}**: Proposed action plan has been executed against Fab controllers. Status updated.`,
            timestamp: new Date().toLocaleTimeString("en-US", { hour12: false, hour: '2-digit', minute: '2-digit' })
          }
        ]);
        onActionExecuted(); // update layout states
      }
    } catch (err) {
      console.error("Action execution failed:", err);
    }
  };

  const suggestionPrompts = [
    "Run RCA diagnostic on LOT_109",
    "Identify cause of CMP-05 Health shift",
    "Compare wafer sort signature for LOT_63.1"
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="agent-chat-root">
      {/* CHAT INTERFACE - Left & Mid columns */}
      <div className="lg:col-span-2 bg-[#131B2E] border border-white/5 rounded-2xl p-5 flex flex-col h-[520px] relative">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#8B5CF6] animate-pulse" />
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-200">SemiMind++ Wisdom Engine</h3>
              <span className="text-[9px] text-[#00E5C4] font-mono">MODEL: gemini-3.5-flash · Qwen72B Context</span>
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-purple-400" />
        </div>

        {/* MESSAGES FLOW */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col max-w-[85%] ${m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}>
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#00E5C4]/15 border border-[#00E5C4]/20 text-slate-200 rounded-br-none"
                    : "bg-[#0A0F1C] border border-white/5 text-slate-200 rounded-bl-none"
                }`}
              >
                {/* Render simple markdown layout manually */}
                {m.content.split("\n").map((line, idx) => {
                  if (line.startsWith("###")) {
                    return <h4 key={idx} className="font-display font-bold text-sm text-[#00E5C4] mt-2 mb-1">{line.replace("###", "")}</h4>;
                  }
                  if (line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") || line.startsWith("-")) {
                    return <p key={idx} className="pl-4 py-0.5 text-slate-300 font-mono text-[11px] list-item">{line.substring(2)}</p>;
                  }
                  return <p key={idx} className="mb-1 text-slate-300">{line}</p>;
                })}
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-1">{m.timestamp}</span>
            </div>
          ))}

          {/* ACTIVE TOOL CALLS AND CURRENT STREAM CHUNKS */}
          {streaming && (
            <div className="flex flex-col mr-auto items-start max-w-[85%] gap-2">
              {activeTools.map((t, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-slate-900 border border-white/5 rounded-lg text-[10px] font-mono text-slate-400">
                  <Terminal className="w-3.5 h-3.5 text-[#00E5C4]" />
                  <span>Executing tool: <strong className="text-[#00E5C4]">{t.tool}</strong> {JSON.stringify(t.params)}</span>
                  {t.status === "running" && <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />}
                </div>
              ))}

              {currentResponse && (
                <div className="p-3.5 rounded-2xl text-xs leading-relaxed bg-[#0A0F1C] border border-white/5 text-slate-200 rounded-bl-none">
                  {currentResponse.split("\n").map((line, idx) => {
                    if (line.startsWith("###")) {
                      return <h4 key={idx} className="font-display font-bold text-sm text-[#00E5C4] mt-2 mb-1">{line.replace("###", "")}</h4>;
                    }
                    return <p key={idx} className="mb-1 text-slate-300">{line}</p>;
                  })}
                  <span className="inline-block w-2 h-3.5 bg-[#00E5C4] animate-pulse ml-0.5"></span>
                </div>
              )}
            </div>
          )}
          <div ref={chatEndRef}></div>
        </div>

        {/* SUGGESTION PROMPTS CHIPS */}
        {!streaming && (
          <div className="flex flex-wrap gap-2 py-2 border-t border-white/5">
            {suggestionPrompts.map((p) => (
              <button
                key={p}
                onClick={() => handleSend(p)}
                className="text-[10px] font-semibold text-slate-400 hover:text-[#00E5C4] hover:bg-[#00E5C4]/10 border border-white/5 hover:border-[#00E5C4]/20 px-3 py-1.5 rounded-full transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* INPUT PANEL */}
        <div className="flex gap-2 pt-2 border-t border-white/5">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask Semimind++ about lot anomalies or recipe optimizations..."
            className="flex-1 bg-[#0A0F1C] text-xs text-slate-200 px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#00E5C4] placeholder-slate-500"
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

      {/* PENDING ACTIONS QUEUE - Right column */}
      <div className="bg-[#131B2E] border border-white/5 rounded-2xl p-5 flex flex-col h-[520px] gap-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-amber-500" />
            <h3 className="font-display text-sm font-semibold text-slate-200">Pending AI Approvals</h3>
          </div>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-mono font-bold">
            {pendingActions.length} Pending
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {pendingActions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-4">
              <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
              <p className="text-xs font-semibold text-slate-400">All system controls optimized</p>
              <p className="text-[10px] text-slate-500 mt-1">No pending recipe modifications or lot holds.</p>
            </div>
          ) : (
            pendingActions.map((action) => (
              <div key={action.id} className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/20">
                    {action.type}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-semibold">{action.confidence}% Confidence</span>
                </div>

                <div className="text-xs font-semibold text-slate-200 leading-snug">{action.desc}</div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => handleAction(action.id, false)}
                    className="flex items-center justify-center gap-1.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-semibold text-[11px] rounded-lg transition-all border border-rose-500/20"
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
      </div>
    </div>
  );
}
