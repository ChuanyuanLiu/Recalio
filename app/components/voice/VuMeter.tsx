import React from "react";

interface VuMeterProps {
  level: number;
}

export function VuMeter({ level }: VuMeterProps) {
  // Render 12 bars; fill proportionally by `level`
  const bars = Array.from({ length: 12 }, (_, i) => i);
  const activeCount = Math.round(level * bars.length);
  return (
    <div className="flex h-10 items-end gap-0.5">
      {bars.map((i) => {
        const active = i < activeCount;
        return (
          <div
            key={i}
            className={`flex-1 rounded-sm ${active ? "h-8 bg-emerald-500" : "h-2 bg-slate-200"}`}
            style={{ transition: "height 120ms ease" }}
          />
        );
      })}
    </div>
  );
}
