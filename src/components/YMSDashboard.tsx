import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { AlertCircle, ArrowUpRight, ArrowDownRight, Bell, CheckCircle, Flame, Hammer, Activity } from "lucide-react";
import { Lot, Alarm } from "../types";

interface YMSDashboardProps {
  lots: Lot[];
  alarms: Alarm[];
  onSelectLot: (lotId: string) => void;
}

export default function YMSDashboard({ lots, alarms, onSelectLot }: YMSDashboardProps) {
  const [timeRange, setTimeRange] = useState<"30d" | "90d" | "YTD">("30d");

  // Realistic daily trend points
  const rawYieldData = [
    { name: "Day 1", yield: 95.2 },
    { name: "Day 2", yield: 94.8 },
    { name: "Day 3", yield: 96.1 },
    { name: "Day 4", yield: 93.7 },
    { name: "Day 5", yield: 95.4 },
    { name: "Day 6", yield: 94.2 },
    { name: "Day 7", yield: 95.8 },
    { name: "Day 8", yield: 94.7 },
    { name: "Day 9", yield: 93.1 },
    { name: "Day 10", yield: 96.3 },
    { name: "Day 11", yield: 95.1 },
    { name: "Day 12", yield: 94.5 },
    { name: "Day 13", yield: 96.8 },
    { name: "Day 14", yield: 95.3 },
    { name: "Day 15", yield: 93.9 },
    { name: "Day 16", yield: 95.7 },
    { name: "Day 17", yield: 94.1 },
    { name: "Day 18", yield: 95.9 },
    { name: "Day 19", yield: 94.8 },
    { name: "Day 20", yield: 93.5 },
    { name: "Day 21", yield: 95.2 },
    { name: "Day 22", yield: 94.7 },
    { name: "Day 23", yield: 96.1 },
    { name: "Day 24", yield: 95.8 },
    { name: "Day 25", yield: 94.3 },
    { name: "Day 26", yield: 93.8 },
    { name: "Day 27", yield: 95.5 },
    { name: "Day 28", yield: 94.7 },
    { name: "Day 29", yield: 94.1 },
    { name: "Day 30", yield: 94.7 },
  ];

  // Adjust data points depending on time range to simulate real behavior
  const getYieldData = () => {
    if (timeRange === "30d") return rawYieldData;
    if (timeRange === "90d") {
      return Array.from({ length: 45 }).map((_, i) => ({
        name: `W${Math.floor(i / 3) + 1}D${(i % 3) + 1}`,
        yield: 93 + Math.sin(i * 0.4) * 2 + Math.random() * 2,
      }));
    }
    return Array.from({ length: 60 }).map((_, i) => ({
      name: `Month ${Math.floor(i / 5) + 1}`,
      yield: 92.5 + Math.cos(i * 0.2) * 3 + Math.random() * 2.5,
    }));
  };

  const avgYield = (getYieldData().reduce((acc, curr) => acc + curr.yield, 0) / getYieldData().length).toFixed(2);

  return (
    <div className="flex flex-col gap-6" id="yms-dashboard-root">
      {/* SECTION HEADER */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Yield Intelligence Console</span>
        <div className="h-[1px] flex-1 bg-slate-800"></div>
      </div>

      {/* MAIN PLOT & ALARMS FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Yield Trend Area Chart */}
        <div className="lg:col-span-2 bg-[#131B2E] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-[14px] bg-[#00E5C4] rounded-sm"></div>
              <h3 className="font-display text-sm font-semibold text-slate-200">Product Yield Trend & Limit Checks</h3>
            </div>
            
            {/* Time range selectors */}
            <div className="flex bg-[#0A0F1C] p-1 rounded-lg border border-white/5">
              {(["30d", "90d", "YTD"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                    timeRange === range
                      ? "bg-[#00E5C4]/15 text-[#00E5C4] border border-[#00E5C4]/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[260px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getYieldData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5C4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00E5C4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis domain={[80, 100]} stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0F1626", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  labelStyle={{ color: "#94A3B8", fontSize: "11px", fontWeight: "bold" }}
                  itemStyle={{ color: "#00E5C4", fontSize: "12px" }}
                  formatter={(v: any) => [`${parseFloat(v).toFixed(2)}%`, "Wafer Yield"]}
                />
                {/* Limits */}
                <ReferenceLine y={90.0} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: "SYL (90.0%)", fill: "#F59E0B", fontSize: 9, position: "insideBottomLeft" }} />
                <ReferenceLine y={85.0} stroke="#FF4F6A" strokeDasharray="4 4" label={{ value: "SBL (85.0%)", fill: "#FF4F6A", fontSize: 9, position: "insideBottomLeft" }} />
                
                <Area type="monotone" dataKey="yield" stroke="#00E5C4" strokeWidth={2} fillOpacity={1} fill="url(#yieldGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 border-t border-white/5 pt-4 mt-1">
            <div className="text-center md:border-r border-white/5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Current Yield</span>
              <span className="font-mono text-base font-bold text-[#00E5C4]">94.73%</span>
            </div>
            <div className="text-center md:border-r border-white/5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Interval Average</span>
              <span className="font-mono text-base font-bold text-slate-200">{avgYield}%</span>
            </div>
            <div className="text-center md:border-r border-white/5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Soft Yield Limit (SYL)</span>
              <span className="font-mono text-base font-bold text-amber-500">90.00%</span>
            </div>
            <div className="text-center md:border-r border-white/5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Soft Bin Limit (SBL)</span>
              <span className="font-mono text-base font-bold text-[#FF4F6A]">85.00%</span>
            </div>
            <div className="text-center col-span-2 md:col-span-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Process Capability (Cpk)</span>
              <span className="font-mono text-base font-bold text-emerald-500">1.42</span>
            </div>
          </div>
        </div>

        {/* Real-time Alarm log panel */}
        <div className="bg-[#131B2E] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-[14px] bg-[#FF4F6A] rounded-sm"></div>
              <h3 className="font-display text-sm font-semibold text-slate-200">Real-Time Alarms</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF4F6A]/15 text-[#FF4F6A] border border-[#FF4F6A]/20">
              {alarms.filter(a => a.type === "critical").length} Critical
            </span>
          </div>

          <div className="flex flex-col gap-2 max-h-[310px] overflow-y-auto pr-1">
            {alarms.map((alarm) => (
              <div
                key={alarm.id}
                className={`p-3 rounded-xl border border-white/5 bg-[#0F1626] transition-all hover:bg-slate-800 flex items-start gap-3 relative overflow-hidden ${
                  alarm.type === "critical"
                    ? "border-l-4 border-l-[#FF4F6A] shadow-md shadow-[#FF4F6A]/5"
                    : alarm.type === "warning"
                    ? "border-l-4 border-l-amber-500"
                    : "border-l-4 border-l-sky-500"
                }`}
              >
                <div className="text-base leading-none pt-0.5">
                  {alarm.type === "critical" ? "🔴" : alarm.type === "warning" ? "🟡" : "🔵"}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-slate-200 truncate">{alarm.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">{alarm.meta}</p>
                </div>
                <span className="text-[9px] text-slate-500 font-mono whitespace-nowrap self-start mt-0.5">{alarm.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ACTIVE LOT WAFER LIST */}
      <div className="bg-[#131B2E] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-[3px] h-[14px] bg-amber-500 rounded-sm"></div>
            <h3 className="font-display text-sm font-semibold text-slate-200">Fab WIP Inventory & Outlier Alerts</h3>
          </div>
          <span className="text-xs text-slate-400">Showing {lots.length} active lots</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {lots.map((lot) => {
            const isHold = lot.status === "HOLD";
            const isHighYield = lot.yield >= 95.0;
            const isWarning = lot.yield < 90.0 && lot.yield >= 85.0;
            const isCriticalExcursion = lot.yield < 85.0;

            return (
              <div
                key={lot.lot_id}
                onClick={() => onSelectLot(lot.lot_id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] bg-[#0A0F1C] flex flex-col gap-3 group ${
                  isHold 
                    ? "border-amber-500/35 hover:border-amber-500" 
                    : isCriticalExcursion
                    ? "border-[#FF4F6A]/35 hover:border-[#FF4F6A]"
                    : "border-white/5 hover:border-[#00E5C4]/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-200 group-hover:text-[#00E5C4] transition-colors">{lot.lot_id}</span>
                    {lot.priority === "HOT" && (
                      <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-500 font-mono text-[8px] font-bold rounded">HOT</span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                    isHold
                      ? "bg-amber-500/15 text-amber-500 border border-amber-500/20"
                      : "bg-emerald-500/15 text-emerald-500 border border-emerald-500/20"
                  }`}>
                    {lot.status}
                  </span>
                </div>

                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-[10px] text-slate-400">Gross Yield</span>
                  <span className={`font-display text-lg font-bold ${
                    isCriticalExcursion ? "text-[#FF4F6A]" : isWarning ? "text-amber-500" : "text-[#00E5C4]"
                  }`}>
                    {lot.yield.toFixed(2)}%
                  </span>
                </div>

                <div className="space-y-1.5 border-t border-white/5 pt-3 text-[10px] font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>Tester ID</span>
                    <span className="text-slate-200">{lot.tester}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Throughput (UPH)</span>
                    <span className="text-slate-200">{lot.uph}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rework Rate</span>
                    <span className="text-slate-200">{lot.rework.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="w-full bg-slate-800 h-[3px] rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isCriticalExcursion ? "bg-[#FF4F6A]" : isWarning ? "bg-amber-500" : "bg-[#00E5C4]"
                    }`}
                    style={{ width: `${lot.yield}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
