import { useEffect, useRef, useState } from "react";
import { ChevronRight, Filter, AlertTriangle } from "lucide-react";

interface CPBinMapProps {
  lots: any[];
}

export default function CPBinMap({ lots }: { lots: any[] }) {
  const [selectedLot, setSelectedLot] = useState("LOT_63.1");
  const [selectedWafer, setSelectedWafer] = useState("LOT_63.1_01");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const wafers = [
    { id: "LOT_63.1_01", yield: "62.3%", status: "BadWafer", bin8: 880 },
    { id: "LOT_63.1_02", yield: "81.4%", status: "GoodWafer", hbin: 1 },
    { id: "LOT_63.1_03", yield: "58.7%", status: "BadWafer", hbin_code: 14 },
    { id: "LOT_63.1_04", yield: "79.0%", status: "GoodWafer" },
    { id: "LOT_63.1_05", yield: "82.4%", status: "GoodWafer" },
    { id: "LOT_63.1_06", yield: "83.9%", status: "GoodWafer" },
    { id: "LOT_63.1_09", yield: "51.7%", status: "BadWafer" },
    { id: "LOT_63.1_12", yield: "85.8%", status: "GoodWafer" }
  ];

  const binData = [
    { code: "1-P", name: "Pass", count: 9857, pct: 87.01, color: "#00E5C4" },
    { code: "8-F", name: "Bin_8", count: 880, pct: 7.77, color: "#38BDF8" },
    { id: "14", code: "14-F", name: "Bin_14", count: 289, pct: 2.55, color: "#8B5CF6" },
    { id: "9", code: "9-F", name: "Bin_9", count: 226, pct: 1.99, color: "#F59E0B" },
    { id: "12", code: "12-F", name: "Bin_12", count: 38, pct: 0.34, color: "#FF4F6A" },
    { id: "4", code: "4-F", name: "Bin_4", count: 5, pct: 0.04, color: "#84CC16" }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const r = W / 2 - 12;

    ctx.clearRect(0, 0, W, H);

    // Save state for clipping mask (circular wafer shape)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    const cols = 22;
    const rows = 22;
    const dw = W / cols;
    const dh = H / rows;

    // Is bad wafer pattern?
    const isBad = selectedWafer === "LOT_63.1_01" || selectedWafer === "LOT_63.1_03" || selectedWafer === "LOT_63.1_09";

    for (let ry = 0; ry < rows; ry++) {
      for (let rx = 0; rx < cols; rx++) {
        const dx = rx * dw;
        const dy = ry * dh;
        const dist = Math.hypot(dx + dw / 2 - cx, dy + dh / 2 - cy);

        // Outside wafer edge check
        if (dist > r + 3) continue;

        let color = "#10B981"; // Pass teal-green by default

        // Generate patterns
        const distNorm = dist / r;
        const hashVal = Math.sin(rx * 12.9898 + ry * 78.233) * 43758.5453;
        const noise = hashVal - Math.floor(hashVal);

        if (isBad) {
          // Excursion scratch pattern or ring failure
          if (selectedWafer === "LOT_63.1_01") {
            // Edge and ring failure
            if (distNorm > 0.65 && noise > 0.2) {
              color = "#38BDF8"; // Bin 8 (blue)
            } else if (distNorm > 0.8 && noise > 0.1) {
              color = "#8B5CF6"; // Bin 14 (violet)
            } else if (Math.abs(rx - ry) < 2 && rx > 6 && rx < 16 && noise > 0.3) {
              color = "#FF4F6A"; // Scratch failure (red)
            }
          } else if (selectedWafer === "LOT_63.1_03") {
            // Center ring failure
            if (distNorm < 0.4 && noise > 0.3) {
              color = "#FF4F6A";
            } else if (distNorm > 0.7 && noise > 0.4) {
              color = "#F59E0B";
            }
          } else if (selectedWafer === "LOT_63.1_09") {
            // Half wafer spatial failure
            if (rx > 11 && noise > 0.25) {
              color = "#8B5CF6";
            }
          }
        } else {
          // Normal random failures
          if (noise > 0.94) {
            color = "#F59E0B";
          } else if (noise > 0.97) {
            color = "#FF4F6A";
          }
        }

        ctx.fillStyle = color;
        ctx.fillRect(dx + 0.5, dy + 0.5, dw - 1, dh - 1);
      }
    }

    ctx.restore();

    // Draw notch
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.moveTo(cx, H - 4);
    ctx.lineTo(cx - 8, H + 4);
    ctx.lineTo(cx + 8, H + 4);
    ctx.closePath();
    ctx.fill();

    // Draw outline circle
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

  }, [selectedWafer]);

  return (
    <div className="flex flex-col gap-6" id="cp-binmap-root">
      {/* SECTION HEADER */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Circuit Probe (CP) Die-Level Bin Map</span>
        <div className="h-[1px] flex-1 bg-slate-800"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wafer Selector List */}
        <div className="bg-[#131B2E] border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Lot Wafers</h4>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-400">LOT_63.1</span>
          </div>

          <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
            {wafers.map((w) => (
              <button
                key={w.id}
                onClick={() => setSelectedWafer(w.id)}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                  selectedWafer === w.id
                    ? "bg-[#00E5C4]/10 border-[#00E5C4]/30 text-[#00E5C4] font-semibold"
                    : "bg-[#0A0F1C] border-white/5 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: w.status === "BadWafer" ? "#FF4F6A" : "#10B981" }}></span>
                  <span className="font-mono">{w.id}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-mono font-bold ${w.status === "BadWafer" ? "text-rose-400" : "text-emerald-400"}`}>{w.yield}</span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Wafer Map Canvas Rendering */}
        <div className="bg-[#131B2E] border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center gap-4">
          <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider self-start border-b border-white/5 w-full pb-2">
            Wafer Map — {selectedWafer}
          </h4>
          <div className="flex items-center justify-center p-3 bg-[#0A0F1C]/60 rounded-full border border-white/5 shadow-inner">
            <canvas ref={canvasRef} width="260" height="260" className="block" />
          </div>
          <div className="text-center font-mono text-[11px] text-slate-400">
            Wafer Diameter: <span className="text-slate-200">300mm</span> &nbsp;|&nbsp; Edge Exclusion: <span className="text-slate-200">3mm</span>
          </div>
        </div>

        {/* Bin Pareto & Filters */}
        <div className="bg-[#131B2E] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Bin Pareto Summary</h4>
            <Filter className="w-4 h-4 text-slate-500" />
          </div>

          <div className="flex flex-col gap-3 font-mono text-xs">
            {binData.map((bin) => (
              <div key={bin.code} className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-[#0A0F1C] border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: bin.color }}></span>
                    <span className="font-bold text-slate-200">{bin.code}</span>
                    <span className="text-[10px] text-slate-500">({bin.name})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-200">{bin.count.toLocaleString()}</span>
                    <span className="text-[10px] text-[#00E5C4] ml-2">({bin.pct}%)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-800 h-[4px] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${bin.pct}%`, backgroundColor: bin.color }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-2.5 items-start text-amber-500 text-[11px] leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Yield Outlier Detected:</strong> Bin-8 is elevated at 7.77% on {selectedWafer}. Outlier corresponds to radial gas flow discrepancy in chamber EL23S18.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
