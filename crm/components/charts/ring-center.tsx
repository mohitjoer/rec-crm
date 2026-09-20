'use client';

import React from 'react';
import { useRingChart } from './ring-chart';

export interface RingCenterProps {
  defaultLabel?: string;
  className?: string;
}

export function RingCenter({
  defaultLabel = 'Total',
  className = '',
}: RingCenterProps) {
  const { data, size, total, hoveredIndex } = useRingChart();
  const cx = size / 2;
  const cy = size / 2;

  const activeItem = hoveredIndex !== null ? data[hoveredIndex] : null;
  const displayValue = activeItem
    ? Number(activeItem.value || 0).toLocaleString()
    : total.toLocaleString();
  const displayLabel = activeItem ? activeItem.label : defaultLabel;

  return (
    <g className={`ring-center pointer-events-none select-none ${className}`}>
      {/* Primary metric display */}
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

      {/* Metric descriptor or active segment name */}
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
