import React from 'react';
import clsx from 'clsx';

export interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: string;
  className?: string;
}

export function MetricCard({ label, value, subtext, icon, trend, className }: MetricCardProps) {
  return (
    <div className={clsx('p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 flex flex-col justify-between', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">{label}</span>
        {icon ? <div className="text-zinc-400">{icon}</div> : null}
      </div>
      <div className="mt-2">
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{value}</div>
        {subtext ? <p className="text-[11px] text-zinc-400 mt-1">{subtext}</p> : null}
        {trend ? <p className="text-[10px] text-zinc-300 font-mono mt-0.5">{trend}</p> : null}
      </div>
    </div>
  );
}
