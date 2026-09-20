'use client';

import React from 'react';
import { usePieChart } from './pie-chart';

export interface PieCenterProps {
  defaultLabel?: string;
  className?: string;
}

export function PieCenter({
  defaultLabel = 'Total',
  className = '',
}: PieCenterProps) {
  const { hoveredIndex, slices, total, size } = usePieChart();
  const cx = size / 2;
  const cy = size / 2;

  const activeSlice = hoveredIndex !== null ? slices[hoveredIndex] : null;
  const displayValue = activeSlice
    ? activeSlice.item.value.toLocaleString()
    : total.toLocaleString();
  const displayLabel = activeSlice
    ? `${activeSlice.item.label} (${activeSlice.percentage}%)`
    : defaultLabel;

  return (
    <g className={`pie-center pointer-events-none select-none ${className}`}>
      {/* Primary metric value */}
      <text
        x={cx}
        y={cy - 3}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={18}
        fontWeight={700}
        fontFamily="inherit"
        className="font-mono tracking-tight fill-zinc-900 dark:fill-white"
      >
        {displayValue}
      </text>

      {/* Metric label or active segment name */}
      <text
        x={cx}
        y={cy + 15}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={9}
        fontWeight={500}
        fontFamily="inherit"
        className="font-mono tracking-wider uppercase fill-zinc-500 dark:fill-zinc-400"
      >
        {displayLabel}
      </text>
    </g>
  );
}
