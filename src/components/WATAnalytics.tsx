import React, { useState } from "react";
import { BarChart, Bar, ScatterChart, Scatter, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { AlertCircle, Sliders, BarChart2, Activity, Info, Table } from "lucide-react";

const parametersList = [
  { id: "NMOS_VT", name: "NMOS Threshold Voltage (Vt)", unit: "V", avg: 0.724, usl: 0.85, lsl: 0.60, cpk: 1.48 },
  { id: "PMOS_VT", name: "PMOS Threshold Voltage (Vt)", unit: "V", avg: -0.682, usl: -0.55, lsl: -0.80, cpk: 1.39 },
  { id: "NMOS_IDSAT", name: "NMOS IDSAT Saturation Current", unit: "mA", avg: 624.5, usl: 700.0, lsl: 550.0, cpk: 1.55 },
  { id: "GATOX_THK", name: "Gate Oxide Thickness (TOX)", unit: "Å", avg: 32.1, usl: 35.0, lsl: 29.0, cpk: 1.22 },
  { id: "POLY_CD", name: "Poly Silicon CD Critical Dim", unit: "nm", avg: 28.4, usl: 32.0, lsl: 25.0, cpk: 1.40 },
  { id: "CMP_RATE", name: "CMP Removal Rate", unit: "Å/min", avg: 1540, usl: 1800, lsl: 1300, cpk: 1.15 },
  { id: "CONTACT_R", name: "Contact Resistance (Rc)", unit: "Ω", avg: 12.8, usl: 18.0, lsl: 8.0, cpk: 1.62 },
  { id: "METAL_R", name: "Metal Layer Resistance", unit: "Ω/sq", avg: 0.045, usl: 0.060, lsl: 0.030, cpk: 1.58 }
];

export default function WATAnalytics() {
  const [activeTab, setActiveTab] = useState<"dist" | "corr" | "anova" | "trend" | "site">("dist");
  const [selectedParam, setSelectedParam] = useState(parametersList[0]);

  // Simulated trend data with high variance
  const getTrendData = (param: typeof parametersList[0]) => {
    return Array.from({ length: 40 }).map((_, i) => {
      const noise = (Math.sin(i * 0.5) * 0.15 + (Math.random() - 0.5) * 0.25) * (param.usl - param.lsl);
      const val = param.avg + noise;
      const ucl = param.avg + 0.6 * (param.usl - param.lsl);
      const lcl = param.avg - 0.6 * (param.usl - param.lsl);
      return {
        lot: `L${300 + i}`,
        value: val,
        ucl,
        lcl,
        cl: param.avg
      };
    });
  };

  // 9-Site Uniformity map measurements
  const siteValues = [
    { id: "TC", label: "Top Center", value: selectedParam.avg * 1.01 },
    { id: "TL", label: "Top Left", value: selectedParam.avg * 0.99 },
    { id: "TR", label: "Top Right", value: selectedParam.avg * 1.02 },
    { id: "ML", label: "Mid Left", value: selectedParam.avg * 0.98 },
    { id: "C", label: "Center", value: selectedParam.avg * 1.0 },
    { id: "MR", label: "Mid Right", value: selectedParam.avg * 1.01 },
    { id: "BL", label: "Bottom Left", value: selectedParam.avg * 0.97 },
    { id: "BC", label: "Bottom Center", value: selectedParam.avg * 0.99 },
    { id: "BR", label: "Bottom Right", value: selectedParam.avg * 1.03 }
  ];

  // Correlation coefficients mock grid
  const corrMatrix = parametersList.map((p1) =>
    parametersList.map((p2) => {
      if (p1.id === p2.id) return 1.0;
      // High correlation mocks
      if (p1.id === "NMOS_VT" && p2.id === "NMOS_IDSAT") return -0.74;
      if (p1.id === "POLY_CD" && p2.id === "NMOS_IDSAT") return -0.62;
      if (p1.id === "GATOX_THK" && p2.id === "NMOS_VT") return 0.58;
      if (p1.id === "CONTACT_R" && p2.id === "METAL_R") return 0.44;
      return (Math.sin(p1.name.length * p2.name.length) * 0.25).toFixed(2);
    })
  );

  return (
    <div className="flex flex-col gap-6" id="wat-analytics-root">
      {/* SECTION HEADER */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Wafer Acceptance Test Analytics</span>
        <div className="h-[1px] flex-1 bg-slate-800"></div>
      </div>

      {/* PARAMETER SELECTOR ROW */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#131B2E] border border-white/5 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <Sliders className="w-5 h-5 text-[#00E5C4]" />
          <div>
            <span className="text-[10px] text-slate-400 block font-mono">Active Parametric Spec</span>
            <select
              value={selectedParam.id}
              onChange={(e) => {
                const found = parametersList.find((p) => p.id === e.target.value);
                if (found) setSelectedParam(found);
              }}
              className="bg-[#0A0F1C] text-sm text-slate-200 font-semibold px-3 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-[#00E5C4]"
            >
              {parametersList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unit})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 font-mono text-xs">
          <div className="bg-[#0A0F1C] border border-white/5 px-4 py-2 rounded-xl text-center">
            <span className="text-slate-500 text-[10px] block">TARGET</span>
            <span className="text-slate-200 font-bold">{selectedParam.avg.toFixed(3)}</span>
          </div>
          <div className="bg-[#0A0F1C] border border-white/5 px-4 py-2 rounded-xl text-center">
            <span className="text-slate-500 text-[10px] block">USL LIMIT</span>
            <span className="text-rose-500 font-bold">{selectedParam.usl.toFixed(3)}</span>
          </div>
          <div className="bg-[#0A0F1C] border border-white/5 px-4 py-2 rounded-xl text-center">
            <span className="text-slate-500 text-[10px] block">LSL LIMIT</span>
            <span className="text-[#00E5C4] font-bold">{selectedParam.lsl.toFixed(3)}</span>
          </div>
          <div className="bg-[#0A0F1C] border border-[#00E5C4]/20 px-4 py-2 rounded-xl text-center">
            <span className="text-slate-500 text-[10px] block">EST. Cpk</span>
            <span className="text-emerald-400 font-bold">{selectedParam.cpk}</span>
          </div>
        </div>
      </div>

      {/* TABBED CONTROLS */}
      <div className="flex flex-col gap-4">
        <div className="flex border-b border-white/5 gap-2">
          {(
            [
              { id: "dist", label: "Distribution Analysis" },
              { id: "corr", label: "Correlation Matrix" },
              { id: "anova", label: "Equipment ANOVA" },
              { id: "trend", label: "Parameter Trend" },
              { id: "site", label: "9-Site Wafer Map" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-semibold tracking-wide transition-all border-b-2 -mb-[2px] ${
                activeTab === tab.id
                  ? "border-[#00E5C4] text-[#00E5C4] bg-[#00E5C4]/5"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        <div className="bg-[#131B2E] border border-white/5 rounded-2xl p-5 min-h-[350px]">
          {activeTab === "dist" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <h4 className="text-xs font-mono text-slate-400 mb-4 uppercase tracking-wider">Normality & Spec-Fit Histogram</h4>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Array.from({ length: 15 }).map((_, i) => {
                        const midpoint = selectedParam.avg;
                        const spread = selectedParam.usl - selectedParam.lsl;
                        const offset = (i - 7) * (spread / 12);
                        const distance = Math.abs(offset / spread);
                        const value = Math.max(1, Math.round(100 * Math.exp(-3 * distance * distance) + Math.random() * 8));
                        return {
                          bin: (midpoint + offset).toFixed(3),
                          frequency: value,
                        };
                      })}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="bin" stroke="#64748B" fontSize={9} />
                      <YAxis stroke="#64748B" fontSize={10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0F1626", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                        formatter={(v) => [`${v} parts`, "Count"]}
                      />
                      <Bar dataKey="frequency" fill="rgba(139, 92, 246, 0.75)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[#0A0F1C] p-4 rounded-xl border border-white/5 space-y-4">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#00E5C4]" />
                  <span className="font-display text-xs font-semibold text-slate-200">Descriptive Stats</span>
                </div>
                <div className="space-y-2 font-mono text-xs text-slate-400">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span>N observations</span>
                    <span className="text-slate-200">2,548</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span>Shapiro-Wilk W</span>
                    <span className="text-slate-200">0.985</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span>Skewness</span>
                    <span className="text-slate-200">0.104</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span>Kurtosis</span>
                    <span className="text-slate-200">−0.052</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span>Normality Result</span>
                    <span className="text-emerald-400 font-semibold">PASSED</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span>Distribution Fit</span>
                    <span className="text-slate-200">Normal (Gaussian)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "corr" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Multi-Parametric Pearson Correlation</h4>
                <div className="flex gap-4 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-[#FF4F6A]/80 rounded-sm"></div> Negative Cor.
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-slate-800 rounded-sm"></div> No Cor.
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-[#00E5C4]/80 rounded-sm"></div> Positive Cor.
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-center text-xs font-mono text-slate-400 border-collapse">
                  <thead>
                    <tr className="bg-[#0A0F1C]">
                      <th className="p-3 text-left">Param ID</th>
                      {parametersList.map((p) => (
                        <th key={p.id} className="p-3 min-w-[70px] text-[10px] font-semibold">{p.id}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parametersList.map((p1, rowIndex) => (
                      <tr key={p1.id} className="border-b border-white/5 hover:bg-slate-800/40">
                        <td className="p-3 text-left font-semibold text-slate-200">{p1.id}</td>
                        {parametersList.map((p2, colIndex) => {
                          const val = Number(corrMatrix[rowIndex][colIndex]);
                          const isDiagonal = rowIndex === colIndex;
                          let bg = "rgba(255,255,255,0.02)";
                          let text = "text-slate-500";
                          if (isDiagonal) {
                            bg = "rgba(0, 229, 196, 0.25)";
                            text = "text-[#00E5C4] font-bold";
                          } else if (val >= 0.4) {
                            bg = `rgba(0, 229, 196, ${val * 0.45})`;
                            text = "text-[#00E5C4] font-semibold";
                          } else if (val <= -0.4) {
                            bg = `rgba(255, 79, 106, ${Math.abs(val) * 0.45})`;
                            text = "text-[#FF4F6A] font-semibold";
                          }

                          return (
                            <td
                              key={p2.id}
                              style={{ backgroundColor: bg }}
                              className={`p-3 border-r border-white/5 transition-all cursor-pointer ${text}`}
                              title={`${p1.id} x ${p2.id}`}
                            >
                              {val.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "anova" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <h4 className="text-xs font-mono text-slate-400 mb-4 uppercase tracking-wider">Variance Contribution by Tool Groups (η² Eta-Squared)</h4>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={[
                        { tool: "EL23S18 (CVD)", val: 0.389, count: 124, status: "DEGRADED" },
                        { tool: "EL23S14 (ETCH)", val: 0.226, count: 180, status: "HEALTHY" },
                        { tool: "CMP-05 (CMP)", val: 0.157, count: 95, status: "WATCH" },
                        { tool: "LITHO-02 (LITHO)", val: 0.088, count: 215, status: "HEALTHY" },
                        { tool: "EL23S13 (ETCH)", val: 0.042, count: 144, status: "HEALTHY" },
                      ]}
                      margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis type="number" stroke="#64748B" fontSize={10} />
                      <YAxis type="category" dataKey="tool" stroke="#64748B" fontSize={10} width={100} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0F1626", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                        formatter={(v) => [`${(Number(v) * 100).toFixed(1)}%`, "Variance Contribution"]}
                      />
                      <Bar dataKey="val" fill="#8B5CF6" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[#0A0F1C] p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Table className="w-4 h-4 text-[#8B5CF6]" />
                    <span className="font-display text-xs font-semibold text-slate-200">ANOVA Details</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                    Eta-squared measures the proportion of variance in the parametric test results associated with the equipment factor.
                  </p>
                  <div className="space-y-2 font-mono text-xs text-slate-400">
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span>F-Statistic</span>
                      <span className="text-slate-200">37.14</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span>p-value</span>
                      <span className="text-[#FF4F6A] font-semibold">9.83E-008</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span>Significant Factor</span>
                      <span className="text-[#FF4F6A] font-semibold">YES</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 text-[10px] leading-relaxed mt-4">
                  ⚠️ **Excursion Alert**: Tool **EL23S18** explains **38.9%** of the thickness variance. Maintenance action required.
                </div>
              </div>
            </div>
          )}

          {activeTab === "trend" && (
            <div>
              <h4 className="text-xs font-mono text-slate-400 mb-4 uppercase tracking-wider">Control Chart (UCL/LCL Rules)</h4>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getTrendData(selectedParam)} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="lot" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: "#0F1626", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                    <ReferenceLine y={selectedParam.avg} stroke="rgba(100,116,139,0.5)" strokeWidth={1} />
                    <ReferenceLine y={selectedParam.avg + 0.6 * (selectedParam.usl - selectedParam.lsl)} stroke="#FF4F6A" strokeDasharray="4 4" label={{ value: "UCL", fill: "#FF4F6A", fontSize: 9, position: "insideTopLeft" }} />
                    <ReferenceLine y={selectedParam.avg - 0.6 * (selectedParam.usl - selectedParam.lsl)} stroke="#FF4F6A" strokeDasharray="4 4" label={{ value: "LCL", fill: "#FF4F6A", fontSize: 9, position: "insideBottomLeft" }} />
                    <Line type="monotone" dataKey="value" stroke="#00E5C4" strokeWidth={2} dot={{ r: 3, stroke: "#00E5C4", fill: "#0A0F1C" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === "site" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex justify-center">
                {/* SVG Wafer Representation */}
                <svg width="220" height="220" viewBox="0 0 220 220" className="bg-[#0A0F1C] rounded-full border border-white/10 p-2">
                  <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                  {/* Notch */}
                  <path d="M 110,210 L 105,218 L 115,218 Z" fill="rgba(255,255,255,0.15)" />
                  {/* Outer zone circles */}
                  <circle cx="110" cy="110" r="70" fill="none" stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />
                  <circle cx="110" cy="110" r="40" fill="none" stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />
                  
                  {/* 9 site nodes */}
                  {/* TC */}
                  <circle cx="110" cy="40" r="8" fill="#F59E0B" opacity="0.8" />
                  <text x="110" y="43" fill="#0A0F1C" fontSize="7" fontWeight="bold" textAnchor="middle">TC</text>
                  
                  {/* TL */}
                  <circle cx="60" cy="60" r="8" fill="#00E5C4" opacity="0.8" />
                  <text x="60" y="63" fill="#0A0F1C" fontSize="7" fontWeight="bold" textAnchor="middle">TL</text>
                  
                  {/* TR */}
                  <circle cx="160" cy="60" r="8" fill="#F59E0B" opacity="0.8" />
                  <text x="160" y="63" fill="#0A0F1C" fontSize="7" fontWeight="bold" textAnchor="middle">TR</text>
                  
                  {/* ML */}
                  <circle cx="40" cy="110" r="8" fill="#00E5C4" opacity="0.8" />
                  <text x="40" y="113" fill="#0A0F1C" fontSize="7" fontWeight="bold" textAnchor="middle">ML</text>
                  
                  {/* Center */}
                  <circle cx="110" cy="110" r="10" fill="#00E5C4" opacity="0.9" />
                  <text x="110" y="113" fill="#0A0F1C" fontSize="8" fontWeight="bold" textAnchor="middle">C</text>
                  
                  {/* MR */}
                  <circle cx="180" cy="110" r="8" fill="#00E5C4" opacity="0.8" />
                  <text x="180" y="113" fill="#0A0F1C" fontSize="7" fontWeight="bold" textAnchor="middle">MR</text>
                  
                  {/* BL */}
                  <circle cx="60" cy="160" r="8" fill="#00E5C4" opacity="0.8" />
                  <text x="60" y="163" fill="#0A0F1C" fontSize="7" fontWeight="bold" textAnchor="middle">BL</text>
                  
                  {/* BC */}
                  <circle cx="110" cy="180" r="8" fill="#00E5C4" opacity="0.8" />
                  <text x="110" y="183" fill="#0A0F1C" fontSize="7" fontWeight="bold" textAnchor="middle">BC</text>
                  
                  {/* BR */}
                  <circle cx="160" cy="160" r="8" fill="#FF4F6A" opacity="0.8" />
                  <text x="160" y="163" fill="#0A0F1C" fontSize="7" fontWeight="bold" textAnchor="middle">BR</text>
                </svg>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Uniformity Site readings</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                  {siteValues.map((site) => {
                    const isHigh = site.value > selectedParam.usl || site.id === "BR";
                    const isLow = site.value < selectedParam.lsl;
                    return (
                      <div key={site.id} className="p-3 bg-[#0A0F1C] border border-white/5 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#00E5C4]">{site.id}</span>
                          <span className="text-slate-400 text-[10px]">{site.label}</span>
                        </div>
                        <span className={`font-mono font-bold ${isHigh ? "text-rose-500" : isLow ? "text-sky-500" : "text-slate-200"}`}>
                          {site.value.toFixed(3)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
