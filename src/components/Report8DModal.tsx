import React, { useState, useEffect } from "react";
import { X, FileText, Copy, Check, Download, Loader2, Eye, Code2 } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";

interface Report8DModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export default function Report8DModal({ isOpen, onClose, sessionId }: Report8DModalProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"formatted" | "raw">("formatted");

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    fetch(`/api/agent/export-8d/${sessionId}`)
      .then((res) => res.text())
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load 8D report", err);
        setLoading(false);
      });
  }, [isOpen, sessionId]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `8D-RCA-Report-${sessionId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Formal 8D Root Cause Analysis & Resolution Report
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Automated Fab Excursion Documentation (Disciplines D1 - D8)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-[#070B14] p-0.5 rounded-lg border border-white/10 text-xs">
              <button
                onClick={() => setViewMode("formatted")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
                  viewMode === "formatted"
                    ? "bg-[#00E5C4]/20 text-[#00E5C4]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Formatted</span>
              </button>
              <button
                onClick={() => setViewMode("raw")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
                  viewMode === "raw"
                    ? "bg-purple-500/20 text-purple-300"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Raw MD</span>
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-white/10"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00E5C4] hover:bg-[#00c4a7] text-[#0A0F1C] text-xs font-semibold transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#070B14]">
          {loading ? (
            <div className="h-full flex items-center justify-center gap-2 text-slate-500 font-mono text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-[#00E5C4]" />
              <span>Generating formal 8D report...</span>
            </div>
          ) : viewMode === "formatted" ? (
            <div className="max-w-4xl mx-auto bg-[#0A0F1C] p-6 rounded-xl border border-white/5 shadow-lg">
              <MarkdownRenderer content={content} />
            </div>
          ) : (
            <div className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
              {content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
