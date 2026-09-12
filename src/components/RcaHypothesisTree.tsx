import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Beaker, ArrowRight, ShieldAlert, LineChart, ExternalLink, Radio, Map, Sliders, BarChart2, Bug } from "lucide-react";
import { RcaHypothesis } from "../types";

interface RcaHypothesisTreeProps {
  hypotheses: RcaHypothesis[];
  onTestRequested?: (hypothesis: RcaHypothesis) => void;
  onInspectEvidence?: (hypothesis: RcaHypothesis, domain?: "fdc" | "cp" | "wat" | "spc" | "defect") => void;
}

export default function RcaHypothesisTree({ hypotheses, onTestRequested, onInspectEvidence }: RcaHypothesisTreeProps) {
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

              {/* Linked Domain Evidence Badges */}
              {hyp.domainLinks && (
                <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1.5">
                  <span className="text-[9px] font-mono uppercase text-slate-500 block">
                    Domain Telemetry Proof Links:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {hyp.domainLinks.fdc && (
                      <button
                        onClick={() => onInspectEvidence?.(hyp, "fdc")}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-[10px] font-mono transition-colors"
                        title="Inspect FDC Chamber Sensor Traces"
                      >
                        <Radio className="w-3 h-3 text-sky-400" />
                        <span>FDC: {hyp.domainLinks.fdc}</span>
                      </button>
                    )}
                    {hyp.domainLinks.cp && (
                      <button
                        onClick={() => onInspectEvidence?.(hyp, "cp")}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono transition-colors"
                        title="Inspect CP Wafer Sort Map"
                      >
                        <Map className="w-3 h-3 text-emerald-400" />
                        <span>CP: {hyp.domainLinks.cp}</span>
                      </button>
                    )}
                    {hyp.domainLinks.wat && (
                      <button
                        onClick={() => onInspectEvidence?.(hyp, "wat")}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-mono transition-colors"
                        title="Inspect WAT / PCM Parametric Correlation"
                      >
                        <Sliders className="w-3 h-3 text-purple-400" />
                        <span>WAT: {hyp.domainLinks.wat}</span>
                      </button>
                    )}
                    {hyp.domainLinks.spc && (
                      <button
                        onClick={() => onInspectEvidence?.(hyp, "spc")}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-mono transition-colors"
                        title="Inspect SPC Western Electric Rules"
                      >
                        <BarChart2 className="w-3 h-3 text-amber-400" />
                        <span>SPC: {hyp.domainLinks.spc}</span>
                      </button>
                    )}
                    {hyp.domainLinks.defect && (
                      <button
                        onClick={() => onInspectEvidence?.(hyp, "defect")}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-mono transition-colors"
                        title="Inspect Defect DMS Spatial Density"
                      >
                        <Bug className="w-3 h-3 text-rose-400" />
                        <span>Defect: {hyp.domainLinks.defect}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                {onInspectEvidence ? (
                  <button
                    onClick={() => onInspectEvidence(hyp)}
                    className="inline-flex items-center gap-1 text-[#00E5C4] hover:text-[#33ebd0] font-mono font-semibold transition-colors"
                  >
                    <LineChart className="w-3 h-3" />
                    <span>Inspect Multi-Domain Telemetry Tracing</span>
                  </button>
                ) : (
                  <div />
                )}

                {hyp.suggestedTest && isInvestigating && onTestRequested && (
                  <button
                    onClick={() => onTestRequested(hyp)}
                    className="text-[#00E5C4] hover:underline flex items-center gap-1 font-semibold font-mono"
                  >
                    Run Test <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
