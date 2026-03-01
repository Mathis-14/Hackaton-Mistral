const LEGEND_ITEMS = [
  { label: "Current", color: "#ff8303" },
  { label: "Reachable", color: "#ffb103" },
  { label: "Locked", color: "#8e7246" },
  { label: "Suspected", color: "#d4a520" },
];

export default function MapLegend() {
  return (
    <div className="flex flex-wrap gap-2 text-[9px] uppercase tracking-[0.28em] text-white/40">
      {LEGEND_ITEMS.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-1.5 border border-white/8 bg-white/[0.03] px-2 py-1"
        >
          <span
            style={{ width: 8, height: 8, background: item.color }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
