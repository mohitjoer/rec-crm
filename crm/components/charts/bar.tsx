'use client';

import React from 'react';
import { useChart } from './chart-context';

export interface BarProps {
  dataKey: string;
  lineCap?: 'butt' | 'round';
  fill?: string;
  className?: string;
}

export function Bar({
  dataKey,
  lineCap = 'butt',
  fill = '#ffffff',
  className = '',
}: BarProps) {
  const { data, margin, barGap, innerWidth, innerHeight, maxValue, tooltip, setTooltip } = useChart();

  if (data.length === 0) return null;

  const slotWidth = innerWidth / data.length;
  const barWidth = Math.max(1, slotWidth * (1 - barGap));
  const rx = lineCap === 'round' ? Math.min(barWidth / 2, 4) : 0;

  return (
    <g className={`chart-bars ${className}`}>
      {data.map((d, i) => {
        const val = Number(d[dataKey] ?? 0);
        const barHeight = Math.max(2, (val / maxValue) * innerHeight);
        const x = margin.left + i * slotWidth + (slotWidth - barWidth) / 2;
        const y = margin.top + innerHeight - barHeight;
        const isHovered = tooltip?.index === i;

        const isDefaultFill = fill === '#ffffff';
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            rx={rx}
            fill={isDefaultFill ? 'currentColor' : fill}
            opacity={tooltip ? (isHovered ? 1 : 0.4) : 0.85}
            className={`transition-opacity duration-150 cursor-pointer ${
              isDefaultFill ? 'text-zinc-900 dark:text-white' : ''
            }`}
            onMouseEnter={() => setTooltip({ item: d, x, y, index: i })}
            onMouseMove={() => setTooltip({ item: d, x, y, index: i })}
          />
        );
      })}
    </g>
  );
}
