import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, ShieldCheck, Flame } from "lucide-react";

export default function AnomalyTraces() {
  const ptsCount = 100;
  const traces = Array.from({ length: ptsCount }).map((_, i) => {
    const x = i / ptsCount;
    // Simulate step change high-frequency signal
    const ref = i < 20 ? 200 : i < 70 ? 200 + Math.sin(i * 0.4) * 5 : 200 + (Math.random() - 0.5) * 5;
    const anom = i >= 55 && i < 80 ? ref * 0.6 + (Math.random() * 8 - 4) : ref + (Math.random() * 4 - 2);
    return {
      index: i,
      reference: Number(ref.toFixed(2)),
      anomaly: Number(anom.toFixed(2))
    };
  });

  return (
    <div className="flex flex-col gap-6" id="anomaly-traces-root">
      {/* SECTION HEADER */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">FDC Signal Anomaly Trace Reviews</span>
        <div className="h-[1px] flex-1 bg-slate-800"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signal Plot */}
        <div className="lg:col-span-2 bg-[#131B2E] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#FF4F6A]" />
              <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">ETP Multi-Sensor Chamber Trace</h4>
            </div>
            <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 bg-[#FF4F6A] rounded-sm"></span> Anomaly Trace</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 bg-[#00E5C4] rounded-sm"></span> Reference Baseline</span>
            </div>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={traces} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="index" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#0F1626", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                <Line type="monotone" dataKey="reference" stroke="#00E5C4" strokeWidth={1} dot={false} name="Reference Trace" />
                <Line type="monotone" dataKey="anomaly" stroke="#FF4F6A" strokeWidth={1.5} dot={false} name="Anomalous Trace" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Attribution Grid */}
        <div className="bg-[#131B2E] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Top Contributive Sensor Features</h4>
          </div>

          <div className="space-y-3 font-mono text-xs text-slate-300">
            {[
              { feature: "Gas_Ar (sccm)_4_5", anomCount: 38, refCount: 90, score: 0.94 },
              { feature: "RF_Forward_Power_Max", anomCount: 38, refCount: 95, score: 0.88 },
              { feature: "BiasMatchShunt_Shape", anomCount: 38, refCount: 96, score: 0.81 },
              { feature: "Chamber_Press_Mean", anomCount: 38, refCount: 97, score: 0.72 }
            ].map((f, i) => (
              <div key={i} className="p-3 bg-[#0A0F1C] border border-white/5 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-200">{f.feature}</span>
                  <span className="text-[#FF4F6A]">{(f.score * 100).toFixed(0)}% contribution</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Anomaly Samples: {f.anomCount}</span>
                  <span>Reference Samples: {f.refCount}</span>
                </div>
                <div className="w-full bg-slate-800 h-[3px] rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${f.score * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
