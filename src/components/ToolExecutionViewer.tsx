import React, { useState } from "react";
import { Terminal, ChevronDown, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import { ToolInvocation } from "../types";

interface ToolExecutionViewerProps {
  tools: ToolInvocation[];
}

export default function ToolExecutionViewer({ tools }: ToolExecutionViewerProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!tools || tools.length === 0) return null;

  return (
    <div className="my-2 space-y-1.5">
      <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
        <Terminal className="w-3 h-3 text-[#00E5C4]" />
        <span>Live Fab Telemetry Queries ({tools.length} Tools)</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tools.map((tool, idx) => {
          const isExpanded = expandedIndex === idx;

          return (
            <div key={idx} className="w-full">
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-white/5 hover:border-white/10 text-left transition-all"
              >
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#00E5C4]" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span className="text-slate-300 font-semibold">{tool.name || tool.tool}</span>
                  <span className="text-slate-500 text-[10px]">({JSON.stringify(tool.params)})</span>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
                  {tool.executionTimeMs && (
                    <span className="text-slate-500 flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {tool.executionTimeMs}ms
                    </span>
                  )}
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>OK</span>
                  </span>
                </div>
              </button>

              {isExpanded && tool.result && (
                <div className="mt-1 p-2.5 bg-[#050810] border border-white/10 rounded-lg text-[10px] font-mono text-slate-300 overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(tool.result, null, 2)}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
