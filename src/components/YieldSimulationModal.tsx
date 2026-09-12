import React, { useState } from "react";
import { X, TrendingUp, DollarSign, ShieldCheck, CheckCircle2, Sliders, RefreshCw } from "lucide-react";
import { AiRecommendation } from "../types";

interface YieldSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation?: AiRecommendation | null;
  targetLot?: string;
  onApplyRecipe?: (offsetV: number) => void;
}

export default function YieldSimulationModal({
  isOpen,
  onClose,
  recommendation,
  targetLot = "LOT_109",
  onApplyRecipe
}: YieldSimulationModalProps) {
  const [biasOffset, setBiasOffset] = useState<number>(-2.5);
  const [gasFlowOffset, setGasFlowOffset] = useState<number>(-8);
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  if (!isOpen) return null;

  // Dynamic simulation calculations based on slider
  const baselineYield = targetLot === "LOT_109" ? 85.0 : 91.2;
  const simulatedRecovery = Math.min(9.8, +(Math.abs(biasOffset) * 3.76).toFixed(2));
  const projectedYield = +(baselineYield + simulatedRecovery).toFixed(2);
  const defectReduction = Math.min(96, Math.round(Math.abs(biasOffset) * 36.5));
  const estimatedSavings = Math.round(simulatedRecovery * 5020);

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setApplied(true);
      if (onApplyRecipe) {
        onApplyRecipe(biasOffset);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00E5C4]/10 border border-[#00E5C4]/20 text-[#00E5C4]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Interactive Yield Recovery Simulator
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Model: Non-Linear Plasma Sheath & RF Bias Generator Dynamics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Key Simulation Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#070B14] border border-white/5">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>PROJECTED YIELD</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-slate-100">{projectedYield}%</span>
                <span className="text-xs font-mono font-bold text-emerald-400">+{simulatedRecovery}%</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Baseline: {baselineYield}%</div>
            </div>

            <div className="p-3 rounded-xl bg-[#070B14] border border-white/5">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>ESTIMATED SAVINGS</span>
                <DollarSign className="w-3.5 h-3.5 text-[#00E5C4]" />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-[#00E5C4]">
                  ${estimatedSavings.toLocaleString()}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Per 25-wafer lot run</div>
            </div>

            <div className="p-3 rounded-xl bg-[#070B14] border border-white/5">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>DEFECT FALLOUT REDUCTION</span>
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-purple-300">-{defectReduction}%</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Bin 106 edge leakage</div>
            </div>
          </div>

          {/* Interactive Recipe Tuning Sliders */}
          <div className="p-4 bg-[#070B14] border border-white/5 rounded-xl space-y-4">
            <h4 className="text-xs font-semibold text-slate-200">
              Interactive Recipe Parameter Offsets
            </h4>

            {/* RF Bias Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300">RF Bias Generator Delta (ΔV):</span>
                <span className="text-[#00E5C4] font-bold">{biasOffset} V</span>
              </div>
              <input
                type="range"
                min="-5.0"
                max="0.0"
                step="0.5"
                value={biasOffset}
                onChange={(e) => {
                  setBiasOffset(parseFloat(e.target.value));
                  setApplied(false);
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#00E5C4]"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>-5.0 V (Max Edge Shift)</span>
                <span>-2.5 V (Recommended)</span>
                <span>0.0 V (Unchanged)</span>
              </div>
            </div>

            {/* Gas Flow Offset */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300">Ar Carrier Gas Flow Offset (Step 04):</span>
                <span className="text-purple-300 font-bold">{gasFlowOffset} sccm</span>
              </div>
              <input
                type="range"
                min="-20"
                max="10"
                step="2"
                value={gasFlowOffset}
                onChange={(e) => {
                  setGasFlowOffset(parseInt(e.target.value));
                  setApplied(false);
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>-20 sccm</span>
                <span>-8 sccm (Stabilize 24.8 mTorr)</span>
                <span>+10 sccm</span>
              </div>
            </div>
          </div>

          {/* Comparison Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-slate-300">
              <span>Yield Comparison (Baseline vs Simulated):</span>
              <span className="text-emerald-400 font-bold">
                {baselineYield}% → {projectedYield}%
              </span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="bg-slate-600 h-full transition-all duration-300"
                style={{ width: `${baselineYield}%` }}
              />
              <div
                className="bg-[#00E5C4] h-full transition-all duration-300 animate-pulse"
                style={{ width: `${simulatedRecovery}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#070B14] border-t border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Chamber: <strong className="text-slate-200">EL23S18_PM3</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/5 transition-colors"
            >
              Close
            </button>

            {applied ? (
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Recipe Delta Dispatched</span>
              </div>
            ) : (
              <button
                onClick={handleApply}
                disabled={isApplying}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00E5C4] hover:bg-[#00c4a7] text-[#0A0F1C] text-xs font-semibold transition-all shadow-md shadow-[#00E5C4]/10 disabled:opacity-50"
              >
                {isApplying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Apply Delta to Chamber Controller</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
