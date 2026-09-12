import React from "react";
import { Activity, ShieldCheck, Settings, AlertOctagon, HelpCircle } from "lucide-react";
import { Equipment, Lot } from "../types";

interface FABControlProps {
  lots: Lot[];
  equipment: Equipment[];
  onTriggerHold: (lotId: string, reason: string) => void;
  onTriggerPM: (equipmentId: string) => void;
  onReleaseHold: (lotId: string) => void;
}

export default function FABControl({ lots, equipment, onTriggerHold, onTriggerPM, onReleaseHold }: FABControlProps) {
  return (
    <div className="flex flex-col gap-6" id="fab-control-root">
      {/* SECTION HEADER */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Interactive FAB Fleet & Operator Panel</span>
        <div className="h-[1px] flex-1 bg-slate-800"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet health status tracker */}
        <div className="lg:col-span-2 bg-[#131B2E] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Equipment Fleet Status Tracker</h4>
            <span className="text-[10px] text-[#00E5C4] font-mono">16 tools active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {equipment.map((eq) => {
              const isMaintenance = eq.status === "MAINTENANCE";
              const isDown = eq.status === "DOWN";
              const isHold = eq.status === "HOLD";
              
              let healthColor = "text-emerald-400";
              let barColor = "bg-emerald-500";
              if (eq.health < 70) {
                healthColor = "text-rose-500";
                barColor = "bg-[#FF4F6A]";
              } else if (eq.health < 90) {
                healthColor = "text-amber-500";
                barColor = "bg-amber-500";
              }

              return (
                <div key={eq.equipment_id} className="p-4 bg-[#0A0F1C] border border-white/5 rounded-xl flex flex-col gap-3 transition-all hover:border-[#00E5C4]/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">{eq.equipment_id}</span>
                      <span className="text-[9px] text-slate-500 block font-mono">{eq.name}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                      isDown 
                        ? "bg-[#FF4F6A]/10 text-[#FF4F6A] border border-[#FF4F6A]/20" 
                        : isMaintenance 
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}>
                      {eq.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-mono text-[10px]">OEE Health Rating</span>
                    <span className={`font-bold font-mono ${healthColor}`}>{eq.health}%</span>
                  </div>

                  <div className="w-full bg-slate-800 h-[3px] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${eq.health}%` }}></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 border-t border-white/5 pt-3">
                    <div>Utilization: <strong className="text-slate-200">{eq.utilization}%</strong></div>
                    <div className="text-right">Throughput: <strong className="text-slate-200">{eq.wph} wph</strong></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Simulation Sandbox Console */}
        <div className="bg-[#131B2E] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Settings className="w-4 h-4 text-[#00E5C4]" />
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Operator Simulation Sandbox</h4>
          </div>

          <div className="space-y-4">
            {/* Hold Simulation */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-mono uppercase block">Simulate Lot Hold Alert</label>
              <div className="flex gap-2">
                <select id="holdLotSelector" className="flex-1 bg-[#0A0F1C] text-xs text-slate-200 px-3 py-2 rounded-xl border border-white/10 focus:outline-none">
                  {lots.filter(l => l.status !== "HOLD").map(l => (
                    <option key={l.lot_id} value={l.lot_id}>{l.lot_id} ({l.yield}%)</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const select = document.getElementById("holdLotSelector") as HTMLSelectElement;
                    if (select && select.value) {
                      onTriggerHold(select.value, "Simulated critical outlier yield excursion trigger");
                    }
                  }}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-[#0A0F1C] font-semibold text-xs rounded-xl transition-all"
                >
                  Hold Lot
                </button>
              </div>
            </div>

            {/* Release Simulation */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-mono uppercase block">Release Lot Hold</label>
              <div className="flex gap-2">
                <select id="releaseLotSelector" className="flex-1 bg-[#0A0F1C] text-xs text-slate-200 px-3 py-2 rounded-xl border border-white/10 focus:outline-none">
                  {lots.filter(l => l.status === "HOLD").map(l => (
                    <option key={l.lot_id} value={l.lot_id}>{l.lot_id}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const select = document.getElementById("releaseLotSelector") as HTMLSelectElement;
                    if (select && select.value) {
                      onReleaseHold(select.value);
                    }
                  }}
                  className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-[#0A0F1C] font-semibold text-xs rounded-xl transition-all"
                >
                  Release
                </button>
              </div>
            </div>

            {/* PM Simulation */}
            <div className="space-y-2 border-t border-white/5 pt-4">
              <label className="text-[10px] text-slate-500 font-mono uppercase block">Trigger Preventive Maintenance</label>
              <div className="flex gap-2">
                <select id="pmToolSelector" className="flex-1 bg-[#0A0F1C] text-xs text-slate-200 px-3 py-2 rounded-xl border border-white/10 focus:outline-none">
                  {equipment.filter(e => e.status !== "MAINTENANCE").map(e => (
                    <option key={e.equipment_id} value={e.equipment_id}>{e.equipment_id} (Health: {e.health})</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const select = document.getElementById("pmToolSelector") as HTMLSelectElement;
                    if (select && select.value) {
                      onTriggerPM(select.value);
                    }
                  }}
                  className="px-3 py-2 bg-[#8B5CF6] hover:bg-[#7c4df2] text-white font-semibold text-xs rounded-xl transition-all"
                >
                  Schedule PM
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
