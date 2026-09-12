import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Award, Flame, TrendingUp } from "lucide-react";

export default function BurnInDPPM() {
  const xs = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const best = [20, 8.7, 3.3, 1.1, 0.3, 0.07, 0.02, 0, 0, 0, 0];
  const avg = [20, 11.9, 6.5, 3.2, 1.6, 0.55, 0.12, 0.04, 0.01, 0, 0];
  const worst = [20, 14.6, 10.4, 6.9, 4.3, 2.5, 1.3, 0.55, 0.14, 0.04, 0];

  const chartData = xs.map((x, i) => ({
    name: `${x}%`,
    best: best[i],
    avg: avg[i],
    worst: worst[i]
  }));

  return (
    <div className="flex flex-col gap-6" id="burnin-dppm-root">
      {/* SECTION HEADER */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Reliability, Burn-In & DPPM Sweep Models</span>
        <div className="h-[1px] flex-1 bg-slate-800"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sweep Plot */}
        <div className="lg:col-span-2 bg-[#131B2E] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">DPPM Fallout vs % Burn-In Sweep</h4>
            <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 bg-[#10B981] rounded-sm"></span> Best Model</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 bg-[#38BDF8] rounded-sm"></span> Average Model</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 bg-[#FF4F6A] rounded-sm"></span> Worst Model</span>
            </div>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#0F1626", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                <Line type="monotone" dataKey="best" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} name="Best Model" />
                <Line type="monotone" dataKey="avg" stroke="#38BDF8" strokeWidth={2} dot={{ r: 3 }} name="Average Model" />
                <Line type="monotone" dataKey="worst" stroke="#FF4F6A" strokeWidth={2} dot={{ r: 3 }} name="Worst Model" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reliability stats cards */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#131B2E] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
              <span className="font-display text-xs font-semibold">Reliability Gain Output</span>
            </div>
            <div className="text-3xl font-display font-bold text-slate-100">+8.0%</div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Estimated Yield Gain through burn-in screening</p>
          </div>

          <div className="bg-[#131B2E] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sky-400">
              <Flame className="w-4 h-4" />
              <span className="font-display text-xs font-semibold">Excursion Minimization</span>
            </div>
            <div className="text-3xl font-display font-bold text-slate-100">40.0%</div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Decrease in downstream field failure excursions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
