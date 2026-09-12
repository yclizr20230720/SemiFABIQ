import React, { useState } from "react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Activity, Radio, Percent, AlertCircle } from "lucide-react";

const sensorsList = [
  { alias: "CEID10OnlineTime", val: 100, color: "#10B981" },
  { alias: "ChmPress", val: 91.1, color: "#38BDF8" },
  { alias: "ChmTemp", val: 89.7, color: "#F59E0B" },
  { alias: "ChmTemp1SlotV", val: 31.8, color: "#FF4F6A" },
  { alias: "DAQ10HPCompCurrentR", val: 99.8, color: "#10B981" },
  { alias: "DAQ275HPCompCurrentT", val: 100, color: "#10B981" },
  { alias: "DAQ275HPPumpCurrentR", val: 58.4, color: "#FF4F6A" }
];

export default function FDCEngine() {
  const [fdcTab, setFdcTab] = useState<"spc" | "stack" | "virtual" | "link">("stack");
  const [selectedSensor, setSelectedSensor] = useState(sensorsList[1]);

  // Telemetry time points (sin wave with noise & injected anomaly step-up)
  const tracePoints = Array.from({ length: 60 }).map((_, i) => {
    const base = 5.2 + Math.sin(i * 0.3) * 0.3 + (Math.random() - 0.5) * 0.08;
    const abnormal = base + (i > 40 ? 0.85 + (Math.random() - 0.5) * 0.15 : 0);
    return {
      sec: i * 3,
      baseline: Number(base.toFixed(3)),
      qualification: Number(abnormal.toFixed(3)),
    };
  });

  return (
    <div className="flex flex-col gap-6" id="fdc-engine-root">
      {/* SECTION HEADER */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Fault Detection & Classification (FDC) Engine</span>
        <div className="h-[1px] flex-1 bg-slate-800"></div>
      </div>

      {/* COMPOSITE ANOMALY SCORE GAUGE/BAR */}
      <div className="bg-[#131B2E] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-[#FF4F6A] animate-pulse" />
            <div>
              <span className="text-[10px] text-slate-500 font-mono block uppercase">Real-Time Engine Health</span>
              <h3 className="font-display text-sm font-semibold text-slate-200">Chamber EL23S18 Composite Anomaly Score</h3>
            </div>
          </div>
          <span className="px-3 py-1 bg-rose-500/15 border border-rose-500/20 text-[#FF4F6A] font-bold text-xs rounded-full animate-pulse">
            CRITICAL ANOMALY SHIFT DETECTED
          </span>
        </div>

        {/* Mini Area Chart of anomaly score over time */}
        <div className="h-[90px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={Array.from({ length: 30 }).map((_, i) => {
                let score = 0.15 + Math.sin(i * 0.2) * 0.05 + Math.random() * 0.05;
                if (i > 22) score = 0.88 + Math.random() * 0.08; // Step up anomaly score
                return { name: `t-${30 - i}m`, score };
              })}
              margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4F6A" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#FF4F6A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="name" stroke="#64748B" fontSize={8} />
              <YAxis domain={[0, 1.0]} stroke="#64748B" fontSize={8} />
              <Tooltip contentStyle={{ backgroundColor: "#0F1626", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }} />
              <ReferenceLine y={0.80} stroke="#FF4F6A" strokeDasharray="3 3" label={{ value: "Alarm Threshold (0.80)", fill: "#FF4F6A", fontSize: 8 }} />
              <Area type="monotone" dataKey="score" stroke="#FF4F6A" strokeWidth={2} fillOpacity={1} fill="url(#scoreGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FDC WORKBENCH TAB SELECTOR */}
      <div className="flex border-b border-white/5 gap-2">
        {(
          [
            { id: "stack", label: "Sensor Trace Stack" },
            { id: "spc", label: "FDC Feature SPC" },
            { id: "virtual", label: "Virtual Sensor Synthesis" },
            { id: "link", label: "Chamber Match Link View" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFdcTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold tracking-wide transition-all border-b-2 -mb-[2px] ${
              fdcTab === tab.id
                ? "border-[#00E5C4] text-[#00E5C4] bg-[#00E5C4]/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-[#131B2E] border border-white/5 rounded-2xl p-5 min-h-[350px]">
        {/* TABS CONTAINER */}

        {fdcTab === "stack" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left list of sensors with qualifying pass rate */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Chamber Sensor Signals</h4>
                <span className="text-[10px] text-slate-500 font-mono">Limits: ±6σ</span>
              </div>

              <div className="flex flex-col gap-2 max-h-[330px] overflow-y-auto pr-1">
                {sensorsList.map((sensor) => (
                  <button
                    key={sensor.alias}
                    onClick={() => setSelectedSensor(sensor)}
                    className={`p-3 rounded-xl border text-xs text-left transition-all flex flex-col gap-2 ${
                      selectedSensor.alias === sensor.alias
                        ? "bg-[#00E5C4]/10 border-[#00E5C4]/30 text-[#00E5C4]"
                        : "bg-[#0A0F1C] border-white/5 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono text-xs font-bold truncate max-w-[150px]">{sensor.alias}</span>
                      <span className={`font-mono text-[10px] font-bold ${sensor.val >= 90 ? "text-emerald-400" : "text-rose-400"}`}>
                        {sensor.val}% pass
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-[3px] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${sensor.val}%`,
                          backgroundColor: sensor.val >= 90 ? "#10B981" : "#FF4F6A"
                        }}
                      ></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right plot of selected trace baseline vs target */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200">{selectedSensor.alias} Trace Analysis</span>
                  <span className="px-2 py-0.5 rounded text-[8px] bg-amber-500/10 text-amber-500 font-mono border border-amber-500/20">EVENT OVERLAY</span>
                </div>
                <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 bg-sky-500 rounded-sm"></span> Qualification</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 bg-[#FF4F6A] rounded-sm"></span> Baseline</span>
                </div>
              </div>

              <div className="h-[210px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tracePoints} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="sec" stroke="#64748B" fontSize={9} />
                    <YAxis stroke="#64748B" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: "#0F1626", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                    <Line type="monotone" dataKey="baseline" stroke="#FF4F6A" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="qualification" stroke="#38BDF8" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 bg-[#0A0F1C] border border-white/5 rounded-xl flex justify-between font-mono text-[10px] text-slate-400">
                <div>DTW Distance: <span className="text-rose-400 font-bold">0.88</span></div>
                <div>LSTM Rec Error: <span className="text-rose-400 font-bold">4.22</span></div>
                <div>Status: <span className="text-rose-500 font-bold">ANOMALOUS SHIFT</span></div>
              </div>
            </div>
          </div>
        )}

        {fdcTab === "spc" && (
          <div className="space-y-4">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2">FDC Sensor Parameter Limits</h4>
            <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl text-xs font-mono text-slate-400 space-y-2">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>Indicator Key</span>
                <span className="text-slate-200">BPOFG_BiasMatch_Shape</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>Current baseline sigma</span>
                <span className="text-slate-200">6.00 sigma</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>Cpk Index</span>
                <span className="text-rose-400 font-bold">0.58 (Failing)</span>
              </div>
            </div>
          </div>
        )}

        {fdcTab === "virtual" && (
          <div className="space-y-4">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2">Virtual Sensor Synthesis</h4>
            <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl text-xs text-slate-400 leading-relaxed">
              Synthesizing Virtual Metrology signals based on physical chamber model inputs. Recalculates dynamically every 5 seconds.
            </div>
          </div>
        )}

        {fdcTab === "link" && (
          <div className="space-y-4">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2">Chamber Match Link View</h4>
            <div className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl text-xs text-slate-400 leading-relaxed">
              Comparison view overlay of current chamber profile versus golden chamber profile, displaying cosine similarity vector.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
