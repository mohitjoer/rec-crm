'use client';

import React from 'react';
import { useChart } from './chart-context';

export interface GridProps {
  horizontal?: boolean;
  vertical?: boolean;
}

const TICKS = [0.25, 0.5, 0.75, 1];

export function Grid({ horizontal = true }: GridProps) {
  const { margin, innerWidth, innerHeight } = useChart();

  if (!horizontal) return null;

  return (
    <g className="chart-grid pointer-events-none" opacity={0.4}>
      {TICKS.map((t) => {
        const y = margin.top + innerHeight * (1 - t);
        return (
          <line
            key={t}
            x1={margin.left}
            y1={y}
            x2={margin.left + innerWidth}
            y2={y}
            stroke="currentColor"
            className="text-zinc-300 dark:text-zinc-800"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
        );
      })}
    </g>
  );
}
