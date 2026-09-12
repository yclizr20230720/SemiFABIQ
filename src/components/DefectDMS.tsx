import React, { useState } from "react";
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Bug, ZoomIn, Eye, Sparkles } from "lucide-react";

const defectClasses = [
  { label: "Embedded Particle", count: 120, color: "#FF4F6A" },
  { label: "Active Bridging", count: 88, color: "#8B5CF6" },
  { label: "Line Scratch", count: 42, color: "#F59E0B" },
  { label: "Cu Crater", count: 26, color: "#38BDF8" },
  { label: "Film Bump", count: 15, color: "#84CC16" }
];

export default function DefectDMS() {
  const [defectTab, setDefectTab] = useState<"pareto" | "map" | "gallery" | "wpa">("pareto");

  // Mock wafer list for stacked count
  const paretoWafers = Array.from({ length: 10 }).map((_, i) => ({
    wafer: `WF_${i + 1}`,
    particle: Math.round(15 + Math.random() * 20),
    bridging: Math.round(10 + Math.random() * 15),
    scratch: Math.round(5 + Math.random() * 10),
    crater: Math.round(2 + Math.random() * 8),
    yield: Number((96.5 - i * 1.5 - Math.random() * 2).toFixed(1))
  }));

  const adcImages = [
    { class: "Embedded Particle", size: "1.4μm", conf: 96, layer: "POLY_CD", step: "LI-3041", img: "⚡" },
    { class: "Line Scratch", size: "12.8μm", conf: 89, layer: "MET1", step: "ME-4022", img: "〰️" },
    { class: "Active Bridging", size: "2.1μm", conf: 92, layer: "VIA1", step: "VI-5012", img: "🕸️" },
    { class: "Cu Crater", size: "4.5μm", conf: 94, layer: "MET2", step: "ME-6014", img: "💥" }
  ];

  return (
    <div className="flex flex-col gap-6" id="defect-dms-root">
      {/* SECTION HEADER */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Inline Defect DMS Workbench</span>
        <div className="h-[1px] flex-1 bg-slate-800"></div>
      </div>

      {/* TOP CONTROLS TAB */}
      <div className="flex border-b border-white/5 gap-2">
        {(
          [
            { id: "pareto", label: "Defect Pareto & Yield" },
            { id: "map", label: "Wafer Defect Coordinate Map" },
            { id: "gallery", label: "Auto Defect Classification (ADC)" },
            { id: "wpa", label: "WPA Patterns" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setDefectTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold tracking-wide transition-all border-b-2 -mb-[2px] ${
              defectTab === tab.id
                ? "border-[#00E5C4] text-[#00E5C4] bg-[#00E5C4]/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-[#131B2E] border border-white/5 rounded-2xl p-5 min-h-[350px]">
        {defectTab === "pareto" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Defect Pareto by Wafer Position</h4>
              <span className="text-xs text-[#00E5C4] font-semibold">10 Wafers Stacked</span>
            </div>

            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paretoWafers} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="wafer" stroke="#64748B" fontSize={10} />
                  <YAxis stroke="#64748B" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "#0F1626", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                  <Bar dataKey="particle" stackId="a" fill="#FF4F6A" name="Particle" />
                  <Bar dataKey="bridging" stackId="a" fill="#8B5CF6" name="Bridging" />
                  <Bar dataKey="scratch" stackId="a" fill="#F59E0B" name="Scratch" />
                  <Bar dataKey="crater" stackId="a" fill="#38BDF8" name="Crater" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap gap-4 items-center justify-center font-mono text-[10px] text-slate-400">
              {defectClasses.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0F1C] border border-white/5 rounded-xl">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }}></span>
                  <span>{item.label}: <strong>{item.count}</strong></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {defectTab === "map" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="flex justify-center">
              {/* Wafer coordinate points */}
              <svg width="220" height="220" viewBox="0 0 220 220" className="bg-[#0A0F1C] rounded-full border border-white/10 p-2">
                <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(255,255,255,0.08)" />
                {/* Randomly disperse points resembling a ring cluster */}
                {Array.from({ length: 120 }).map((_, i) => {
                  const angle = Math.random() * Math.PI * 2;
                  const radius = 55 + Math.random() * 35; // Ring cluster
                  const cx = 110 + Math.cos(angle) * radius;
                  const cy = 110 + Math.sin(angle) * radius;
                  const colors = ["#FF4F6A", "#8B5CF6", "#F59E0B", "#38BDF8"];
                  const color = colors[i % colors.length];
                  return <circle key={i} cx={cx} cy={cy} r="2" fill={color} opacity="0.85" />;
                })}
              </svg>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-[#FF4F6A]" />
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Spatial Coordinate Clustering</h4>
              </div>
              <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span>Classified Pattern</span>
                  <span className="text-rose-400 font-bold">RING EXCURSION</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span>Classification Conf</span>
                  <span className="text-slate-200">92.4%</span>
                </div>
                <div className="flex justify-between">
                  <span>Cluster Center Radius</span>
                  <span className="text-slate-200">75mm - 90mm</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {defectTab === "gallery" && (
          <div className="space-y-4">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2">Auto Defect Classification Gallery</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {adcImages.map((img, i) => (
                <div key={i} className="bg-[#0A0F1C] border border-white/5 rounded-xl p-3 flex flex-col gap-3 transition-all hover:border-[#00E5C4]/20 group">
                  <div className="h-[90px] w-full rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-4xl select-none group-hover:scale-105 transition-all">
                    {img.img}
                  </div>
                  <div className="font-mono text-xs text-slate-400 space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-200">
                      <span>{img.class}</span>
                      <span className="text-emerald-400">{img.conf}%</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>Size</span>
                      <span>{img.size}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>Layer</span>
                      <span>{img.layer}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>Step</span>
                      <span>{img.step}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {defectTab === "wpa" && (
          <div className="space-y-4">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2">Wafer Pattern Analysis (WPA)</h4>
            <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl text-xs text-slate-400 leading-relaxed">
              Automated spatial-to-equipment machine learning analyzer is evaluating incoming wafer defect maps. Results are logged immediately to SemiMind++.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
