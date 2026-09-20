'use client';

import React from 'react';
import { useChart } from './chart-context';

export interface BarXAxisProps {
  maxLabels?: number;
  className?: string;
}

export function BarXAxis({ maxLabels = 8, className = '' }: BarXAxisProps) {
  const { data, xDataKey, margin, innerWidth, innerHeight } = useChart();

  if (data.length === 0) return null;

  const total = data.length;
  const step = Math.max(1, Math.floor(total / maxLabels));
  const slotWidth = innerWidth / total;

  const labels = [];
  for (let i = 0; i < total; i += step) {
    const item = data[i];
    const text = String(item[xDataKey] ?? '');
    const x = margin.left + i * slotWidth + slotWidth / 2;
    const y = margin.top + innerHeight + 20;
    labels.push({ text, x, y, index: i });
  }

  return (
    <g className={`chart-x-axis ${className}`}>
      {labels.map((l) => (
        <text
          key={l.index}
          x={l.x}
          y={l.y}
          textAnchor="middle"
          fill="#71717a"
          fontSize={12}
          fontFamily="monospace"
        >
          {l.text}
        </text>
      ))}
    </g>
  );
}
