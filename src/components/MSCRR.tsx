import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ShieldCheck, Scale, Award } from "lucide-react";

export default function MSCRR() {
  const studyList = [
    { test: "VC_14", unit: "V", q2: -0.69, lpl: -0.70, upl: -0.69, rr: 75.67, repro: 65.29, repeat: 38.25, cpkN: 0.71, status: "FAIL" },
    { test: "VC_52", unit: "V", q2: -0.67, lpl: -0.67, upl: 10.0, rr: 62.31, repro: 49.17, repeat: 38.27, cpkN: 0.39, status: "FAIL" },
    { test: "VC_DD", unit: "V", q2: 2.0, lpl: 1.93, upl: 2.11, rr: 7.38, repro: 3.32, repeat: 6.59, cpkN: 0.66, status: "PASS" },
    { test: "ISBH", unit: "μA", q2: -4.54, lpl: -4.58, upl: -4.5, rr: 100, repro: 100, repeat: 100, cpkN: 0.62, status: "FAIL" },
    { test: "VSU", unit: "V", q2: 4.48, lpl: 4.44, upl: -10.0, rr: 100, repro: 100, repeat: 35.55, cpkN: 2.17, status: "FAIL" }
  ];

  const chartData = [
    { name: "VC_14", sys1: 38.25, sys2: 36.44 },
    { name: "VC_52", sys1: 38.27, sys2: 34.12 },
    { name: "VC_DD", sys1: 6.59, sys2: 5.14 },
    { name: "ISBH", sys1: 100, sys2: 87.9 },
    { name: "VSU", sys1: 35.55, sys2: 46.3 }
  ];

  return (
    <div className="flex flex-col gap-6" id="msc-rr-root">
      {/* SECTION HEADER */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Measurement System Comparison (MSC / R&R)</span>
        <div className="h-[1px] flex-1 bg-slate-800"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Details */}
        <div className="lg:col-span-2 bg-[#131B2E] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Gauge R&R Repeatability / Reproducibility Analysis</h4>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-400">STUDY_ID: STUDY_2025_02</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs font-mono text-slate-400">
              <thead>
                <tr className="bg-[#0A0F1C] text-slate-500 uppercase text-[9px] tracking-wider">
                  <th className="p-3 text-left">Test Item</th>
                  <th className="p-3 text-right">Q2 Median</th>
                  <th className="p-3 text-right">UPL / LPL</th>
                  <th className="p-3 text-right">R&R %</th>
                  <th className="p-3 text-right">Repro %</th>
                  <th className="p-3 text-right">Repeat %</th>
                  <th className="p-3 text-center">Result</th>
                </tr>
              </thead>
              <tbody>
                {studyList.map((row) => (
                  <tr key={row.test} className="border-b border-white/5 hover:bg-slate-800/40">
                    <td className="p-3 text-left font-bold text-slate-200">{row.test}</td>
                    <td className="p-3 text-right text-slate-300">{row.q2}</td>
                    <td className="p-3 text-right text-slate-300">{row.upl} / {row.lpl}</td>
                    <td className={`p-3 text-right font-bold ${row.status === "FAIL" ? "text-rose-400" : "text-[#00E5C4]"}`}>{row.rr}%</td>
                    <td className="p-3 text-right text-slate-300">{row.repro}%</td>
                    <td className="p-3 text-right text-slate-300">{row.repeat}%</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                        row.status === "PASS"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart View */}
        <div className="bg-[#131B2E] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Scale className="w-4 h-4 text-[#8B5CF6]" />
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">System Repeatability Comparison</h4>
          </div>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#0F1626", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                <Bar dataKey="sys1" fill="#38BDF8" name="System 1 (EL1)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="sys2" fill="#10B981" name="System 2 (EL2)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-500 leading-relaxed font-medium">
            ⚠️ **Acceptability Failure**: 4 of 5 studied test parameters breached the maximum 10.0% R&R limit, demonstrating poor calibration uniformity between **EL1** and **EL2**.
          </div>
        </div>
      </div>
    </div>
  );
}
