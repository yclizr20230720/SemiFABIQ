import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Beaker, ArrowRight, ShieldAlert } from "lucide-react";
import { RcaHypothesis } from "../types";

interface RcaHypothesisTreeProps {
  hypotheses: RcaHypothesis[];
  onTestRequested?: (hypothesis: RcaHypothesis) => void;
}

export default function RcaHypothesisTree({ hypotheses, onTestRequested }: RcaHypothesisTreeProps) {
  if (!hypotheses || hypotheses.length === 0) return null;

  return (
    <div className="mt-3 p-3.5 bg-[#070B14] border border-white/10 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#00E5C4]" />
          <span className="text-xs font-semibold text-slate-200 tracking-wide">
            Root Cause Hypothesis Matrix ({hypotheses.length} Analyzed)
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">Multi-Domain Correlation</span>
      </div>

      <div className="space-y-2.5">
        {hypotheses.map((hyp) => {
          const isConfirmed = hyp.status === "CONFIRMED";
          const isRuledOut = hyp.status === "RULED_OUT";
          const isInvestigating = hyp.status === "INVESTIGATING";

          return (
            <div
              key={hyp.id}
              className={`p-3 rounded-lg border transition-all ${
                isConfirmed
                  ? "bg-emerald-500/5 border-emerald-500/30"
                  : isRuledOut
                  ? "bg-rose-500/5 border-rose-500/20 opacity-75"
                  : "bg-amber-500/5 border-amber-500/25"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isConfirmed && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {isRuledOut && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  {isInvestigating && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}

                  <span className="text-xs font-medium text-slate-200">
                    {hyp.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider ${
                      isConfirmed
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : isRuledOut
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {hyp.status}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-[#00E5C4]">
                    {hyp.likelihood}%
                  </span>
                </div>
              </div>

              {/* Likelihood progress bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full transition-all duration-500 ${
                    isConfirmed
                      ? "bg-gradient-to-r from-emerald-500 to-[#00E5C4]"
                      : isRuledOut
                      ? "bg-rose-500/60"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${hyp.likelihood}%` }}
                />
              </div>

              {/* Supporting & Counter Evidence */}
              <div className="mt-2 text-[11px] space-y-1 text-slate-300 leading-relaxed">
                <div className="flex items-start gap-1.5">
                  <span className="text-[10px] font-mono text-slate-500 shrink-0 uppercase">Evidence:</span>
                  <span>{hyp.supportingEvidence}</span>
                </div>
                {hyp.counterEvidence && (
                  <div className="flex items-start gap-1.5 text-rose-300/80">
                    <span className="text-[10px] font-mono text-slate-500 shrink-0 uppercase">Refutation:</span>
                    <span>{hyp.counterEvidence}</span>
                  </div>
                )}
              </div>

              {/* Suggested physical test */}
              {hyp.suggestedTest && (
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 text-slate-400 font-mono">
                    <Beaker className="w-3.5 h-3.5 text-[#00E5C4]" />
                    <span>Test: {hyp.suggestedTest}</span>
                  </div>
                  {onTestRequested && isInvestigating && (
                    <button
                      onClick={() => onTestRequested(hyp)}
                      className="text-[#00E5C4] hover:underline flex items-center gap-1 font-semibold"
                    >
                      Run Check <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
