interface ChartSkeletonProps {
  height?: string;
}

export default function ChartSkeleton({ height = '350px' }: ChartSkeletonProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{ height }}
      className="w-full relative flex flex-col items-center justify-center bg-slate-50/30 rounded-2xl border border-slate-100/50 overflow-hidden select-none"
    >
      <div className="absolute inset-0 bg-slate-100/60 animate-pulse" />

      <span className="relative z-10 text-slate-400 text-xs font-medium tracking-wide">
        Loading chart data...
      </span>
    </div>
  );
}
