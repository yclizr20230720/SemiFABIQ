import React, { useState, useEffect } from "react";
import { 
  X, Radio, Map, Sliders, BarChart2, Bug, CheckCircle2, AlertTriangle, 
  XCircle, ArrowUpRight, ShieldAlert, Cpu, Activity, UserCheck, Send, Check
} from "lucide-react";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend 
} from "recharts";
import { DomainEvidenceTrace, EngineerVerdict } from "../types";

interface RcaEvidenceInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lotId: string;
  equipmentId: string;
  sessionId?: string;
  initialDomain?: "fdc" | "cp" | "wat" | "spc" | "defect" | "verdict";
  onNavigateTab?: (tabId: "yms" | "wat" | "cp" | "spc" | "fdc" | "defect" | "msc" | "traces" | "agent" | "fab" | "mrb" | "burnin") => void;
  onVerdictUpdated?: (verdict: EngineerVerdict) => void;
}

export default function RcaEvidenceInspectorModal({
  isOpen,
  onClose,
  lotId,
  equipmentId,
  sessionId = "session_lot_109",
  initialDomain = "fdc",
  onNavigateTab,
  onVerdictUpdated
}: RcaEvidenceInspectorModalProps) {
  const [activeDomain, setActiveDomain] = useState<"fdc" | "cp" | "wat" | "spc" | "defect" | "verdict">(initialDomain);
  const [evidence, setEvidence] = useState<DomainEvidenceTrace | null>(null);
  const [loading, setLoading] = useState(true);

  // Engineer Verdict form state
  const [verdictType, setVerdictType] = useState<"CONFIRMED_BY_ENGINEER" | "DISPUTED" | "REQUIRES_METROLOGY">("CONFIRMED_BY_ENGINEER");
  const [engineerName, setEngineerName] = useState("Dr. K. Chen (Principal Yield Integration)");
  const [shiftId, setShiftId] = useState("Shift-A / Fab-12 N5");
  const [verdictNotes, setVerdictNotes] = useState(
    "Physical verification confirmed: FDC chamber pressure spike to 31.2 mTorr (DTW distance 0.88, +3.4σ) compressed the outer boundary sheath during Step 4 Over-Etch, resulting in gate oxide thinning (Tox=1.82nm, Rule-5 violation) and 8.4% Bin 106 leakage fallout exclusively at radius r > 135mm. Agreed with AI proposed -2.5V RF bias offset and lot containment hold."
  );
  const [selectedHypId, setSelectedHypId] = useState("hyp_1");
  const [submittingVerdict, setSubmittingVerdict] = useState(false);
  const [verdictSuccess, setVerdictSuccess] = useState(false);

  useEffect(() => {
    if (initialDomain) {
      setActiveDomain(initialDomain);
    }
  }, [initialDomain]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchEvidence = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/agent/evidence/${lotId || "LOT_109"}/${equipmentId || "EL23S18"}?session_id=${sessionId}`);
        if (res.ok) {
          const data: DomainEvidenceTrace = await res.json();
          setEvidence(data);
          if (data.engineerVerdict) {
            setVerdictType(data.engineerVerdict.verdict);
            setEngineerName(data.engineerVerdict.engineerName);
            setShiftId(data.engineerVerdict.shiftId);
            setVerdictNotes(data.engineerVerdict.notes);
            if (data.engineerVerdict.agreedHypothesisId) {
              setSelectedHypId(data.engineerVerdict.agreedHypothesisId);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load RCA domain evidence:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvidence();
  }, [isOpen, lotId, equipmentId, sessionId]);

  const handleSubmitVerdict = async () => {
    setSubmittingVerdict(true);
    try {
      const res = await fetch("/api/agent/engineer-verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          verdict: verdictType,
          engineer_name: engineerName,
          shift_id: shiftId,
          notes: verdictNotes,
          agreed_hypothesis_id: selectedHypId
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.verdict) {
          if (evidence) {
            setEvidence({ ...evidence, engineerVerdict: data.verdict });
          }
          if (onVerdictUpdated) {
            onVerdictUpdated(data.verdict);
          }
          setVerdictSuccess(true);
          setTimeout(() => setVerdictSuccess(false), 3000);
        }
      }
    } catch (err) {
      console.error("Failed to submit engineer verdict:", err);
    } finally {
      setSubmittingVerdict(false);
    }
  };

  const handleDeepLink = (tab: "yms" | "wat" | "cp" | "spc" | "fdc" | "defect") => {
    if (onNavigateTab) {
      onNavigateTab(tab);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#0A0F1C] border border-white/10 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-white/10 bg-[#070B14] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00E5C4]/15 border border-[#00E5C4]/30 flex items-center justify-center text-[#00E5C4]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-sm text-slate-100">
                  Cross-Domain RCA Telemetry & Proof Verification Inspector
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00E5C4]/15 text-[#00E5C4] border border-[#00E5C4]/30">
                  Semimind++ Multi-Domain Link
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-0.5">
                <span>Lot: <strong className="text-slate-200">{lotId || "LOT_109"}</strong></span>
                <span>•</span>
                <span>Chamber: <strong className="text-slate-200">{equipmentId || "EL23S18"}_PM3</strong></span>
                <span>•</span>
                <span>Excursion: <strong className="text-rose-400">Bin 106 Edge Ring Fallout (8.4%)</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {evidence?.engineerVerdict && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Engineer Verified</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* DOMAIN NAVIGATION TABS */}
        <div className="flex border-b border-white/10 bg-[#070B14]/70 px-6 gap-1 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveDomain("fdc")}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeDomain === "fdc"
                ? "border-[#00E5C4] text-[#00E5C4] bg-[#00E5C4]/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <Radio className="w-4 h-4 text-sky-400" />
            <span>FDC SVID Traces</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-sky-500/20 text-sky-300">DTW 0.88</span>
          </button>

          <button
            onClick={() => setActiveDomain("cp")}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeDomain === "cp"
                ? "border-[#00E5C4] text-[#00E5C4] bg-[#00E5C4]/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <Map className="w-4 h-4 text-emerald-400" />
            <span>YMS CP Wafer Sort</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300">Bin 106</span>
          </button>

          <button
            onClick={() => setActiveDomain("wat")}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeDomain === "wat"
                ? "border-[#00E5C4] text-[#00E5C4] bg-[#00E5C4]/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>WAT / PCM Metrology</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300">Tox 1.82nm</span>
          </button>

          <button
            onClick={() => setActiveDomain("spc")}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeDomain === "spc"
                ? "border-[#00E5C4] text-[#00E5C4] bg-[#00E5C4]/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <BarChart2 className="w-4 h-4 text-amber-400" />
            <span>SPC Run Chart</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300">Rule-5</span>
          </button>

          <button
            onClick={() => setActiveDomain("defect")}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeDomain === "defect"
                ? "border-[#00E5C4] text-[#00E5C4] bg-[#00E5C4]/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <Bug className="w-4 h-4 text-rose-400" />
            <span>Defect DMS</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-500/20 text-rose-300">Bevel Ring</span>
          </button>

          <button
            onClick={() => setActiveDomain("verdict")}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all ml-auto whitespace-nowrap ${
              activeDomain === "verdict"
                ? "border-emerald-400 text-emerald-400 bg-emerald-500/10"
                : "border-transparent text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/5"
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Engineer Judgement</span>
            {evidence?.engineerVerdict && (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>
        </div>

        {/* CONTENT VIEW AREA */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#060A12] space-y-6">
          {loading ? (
            <div className="h-full flex items-center justify-center gap-2 text-slate-500 font-mono text-xs">
              <Activity className="w-5 h-5 animate-spin text-[#00E5C4]" />
              <span>Correlating Fab Telemetry Across All Analysis Domains...</span>
            </div>
          ) : !evidence ? (
            <div className="text-center text-slate-400 py-12">Failed to load domain telemetry data.</div>
          ) : (
            <>
              {/* TAB 1: FDC SVID SENSOR TRACES */}
              {activeDomain === "fdc" && (
                <div className="space-y-6">
                  {/* Top KPI row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">Excursion Pressure Peak</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold font-mono text-rose-400">31.2 mTorr</span>
                        <span className="text-xs text-slate-400">vs 24.5 mTorr</span>
                      </div>
                      <span className="text-[10px] text-rose-400/80 font-mono mt-1 block">+27.3% Over-Pressure Spike</span>
                    </div>

                    <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">Dynamic Time Warping (DTW)</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold font-mono text-rose-400">0.88</span>
                        <span className="text-xs text-slate-400">Limit: 0.45</span>
                      </div>
                      <span className="text-[10px] text-amber-400/90 font-mono mt-1 block">Z-Score: +3.4σ Deviation</span>
                    </div>

                    <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">RF Match Phase Angle</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold font-mono text-amber-400">14.2°</span>
                        <span className="text-xs text-slate-400">vs 3.1° Nominal</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono mt-1 block">Impedance Mismatch at Edge</span>
                    </div>

                    <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-500 block">Full Domain Inspection</span>
                        <span className="text-xs text-slate-300 mt-1 block">Open chamber telemetry viewer</span>
                      </div>
                      <button
                        onClick={() => handleDeepLink("fdc")}
                        className="mt-2 w-full py-1.5 px-3 rounded-lg bg-sky-500/15 border border-sky-500/30 hover:bg-sky-500/25 text-sky-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <span>Jump to FDC Engine</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Main FDC Sensor Trace Chart */}
                  <div className="p-5 bg-[#0A0F1C] border border-white/5 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-sky-400" />
                        <h4 className="text-xs font-bold text-slate-200 font-display">
                          60-Second Process Run: Golden Model Baseline vs Lot 109 Chamber Pressure
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-mono">
                        <span className="flex items-center gap-1 text-slate-400">
                          <span className="w-2.5 h-0.5 bg-slate-400 inline-block" /> Golden Baseline (24.5 mTorr)
                        </span>
                        <span className="flex items-center gap-1 text-rose-400 font-semibold">
                          <span className="w-2.5 h-1 bg-rose-400 inline-block" /> Lot 109 Excursion Trace
                        </span>
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={evidence.fdc.points} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                          <XAxis dataKey="second" stroke="#64748B" tick={{ fontSize: 10, fill: "#94A3B8" }} unit="s" />
                          <YAxis domain={[22, 34]} stroke="#64748B" tick={{ fontSize: 10, fill: "#94A3B8" }} unit=" mT" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "0.5rem", fontSize: "11px" }}
                            formatter={(val: any, name: string) => [
                              `${val} mTorr`, 
                              name === "pressureActual" ? "Excursion Trace" : "Golden Baseline"
                            ]}
                            labelFormatter={(sec) => `Step Time: ${sec}s (${evidence.fdc.points[Number(sec) - 1]?.stepName || ""})`}
                          />
                          <ReferenceLine y={24.5} stroke="#38BDF8" strokeDasharray="3 3" label={{ value: "Target 24.5", fill: "#38BDF8", fontSize: 10 }} />
                          <ReferenceLine y={28.0} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: "UCL 28.0", fill: "#F59E0B", fontSize: 10 }} />
                          <ReferenceLine x={25} stroke="#64748B" strokeDasharray="2 2" label={{ value: "Main Etch Start", fill: "#94A3B8", fontSize: 9 }} />
                          <ReferenceLine x={45} stroke="#64748B" strokeDasharray="2 2" label={{ value: "Over-Etch (Sheath Collapse)", fill: "#FF4F6A", fontSize: 9 }} />
                          <Line type="monotone" dataKey="pressureBaseline" stroke="#64748B" strokeWidth={1.5} dot={false} />
                          <Line type="monotone" dataKey="pressureActual" stroke="#FF4F6A" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-slate-300 leading-relaxed">
                      <strong className="text-rose-300">Physics Evidence Corroboration:</strong> Chamber pressure excursion started at Step 3 (Main Etch) and peaked at <span className="font-mono text-rose-300 font-bold">31.2 mTorr</span> during Step 4. At 31.2 mTorr, mean free path of reactive radicals drops by 21%, causing plasma sheath collapse over wafer bevel (<span className="font-mono text-rose-300">r &gt; 135mm</span>) and inducing extreme ion directional scattering.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: YMS CP WAFER SORT */}
              {activeDomain === "cp" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">Gross CP Sort Yield</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold font-mono text-rose-400">85.0%</span>
                        <span className="text-xs text-slate-400">Baseline 95.1%</span>
                      </div>
                      <span className="text-[10px] text-rose-400/80 font-mono mt-1 block">Soft Bin Limit (SBL) Breached</span>
                    </div>

                    <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">Bin 106 Fallout Rate</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold font-mono text-[#00E5C4]">8.4%</span>
                        <span className="text-xs text-slate-400">168 Die Fail</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono mt-1 block">GateOx Leakage Breakdown</span>
                    </div>

                    <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">Spatial Signature</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-sm font-bold font-mono text-slate-200">Outer Ring (r &gt; 135mm)</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono mt-1 block">100% Perimeter Die Concentration</span>
                    </div>

                    <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-500 block">CP Bin Map Analysis</span>
                        <span className="text-xs text-slate-300 mt-1 block">Inspect full wafer sort coordinates</span>
                      </div>
                      <button
                        onClick={() => handleDeepLink("cp")}
                        className="mt-2 w-full py-1.5 px-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <span>Jump to CP / Bin Map</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Radial Fallout Curve Chart */}
                  <div className="p-5 bg-[#0A0F1C] border border-white/5 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Map className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold text-slate-200 font-display">
                          Radial Yield Cliff Profile: Die Yield % vs Wafer Radius (0mm Center to 150mm Edge)
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-rose-400 font-semibold">Severe Fallout Past 135mm</span>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={evidence.cp.radialPoints} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="radialYieldGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00E5C4" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#00E5C4" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                          <XAxis dataKey="radiusMm" stroke="#64748B" tick={{ fontSize: 10, fill: "#94A3B8" }} unit=" mm" />
                          <YAxis domain={[30, 100]} stroke="#64748B" tick={{ fontSize: 10, fill: "#94A3B8" }} unit="%" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "0.5rem", fontSize: "11px" }}
                            formatter={(val: any, name: string) => [`${val}%`, "Die Yield"]}
                            labelFormatter={(r) => `Wafer Radius: ${r} mm`}
                          />
                          <ReferenceLine x={135} stroke="#FF4F6A" strokeDasharray="3 3" label={{ value: "Excursion Boundary (135mm)", fill: "#FF4F6A", fontSize: 10 }} />
                          <Area type="monotone" dataKey="yieldPct" stroke="#00E5C4" strokeWidth={2.5} fillOpacity={1} fill="url(#radialYieldGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Bin Pareto summary */}
                    <div className="grid grid-cols-4 gap-2 pt-2">
                      {evidence.cp.pareto.map((bin) => (
                        <div key={bin.bin} className="p-2.5 bg-[#070B14] rounded-lg border border-white/5 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-slate-400 block">{bin.name}</span>
                            <span className="text-xs font-bold font-mono text-slate-200">{bin.count} dies</span>
                          </div>
                          <span className={`text-xs font-mono font-bold ${bin.bin === 106 ? "text-rose-400" : "text-slate-400"}`}>
                            {bin.pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: WAT / PCM METROLOGY */}
              {activeDomain === "wat" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">Gate Oxide Tox Mean</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold font-mono text-purple-400">1.82 nm</span>
                        <span className="text-xs text-slate-400">Target 1.75 nm</span>
                      </div>
                      <span className="text-[10px] text-purple-300/80 font-mono mt-1 block">USL: 1.90 nm / LSL: 1.60 nm</span>
                    </div>

                    <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">Process Capability (Cpk)</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold font-mono text-rose-400">0.94</span>
                        <span className="text-xs text-slate-400">Target ≥ 1.67</span>
                      </div>
                      <span className="text-[10px] text-rose-400 font-mono mt-1 block">Severe Dispersion Out-of-Spec</span>
                    </div>

                    <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">Tox vs Ioff Correlation</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold font-mono text-[#00E5C4]">r = 0.91</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono mt-1 block">Pearson Linear Coupling</span>
                    </div>

                    <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-500 block">Parametric Analytics</span>
                        <span className="text-xs text-slate-300 mt-1 block">Inspect full PCM distribution</span>
                      </div>
                      <button
                        onClick={() => handleDeepLink("wat")}
                        className="mt-2 w-full py-1.5 px-3 rounded-lg bg-purple-500/15 border border-purple-500/30 hover:bg-purple-500/25 text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <span>Jump to WAT Analytics</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Histogram Chart */}
                  <div className="p-5 bg-[#0A0F1C] border border-white/5 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-purple-400" />
                        <h4 className="text-xs font-bold text-slate-200 font-display">
                          Gate Oxide Thickness (Tox) Distribution vs Normal Curve (Cpk = 0.94)
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-mono">
                        <span className="flex items-center gap-1 text-purple-400">
                          <span className="w-2.5 h-2.5 bg-purple-500/60 inline-block rounded-xs" /> Measured Dies
                        </span>
                        <span className="flex items-center gap-1 text-emerald-400">
                          <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" /> Ideal Gaussian Fit
                        </span>
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={evidence.wat.histogram} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                          <XAxis dataKey="binRange" stroke="#64748B" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                          <YAxis stroke="#64748B" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "0.5rem", fontSize: "11px" }}
                            formatter={(val: any) => [val, "Die Count"]}
                          />
                          <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs text-slate-300 leading-relaxed">
                      <strong className="text-purple-300">Statistical Finding:</strong> Tox distribution demonstrates severe positive skewness toward 1.82nm–1.94nm. The higher thickness variance directly triggers Nelson Rule-5 (2 of 3 points beyond 2σ), and correlates with Ioff leakage surge to 12.4 nA/μm (Pearson r=0.91).
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SPC CONTROL CHART */}
              {activeDomain === "spc" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">Upper Control Limit (UCL)</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold font-mono text-rose-400">35.0</span>
                        <span className="text-xs text-slate-400">+3σ</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono mt-1 block">Centerline: 32.1</span>
                    </div>

                    <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">Western Electric Violation</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-sm font-bold font-mono text-rose-400">Rule 5 &amp; Rule 1</span>
                      </div>
                      <span className="text-[10px] text-rose-300 font-mono mt-1 block">2 of 3 beyond 2σ; 1 point &gt; 3σ</span>
                    </div>

                    <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">Flagged Wafers in Lot</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold font-mono text-amber-400">W#33, W#35, W#39</span>
                      </div>
                      <span className="text-[10px] text-amber-400 font-mono mt-1 block">Out-of-Control Action Triggered</span>
                    </div>

                    <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-500 block">SPC Rule Monitor</span>
                        <span className="text-xs text-slate-300 mt-1 block">Inspect full 50-point run charts</span>
                      </div>
                      <button
                        onClick={() => handleDeepLink("spc")}
                        className="mt-2 w-full py-1.5 px-3 rounded-lg bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <span>Jump to SPC Monitor</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* SPC Run Chart */}
                  <div className="p-5 bg-[#0A0F1C] border border-white/5 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-bold text-slate-200 font-display">
                          X-Bar Run Chart with Western Electric Alarm Flags
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-rose-400 font-semibold">Excursion Zone Flagged</span>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={evidence.spc.runPoints} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                          <XAxis dataKey="lotId" stroke="#64748B" tick={{ fontSize: 9, fill: "#94A3B8" }} />
                          <YAxis domain={[28, 37]} stroke="#64748B" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "0.5rem", fontSize: "11px" }}
                            formatter={(val: any, name: string, item: any) => [
                              `${val} ${item.payload.violation ? `(${item.payload.violation})` : ""}`,
                              "Wafer Mean"
                            ]}
                          />
                          <ReferenceLine y={35.0} stroke="#FF4F6A" strokeDasharray="3 3" label={{ value: "UCL (35.0)", fill: "#FF4F6A", fontSize: 10 }} />
                          <ReferenceLine y={34.0} stroke="#F59E0B" strokeDasharray="2 2" label={{ value: "+2σ Zone A", fill: "#F59E0B", fontSize: 9 }} />
                          <ReferenceLine y={32.1} stroke="#10B981" label={{ value: "CL (32.1)", fill: "#10B981", fontSize: 10 }} />
                          <ReferenceLine y={29.2} stroke="#FF4F6A" strokeDasharray="3 3" label={{ value: "LCL (29.2)", fill: "#FF4F6A", fontSize: 10 }} />
                          <Line type="monotone" dataKey="value" stroke="#38BDF8" strokeWidth={2} dot={{ r: 3, fill: "#38BDF8" }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-slate-300 leading-relaxed">
                      <strong className="text-amber-300">Rule 5 Diagnostic:</strong> Wafers #33, #34, and #35 crossed the +2σ limit consecutively during processing on chamber EL23S18. Wafer #39 experienced a Rule 1 breach (+3.8σ UCL crossing), proving that the pressure fluctuation was an active systematic excursion rather than random Gaussian noise.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: INLINE DEFECT DMS */}
              {activeDomain === "defect" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">Total Defect Adders</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold font-mono text-rose-400">448</span>
                        <span className="text-xs text-slate-400">vs 35 Baseline</span>
                      </div>
                      <span className="text-[10px] text-rose-400 font-mono mt-1 block">Post-Etch Inspection</span>
                    </div>

                    <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">Bevel Edge Density</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold font-mono text-rose-400">1.84 / cm²</span>
                        <span className="text-xs text-slate-400">Center: 0.02</span>
                      </div>
                      <span className="text-[10px] text-rose-400 font-mono mt-1 block">92x Radial Defect Concentration</span>
                    </div>

                    <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">Primary Defect Class</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-sm font-bold font-mono text-slate-200">Sheath Micro-Arcing</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono mt-1 block">Rules out CMP Slurry Scratching</span>
                    </div>

                    <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-500 block">KLA Defect Analysis</span>
                        <span className="text-xs text-slate-300 mt-1 block">Inspect SEM review images</span>
                      </div>
                      <button
                        onClick={() => handleDeepLink("defect")}
                        className="mt-2 w-full py-1.5 px-3 rounded-lg bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <span>Jump to Defect DMS</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Defect Density by Zone */}
                  <div className="p-5 bg-[#0A0F1C] border border-white/5 rounded-xl space-y-4">
                    <div className="flex items-center gap-2">
                      <Bug className="w-4 h-4 text-rose-400" />
                      <h4 className="text-xs font-bold text-slate-200 font-display">
                        Defect Adder Spatial Density &amp; Classification Distribution
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <span className="text-[11px] font-mono text-slate-400 uppercase block">Defect Density by Wafer Zone (/cm²)</span>
                        {evidence.defect.zones.map((z, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="text-slate-300">{z.zone}</span>
                              <span className="text-rose-400 font-bold">{z.density} / cm² ({z.count} defects)</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-amber-500 to-rose-500" 
                                style={{ width: `${Math.min(100, (z.density / 2.0) * 100)}%` }} 
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <span className="text-[11px] font-mono text-slate-400 uppercase block">Automatic Defect Classification (ADC)</span>
                        <div className="space-y-2">
                          {evidence.defect.classifications.map((c, idx) => (
                            <div key={idx} className="p-2.5 bg-[#070B14] rounded-lg border border-white/5 flex items-center justify-between">
                              <span className="text-xs text-slate-300 font-medium">{c.type}</span>
                              <div className="flex items-center gap-2 font-mono text-xs">
                                <span className="text-slate-400">{c.count}</span>
                                <span className={`font-bold ${c.pct > 50 ? "text-rose-400" : "text-slate-300"}`}>{c.pct}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-slate-300 leading-relaxed">
                      <strong className="text-rose-300">CMP Hypothesis Ruled Out:</strong> Only 4.0% of defects were micro-scratches, and wafer center is entirely defect-free. This definitively rules out CMP-05 pad scratching as the primary root cause.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: ENGINEER JUDGEMENT & VERIFICATION */}
              {activeDomain === "verdict" && (
                <div className="max-w-3xl mx-auto space-y-6">
                  {/* AI Diagnosis Summary Card */}
                  <div className="p-4 bg-[#070B14] border border-[#00E5C4]/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#00E5C4]">
                        <Cpu className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider font-mono">
                          Semimind++ Autonomous Diagnosis (Confidence: 94%)
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                        CONFIRMED ROOT CAUSE
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      Plasma boundary sheath collapse induced by <strong>31.2 mTorr chamber pressure spike</strong> on <strong>EL23S18_PM3</strong> during Step 4 Over-Etch, resulting in non-uniform ion angular bombardment, gate oxide thinning (<span className="font-mono text-purple-300">Tox = 1.82nm</span>), and <strong>8.4% Bin 106 gate leakage</strong> concentrated in wafer edge ring (<span className="font-mono text-rose-300">r &gt; 135mm</span>).
                    </p>
                  </div>

                  {/* Form for Engineer Sign-off */}
                  <div className="p-5 bg-[#0A0F1C] border border-white/10 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold text-slate-100 font-display">
                          Official Engineer RCA Review &amp; Physical Evidence Sign-Off
                        </h4>
                      </div>
                      {verdictSuccess && (
                        <span className="text-xs text-emerald-400 font-mono flex items-center gap-1 animate-pulse">
                          <Check className="w-3.5 h-3.5" /> Verdict Persisted Successfully
                        </span>
                      )}
                    </div>

                    {/* Verdict Radios */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase text-slate-400 block">Verification Decision</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setVerdictType("CONFIRMED_BY_ENGINEER")}
                          className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                            verdictType === "CONFIRMED_BY_ENGINEER"
                              ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm"
                              : "bg-[#070B14] border-white/10 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Confirm &amp; Agree</span>
                          </div>
                          <span className="text-[10px] opacity-80 leading-tight">
                            Agree with AI sheath collapse &amp; pressure root cause.
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setVerdictType("DISPUTED")}
                          className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                            verdictType === "DISPUTED"
                              ? "bg-rose-500/15 border-rose-500 text-rose-300 shadow-sm"
                              : "bg-[#070B14] border-white/10 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <XCircle className="w-4 h-4 text-rose-400" />
                            <span>Dispute Finding</span>
                          </div>
                          <span className="text-[10px] opacity-80 leading-tight">
                            Challenge AI finding; propose alternative mechanism.
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setVerdictType("REQUIRES_METROLOGY")}
                          className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                            verdictType === "REQUIRES_METROLOGY"
                              ? "bg-amber-500/15 border-amber-500 text-amber-300 shadow-sm"
                              : "bg-[#070B14] border-white/10 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            <span>Need Metrology</span>
                          </div>
                          <span className="text-[10px] opacity-80 leading-tight">
                            Hold pending TEM cross-section or coupon wafer test.
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Engineer credentials */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-slate-400 block">Reviewing Engineer</label>
                        <input
                          type="text"
                          value={engineerName}
                          onChange={(e) => setEngineerName(e.target.value)}
                          className="w-full bg-[#070B14] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-[#00E5C4]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-slate-400 block">Fab Section &amp; Shift</label>
                        <input
                          type="text"
                          value={shiftId}
                          onChange={(e) => setShiftId(e.target.value)}
                          className="w-full bg-[#070B14] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-[#00E5C4]"
                        />
                      </div>
                    </div>

                    {/* Detailed Notes */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-400 block">
                        Engineering Justification &amp; Technical Observations
                      </label>
                      <textarea
                        rows={4}
                        value={verdictNotes}
                        onChange={(e) => setVerdictNotes(e.target.value)}
                        className="w-full bg-[#070B14] border border-white/10 rounded-lg p-3 text-xs text-slate-200 font-sans leading-relaxed focus:outline-none focus:border-[#00E5C4]"
                        placeholder="Enter physical observations, correlation metrics, or recipe offset instructions..."
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="text-[10px] text-slate-400 font-mono">
                        {evidence.engineerVerdict ? (
                          <span>Last signed: {evidence.engineerVerdict.timestamp} by {evidence.engineerVerdict.engineerName}</span>
                        ) : (
                          <span>Awaiting formal engineer approval</span>
                        )}
                      </div>

                      <button
                        onClick={handleSubmitVerdict}
                        disabled={submittingVerdict}
                        className="px-4 py-2 rounded-lg bg-[#00E5C4] hover:bg-[#00c4a7] text-[#0A0F1C] text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {submittingVerdict ? (
                          <>
                            <Activity className="w-3.5 h-3.5 animate-spin" />
                            <span>Recording Sign-off...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Formal Engineering Verdict</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
