import React, { useState } from "react";
import { Zap, CheckCircle2, Sliders, PlayCircle, Loader2 } from "lucide-react";
import { AiRecommendation } from "../types";

interface AiRecommendationCardProps {
  recommendations: AiRecommendation[];
  onExecute: (rec: AiRecommendation, autoApprove: boolean) => Promise<void>;
  onSimulate?: (rec: AiRecommendation) => void;
}

export default function AiRecommendationCard({ recommendations, onExecute, onSimulate }: AiRecommendationCardProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [executedIds, setExecutedIds] = useState<Set<string>>(new Set());

  if (!recommendations || recommendations.length === 0) return null;

  const handleActionClick = async (rec: AiRecommendation, autoApprove: boolean) => {
    setLoadingId(rec.id);
    try {
      await onExecute(rec, autoApprove);
      setExecutedIds((prev) => new Set([...prev, rec.id]));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="mt-3 p-3.5 bg-[#070B14] border border-[#00E5C4]/20 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#00E5C4] fill-[#00E5C4]" />
          <span className="text-xs font-semibold text-slate-200 tracking-wide">
            Actionable AI Recommendations & Solutions
          </span>
        </div>
        <span className="text-[10px] text-[#00E5C4] font-mono font-semibold">1-Click Control Integration</span>
      </div>

      <div className="space-y-2.5">
        {recommendations.map((rec) => {
          const isExecuted = executedIds.has(rec.id);
          const isLoading = loadingId === rec.id;

          const severityColor =
            rec.severity === "CRITICAL"
              ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
              : rec.severity === "HIGH"
              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
              : "bg-blue-500/20 text-blue-300 border-blue-500/30";

          return (
            <div
              key={rec.id}
              className={`p-3 rounded-lg border transition-all ${
                isExecuted
                  ? "bg-emerald-500/10 border-emerald-500/40"
                  : "bg-[#0A0F1C] border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${severityColor}`}>
                      {rec.severity}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/25">
                      {rec.type}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Target: <strong className="text-slate-200">{rec.target}</strong>
                    </span>
                  </div>
                  <h5 className="text-xs font-semibold text-slate-200 mt-1.5">{rec.title}</h5>
                </div>

                <span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0">
                  {rec.confidence}% Conf.
                </span>
              </div>

              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                {rec.description}
              </p>

              {/* Impact Estimate Pill */}
              {rec.impactEstimate && (
                <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00E5C4]/10 border border-[#00E5C4]/20 text-[10px] text-[#00E5C4] font-medium">
                  <span className="font-mono uppercase text-[9px] text-slate-400">Impact:</span>
                  <span>{rec.impactEstimate}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap">
                {isExecuted ? (
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Applied to Fab Controls</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleActionClick(rec, true)}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#00E5C4] hover:bg-[#00c4a7] text-[#0A0F1C] font-semibold text-[11px] transition-all disabled:opacity-50 shadow-sm"
                      >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                        <span>1-Click Execute</span>
                      </button>

                      <button
                        onClick={() => handleActionClick(rec, false)}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-all border border-white/10"
                      >
                        <span>Queue for Approval</span>
                      </button>
                    </div>

                    {onSimulate && (
                      <button
                        onClick={() => onSimulate(rec)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Simulate Impact</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
