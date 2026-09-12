import React, { useState, useEffect } from "react";
import { 
  Home, Sliders, Map, BarChart2, Radio, Bug, Scale, Activity, Brain, 
  Settings, ClipboardCheck, Flame, Bell, Cpu
} from "lucide-react";

import YMSDashboard from "./components/YMSDashboard";
import WATAnalytics from "./components/WATAnalytics";
import CPBinMap from "./components/CPBinMap";
import SPCMonitor from "./components/SPCMonitor";
import FDCEngine from "./components/FDCEngine";
import DefectDMS from "./components/DefectDMS";
import MSCRR from "./components/MSCRR";
import AnomalyTraces from "./components/AnomalyTraces";
import AgentChat from "./components/AgentChat";
import FABControl from "./components/FABControl";
import MRBReview from "./components/MRBReview";
import BurnInDPPM from "./components/BurnInDPPM";

import { Lot, Equipment, Alarm, MRBDecision, AgentAction } from "./types";

type TabId = 
  | "yms" | "wat" | "cp" | "spc" | "fdc" | "defect" 
  | "msc" | "traces" | "agent" | "fab" | "mrb" | "burnin";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("yms");
  const [lots, setLots] = useState<Lot[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [mrb, setMrb] = useState<MRBDecision[]>([]);
  const [pendingActions, setPendingActions] = useState<AgentAction[]>([]);
  const [clock, setClock] = useState("");

  const refreshData = async () => {
    try {
      const [lotsRes, eqRes, alarmsRes, mrbRes, actRes] = await Promise.all([
        fetch("/api/data/lots"),
        fetch("/api/data/equipment"),
        fetch("/api/data/alarms"),
        fetch("/api/data/mrb"),
        fetch("/api/data/pending-actions")
      ]);

      if (lotsRes.ok) setLots(await lotsRes.json());
      if (eqRes.ok) setEquipment(await eqRes.json());
      if (alarmsRes.ok) setAlarms(await alarmsRes.json());
      if (mrbRes.ok) setMrb(await mrbRes.json());
      if (actRes.ok) setPendingActions(await actRes.json());
    } catch (err) {
      console.error("Failed to fetch simulated database data:", err);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000); // Poll every 10s for updates
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString("en-US", { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTriggerHold = async (lotId: string, reason: string) => {
    try {
      const res = await fetch("/api/robot/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lot_id: lotId, reason })
      });
      if (res.ok) refreshData();
    } catch (err) {
      console.error("Hold simulation trigger failed:", err);
    }
  };

  const handleTriggerPM = async (equipmentId: string) => {
    try {
      const res = await fetch("/api/robot/pm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equipment_id: equipmentId })
      });
      if (res.ok) refreshData();
    } catch (err) {
      console.error("PM simulation trigger failed:", err);
    }
  };

  const handleReleaseHold = async (lotId: string) => {
    try {
      const res = await fetch("/api/robot/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lot_id: lotId })
      });
      if (res.ok) refreshData();
    } catch (err) {
      console.error("Release simulation failed:", err);
    }
  };

  const menuItems: { id: TabId; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "yms", label: "YMS Dashboard", icon: <Home className="w-4 h-4" /> },
    { id: "wat", label: "WAT Analytics", icon: <Sliders className="w-4 h-4" /> },
    { id: "cp", label: "CP / Bin Map", icon: <Map className="w-4 h-4" /> },
    { id: "spc", label: "SPC Monitor", icon: <BarChart2 className="w-4 h-4" />, badge: alarms.filter(a => a.type === "critical").length },
    { id: "fdc", label: "FDC Engine", icon: <Radio className="w-4 h-4" /> },
    { id: "defect", label: "Defect DMS", icon: <Bug className="w-4 h-4" /> },
    { id: "msc", label: "MSC / R&R", icon: <Scale className="w-4 h-4" /> },
    { id: "traces", label: "Anomaly Traces", icon: <Activity className="w-4 h-4" /> },
    { id: "agent", label: "Agent AI", icon: <Brain className="w-4 h-4" />, badge: pendingActions.length },
    { id: "fab", label: "FAB Control", icon: <Settings className="w-4 h-4" /> },
    { id: "mrb", label: "MRB Review", icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: "burnin", label: "Burn-in / DPPM", icon: <Flame className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#060A12] text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* HEADER BAR */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#060A12]/95 backdrop-blur-md border-b border-white/5 flex items-center px-6 gap-6 z-50">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#00E5C4]" />
          <h1 className="font-display font-extrabold text-lg tracking-tight bg-gradient-to-r from-[#00E5C4] to-indigo-400 bg-clip-text text-transparent">
            SEMFAB·IQ
          </h1>
        </div>

        <div className="flex-1 overflow-x-auto flex gap-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                activeTab === item.id
                  ? "bg-[#00E5C4]/15 text-[#00E5C4] border-[#00E5C4]/20"
                  : "border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge ? (
                <span className="w-4 h-4 flex items-center justify-center bg-[#FF4F6A] text-white text-[9px] font-bold rounded-full animate-pulse ml-0.5">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#00E5C4] rounded-full animate-ping"></span>
            <span className="text-[#00E5C4] font-semibold">FAB-12 · N5 Node</span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">{clock} UTC</span>
        </div>
      </header>

      {/* VIEW WRAPPER */}
      <main className="flex-1 pt-14 flex">
        {/* SIDE BAR NAVIGATION */}
        <aside className="w-56 shrink-0 bg-[#060A12] border-r border-white/5 p-4 flex flex-col gap-6 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block mb-3 px-2">Analysis Domains</span>
            <div className="flex flex-col gap-1.5">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-left transition-all border ${
                    activeTab === item.id
                      ? "bg-[#00E5C4]/10 border-[#00E5C4]/25 text-[#00E5C4] font-semibold"
                      : "border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                  }`}
                >
                  <span className={activeTab === item.id ? "text-[#00E5C4]" : "text-slate-500"}>{item.icon}</span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge ? (
                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#FF4F6A] text-white rounded-full">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto border-t border-white/5 pt-4">
            <div className="p-3 bg-[#131B2E] border border-white/5 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-mono block">PLATFORM STATUS</span>
              <span className="text-xs font-bold text-emerald-400 font-mono mt-1 block">ONLINE / ACTIVE</span>
            </div>
          </div>
        </aside>

        {/* WORKSPACE AREA */}
        <section className="flex-1 min-w-0 p-6 overflow-y-auto bg-[#060A12]">
          {activeTab === "yms" && <YMSDashboard lots={lots} alarms={alarms} onSelectLot={(lotId) => setActiveTab("cp")} />}
          {activeTab === "wat" && <WATAnalytics />}
          {activeTab === "cp" && <CPBinMap lots={lots} />}
          {activeTab === "spc" && <SPCMonitor lots={lots} />}
          {activeTab === "fdc" && <FDCEngine />}
          {activeTab === "defect" && <DefectDMS />}
          {activeTab === "msc" && <MSCRR />}
          {activeTab === "traces" && <AnomalyTraces />}
          {activeTab === "agent" && (
            <AgentChat 
              lots={lots} 
              equipment={equipment} 
              pendingActions={pendingActions} 
              onActionExecuted={refreshData}
              onNavigateTab={(tab) => setActiveTab(tab)} 
            />
          )}
          {activeTab === "fab" && (
            <FABControl 
              lots={lots} 
              equipment={equipment} 
              onTriggerHold={handleTriggerHold} 
              onTriggerPM={handleTriggerPM} 
              onReleaseHold={handleReleaseHold} 
            />
          )}
          {activeTab === "mrb" && <MRBReview decisions={mrb} />}
          {activeTab === "burnin" && <BurnInDPPM />}
        </section>
      </main>
    </div>
  );
}
