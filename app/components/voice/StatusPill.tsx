import React from "react";

type Status = "disconnected" | "connecting" | "connected" | "error";

interface StatusPillProps {
  status: Status;
}

export function StatusPill({ status }: StatusPillProps) {
  const map: Record<Status, { label: string; dot: string; text: string; bg: string }> = {
    disconnected: { label: "Disconnected", dot: "bg-slate-300", text: "text-slate-600", bg: "bg-slate-50" },
    connecting: { label: "Connecting…", dot: "bg-amber-400 animate-pulse", text: "text-amber-700", bg: "bg-amber-50" },
    connected: { label: "Connected", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
    error: { label: "Error", dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50" },
  };
  const s = map[status];
  return (
    <div className={`inline-flex items-center gap-2 rounded-full ${s.bg} px-3 py-1 text-xs ${s.text}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`}></span>
      <span className="font-medium">Status: {s.label}</span>
    </div>
  );
}
