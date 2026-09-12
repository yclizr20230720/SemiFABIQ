import React, { useState } from "react";
import { Hammer, ClipboardCheck, ThumbsUp, AlertTriangle } from "lucide-react";
import { MRBDecision } from "../types";

export default function MRBReview({ decisions }: { decisions: MRBDecision[] }) {
  const [localDecisions, setLocalDecisions] = useState<MRBDecision[]>(decisions);

  const handleResolve = (waferId: string, result: "GoodWafer" | "BadWafer") => {
    setLocalDecisions(prev =>
      prev.map(d => d.wafer_id === waferId ? { ...d, result } : d)
    );
  };

  return (
    <div className="flex flex-col gap-6" id="mrb-review-root">
      {/* SECTION HEADER */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Material Review Board (MRB) Wafer Disposition Panel</span>
        <div className="h-[1px] flex-1 bg-slate-800"></div>
      </div>

      <div className="bg-[#131B2E] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[#00E5C4]" />
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Wafer Excursion Decisions & SBL Consolidation</h4>
          </div>
          <div className="flex gap-2">
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
              {localDecisions.filter(d => d.result === "GoodWafer").length} Resolved Good
            </span>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#FF4F6A]/10 text-[#FF4F6A] border border-[#FF4F6A]/20">
              {localDecisions.filter(d => d.result === "BadWafer").length} Resolved Bad
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs font-mono text-slate-400 text-center">
            <thead>
              <tr className="bg-[#0A0F1C] text-slate-500 uppercase text-[9px] tracking-wider">
                <th className="p-3 text-left">Wafer ID</th>
                <th className="p-3">Partial Wafer</th>
                <th className="p-3">Wafer Cluster</th>
                <th className="p-3">Wafer Pattern</th>
                <th className="p-3">wf_SYL</th>
                <th className="p-3">wf_SBL</th>
                <th className="p-3">PCM Violate</th>
                <th className="p-3">MRB Decision</th>
                <th className="p-3">Operator Action</th>
              </tr>
            </thead>
            <tbody>
              {localDecisions.map((d) => (
                <tr key={d.wafer_id} className="border-b border-white/5 hover:bg-slate-800/40">
                  <td className="p-3 text-left font-bold text-slate-200">{d.wafer_id}</td>
                  <td className="p-3">{d.partial ? "❌ True" : "—"}</td>
                  <td className="p-3">{d.cluster ? "❌ True" : "—"}</td>
                  <td className="p-3">{d.pattern ? "⚠️ True" : "—"}</td>
                  <td className="p-3">{d.syl ? "⚠️ True" : "—"}</td>
                  <td className="p-3">{d.sbl ? "❌ True" : "—"}</td>
                  <td className="p-3">{d.pcm ? "❌ True" : "—"}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold inline-flex items-center gap-1.5 ${
                      d.result === "GoodWafer"
                        ? "bg-[#10B981]/15 text-[#10B981]"
                        : "bg-[#FF4F6A]/15 text-[#FF4F6A]"
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {d.result}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center gap-1.5">
                      <button
                        onClick={() => handleResolve(d.wafer_id, "GoodWafer")}
                        className="px-2 py-1 bg-[#10B981]/10 hover:bg-[#10B981]/25 text-[#10B981] font-bold text-[10px] rounded transition-all"
                      >
                        Pass
                      </button>
                      <button
                        onClick={() => handleResolve(d.wafer_id, "BadWafer")}
                        className="px-2 py-1 bg-[#FF4F6A]/10 hover:bg-[#FF4F6A]/25 text-[#FF4F6A] font-bold text-[10px] rounded transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
