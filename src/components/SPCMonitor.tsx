import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { AlertTriangle, Plus, Play, ShieldAlert, Sparkles, CheckSquare } from "lucide-react";
import { Lot } from "../types";

export default function SPCMonitor({ lots }: { lots: Lot[] }) {
  const [spcTab, setSpcTab] = useState<"dc" | "strategy" | "analyzer" | "alarm" | "cpk">("analyzer");

  // Simulated 50 points of process data with known violations
  const points = Array.from({ length: 50 }).map((_, i) => {
    let base = 32.1;
    let deviation = Math.sin(i * 0.4) * 0.8 + (Math.random() - 0.5) * 1.2;
    
    // Inject specific Western Electric rule violations
    let violationLabel = "";
    if (i === 15) {
      deviation = 4.2; // Rule 1: Point outside 3σ (UCL)
      violationLabel = "Rule 1: Point Beyond 3σ";
    }
    if (i >= 22 && i <= 30) {
      deviation = 1.6 + Math.random() * 0.3; // Rule 2: 9 points same side of CL
      if (i === 30) violationLabel = "Rule 2: 9 Consecutive Points Above CL";
    }
    if (i === 42) {
      deviation = 2.9; // Rule 5: 2 of 3 points beyond 2σ
      violationLabel = "Rule 5: 2 of 3 Points Beyond 2σ";
    }

    const val = base + deviation;
    return {
      index: i + 1,
      lotId: `L${300 + i}`,
      value: Number(val.toFixed(3)),
      violation: violationLabel,
      cl: 32.1,
      ucl: 35.0,
      lcl: 29.2
    };
  });

  const specTemplate = [
    { param: "NMOS_VT", target: 0.724, usl: 0.85, lsl: 0.60, minCpk: 1.33, active: true },
    { param: "PMOS_VT", target: -0.682, usl: -0.55, lsl: -0.80, minCpk: 1.33, active: true },
    { param: "GATOX_THK", target: 32.1, usl: 35.0, lsl: 29.0, minCpk: 1.33, active: true },
    { param: "POLY_CD", target: 28.4, usl: 32.0, lsl: 25.0, minCpk: 1.33, active: true },
    { param: "CMP_RATE", target: 1540, usl: 1800, lsl: 1300, minCpk: 1.33, active: true }
  ];

  return (
    <div className="flex flex-col gap-6" id="spc-monitor-root">
      {/* SECTION HEADER */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Statistical Process Control (SPC) Monitor</span>
        <div className="h-[1px] flex-1 bg-slate-800"></div>
      </div>

      {/* SUB TAB SELECTOR */}
      <div className="flex border-b border-white/5 gap-2">
        {(
          [
            { id: "dc", label: "DC Config Templates" },
            { id: "strategy", label: "Strategy Builder" },
            { id: "analyzer", label: "Data Analyzer (Charts)" },
            { id: "alarm", label: "Alarm Log History" },
            { id: "cpk", label: "Cpk Fleet Summary" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSpcTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold tracking-wide transition-all border-b-2 -mb-[2px] ${
              spcTab === tab.id
                ? "border-[#00E5C4] text-[#00E5C4] bg-[#00E5C4]/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-[#131B2E] border border-white/5 rounded-2xl p-5 min-h-[350px]">
        {/* DC CONFIG TAB */}
        {spcTab === "dc" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">DC Target Configuration Template</h4>
              <button className="flex items-center gap-1.5 px-3 py-1 bg-[#00E5C4] text-[#0A0F1C] text-xs font-semibold rounded-lg hover:bg-[#00c4a7] transition-all">
                <Plus className="w-3.5 h-3.5" /> Add Parameter Template
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-slate-400 font-mono">
                <thead>
                  <tr className="bg-[#0A0F1C] text-slate-500 uppercase text-[9px] tracking-wider">
                    <th className="p-3 text-left">Parameter ID</th>
                    <th className="p-3 text-right">Target Value</th>
                    <th className="p-3 text-right">USL</th>
                    <th className="p-3 text-right">LSL</th>
                    <th className="p-3 text-right">Min Cpk Target</th>
                    <th className="p-3 text-center">Auto Alarm</th>
                  </tr>
                </thead>
                <tbody>
                  {specTemplate.map((spec) => (
                    <tr key={spec.param} className="border-b border-white/5 hover:bg-slate-800/40">
                      <td className="p-3 text-left font-bold text-slate-200">{spec.param}</td>
                      <td className="p-3 text-right text-slate-300">{spec.target}</td>
                      <td className="p-3 text-right text-[#FF4F6A]">{spec.usl}</td>
                      <td className="p-3 text-right text-[#00E5C4]">{spec.lsl}</td>
                      <td className="p-3 text-right font-bold text-emerald-400">{spec.minCpk}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-[#00E5C4]/10 text-[#00E5C4] border border-[#00E5C4]/20">ENABLED</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STRATEGY BUILDER TAB */}
        {spcTab === "strategy" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2">Active Control Strategies</h4>
              <div className="space-y-3">
                {[
                  { name: "CVD_THK_STRATEGY", param: "GATOX_THK", ruleCount: 5, action: "AUTO_HOLD", active: true },
                  { name: "ETCH_CD_STRATEGY", param: "POLY_CD", ruleCount: 8, action: "EMAIL_ENG", active: true },
                  { name: "CMP_RATE_STRATEGY", param: "CMP_RATE", ruleCount: 4, action: "WARN_ONLY", active: true }
                ].map((s) => (
                  <div key={s.name} className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">{s.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-1 block">Param: {s.param} &nbsp;|&nbsp; Checked Rules: {s.ruleCount}</span>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-[#FF4F6A]/10 text-[#FF4F6A] border border-[#FF4F6A]/20 uppercase">
                        {s.action}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0A0F1C] p-4 rounded-xl border border-white/5 space-y-4">
              <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2">Batch Limit Generation</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Run Phase I analysis over the last 30 completed lots to calculate statistical limits (mean, standard deviation) using Shewhart Rbar/Sbar methodology.
              </p>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span>Methodology</span>
                  <span className="text-slate-200">Shewhart Sbar (Robust)</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span>Phase I Samples</span>
                  <span className="text-slate-200">30 Lots × 25 Wafers</span>
                </div>
              </div>
              <button className="w-full flex items-center justify-center gap-2 py-2 bg-[#00E5C4] text-[#0A0F1C] font-semibold text-xs rounded-xl hover:bg-[#00c4a7] transition-all">
                <Play className="w-3.5 h-3.5 fill-current" /> Batch Limit Calculation Engine
              </button>
            </div>
          </div>
        )}

        {/* DATA ANALYZER CHART TAB */}
        {spcTab === "analyzer" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-slate-500 font-mono block uppercase">Active SPC Parameter</span>
                <span className="text-xs font-bold text-slate-200">GATOX_THK (Gate Oxide Thickness, Å)</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#FF4F6A]"></span> Violation</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#00E5C4]"></span> Process Point</span>
              </div>
            </div>

            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={points} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="index" stroke="#64748B" fontSize={10} />
                  <YAxis domain={[28, 36]} stroke="#64748B" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0F1626", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    labelFormatter={(label) => `Subgroup #${label}`}
                    formatter={(val, name, props) => {
                      const detail = props.payload.violation;
                      return [
                        <span>
                          {val} Å {detail && <span className="text-[#FF4F6A] ml-2">({detail})</span>}
                        </span>,
                        "Thickness"
                      ];
                    }}
                  />
                  <ReferenceLine y={32.1} stroke="rgba(148, 163, 184, 0.5)" label={{ value: "CL (32.1 Å)", fill: "#64748B", fontSize: 9 }} />
                  <ReferenceLine y={35.0} stroke="#FF4F6A" strokeDasharray="3 3" label={{ value: "+3σ UCL (35.0 Å)", fill: "#FF4F6A", fontSize: 9, position: "insideTopLeft" }} />
                  <ReferenceLine y={29.2} stroke="#FF4F6A" strokeDasharray="3 3" label={{ value: "-3σ LCL (29.2 Å)", fill: "#FF4F6A", fontSize: 9, position: "insideBottomLeft" }} />
                  
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#00E5C4"
                    strokeWidth={1.5}
                    dot={(props) => {
                      const isViolation = props.payload.violation !== "";
                      return (
                        <circle
                          key={props.index}
                          cx={props.cx}
                          cy={props.cy}
                          r={isViolation ? 5 : 3}
                          fill={isViolation ? "#FF4F6A" : "#0A0F1C"}
                          stroke={isViolation ? "#FF4F6A" : "#00E5C4"}
                          strokeWidth={isViolation ? 2 : 1.5}
                          className={isViolation ? "animate-pulse" : ""}
                        />
                      );
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">Subgroup Size</span>
                  <span className="text-sm font-bold text-slate-200 font-mono">1 Wafer / Lot</span>
                </div>
              </div>
              <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">Cpk Index</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">1.42 (Capable)</span>
                </div>
              </div>
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
                <div className="text-[11px] text-rose-400 font-medium">
                  <strong>OOC Trigger Alert:</strong> Rule 1 breach detected at Lot #16. Automated hold recommendation escalated to SemiMind++.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ALARM HISTOGRAM VIEW TAB */}
        {spcTab === "alarm" && (
          <div className="space-y-4">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2">Active SPC Alarms Logs</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {[
                { date: "8/10 03:14", lot: "LOT_109", param: "GATOX_THK", rule: "Rule 1: Point Outside 3σ", value: 35.8, limit: 35.0, severity: "CRITICAL" },
                { date: "8/9 18:22", lot: "LOT_116", param: "POLY_CD", rule: "Rule 5: 2 of 3 beyond 2σ", value: 31.4, limit: 30.8, severity: "MAJOR" },
                { date: "8/8 11:45", lot: "LOT_122", param: "NMOS_VT", rule: "Rule 2: 9 pts same side", value: 0.79, limit: 0.72, severity: "MINOR" }
              ].map((al, i) => (
                <div key={i} className="p-3 bg-[#0A0F1C] border border-white/5 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-[10px]">{al.date}</span>
                    <span className="text-[#00E5C4] font-bold">{al.lot}</span>
                    <span className="text-slate-200">{al.param}</span>
                  </div>
                  <div className="text-slate-300 font-medium">{al.rule}</div>
                  <div className="text-slate-400">Value: <strong className="text-slate-200">{al.value}</strong> vs Limit: <strong className="text-rose-400">{al.limit}</strong></div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    al.severity === "CRITICAL" ? "bg-rose-500/15 text-rose-500 border border-rose-500/20" : "bg-amber-500/15 text-amber-500 border border-amber-500/20"
                  }`}>
                    {al.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CPK SUMMARY TAB */}
        {spcTab === "cpk" && (
          <div className="space-y-4">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2">Active Parameter Capabilities (Cpk)</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs font-mono text-slate-400">
                <thead>
                  <tr className="bg-[#0A0F1C] text-slate-500 uppercase text-[9px] tracking-wider border-b border-white/5">
                    <th className="p-3 text-left">Parameter</th>
                    <th className="p-3 text-right">Mean</th>
                    <th className="p-3 text-right">Sigma</th>
                    <th className="p-3 text-right">Cp</th>
                    <th className="p-3 text-right">Cpk</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { p: "NMOS_VT", mean: 0.724, sigma: 0.024, cp: 1.55, cpk: 1.48, status: "GOOD" },
                    { p: "PMOS_VT", mean: -0.682, sigma: 0.028, cp: 1.45, cpk: 1.39, status: "GOOD" },
                    { p: "NMOS_IDSAT", mean: 624.5, sigma: 18.2, cp: 1.62, cpk: 1.55, status: "GOOD" },
                    { p: "GATOX_THK", mean: 32.1, sigma: 1.15, cp: 1.30, cpk: 1.22, status: "WARN" },
                    { p: "POLY_CD", mean: 28.4, sigma: 0.95, cp: 1.48, cpk: 1.40, status: "GOOD" }
                  ].map((row) => (
                    <tr key={row.p} className="border-b border-white/5 hover:bg-slate-800/40">
                      <td className="p-3 text-left text-slate-200 font-bold">{row.p}</td>
                      <td className="p-3 text-right text-slate-300">{row.mean}</td>
                      <td className="p-3 text-right text-slate-300">{row.sigma}</td>
                      <td className="p-3 text-right text-slate-300">{row.cp}</td>
                      <td className={`p-3 text-right font-bold ${row.status === "WARN" ? "text-amber-500" : "text-emerald-400"}`}>{row.cpk}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                          row.status === "GOOD" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}>
                          {row.status === "GOOD" ? "CAPABLE" : "MARGINAL"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
