'use client';

import React from 'react';
import { useChart } from './chart-context';

export interface ChartTooltipProps {
  className?: string;
}

export function ChartTooltip({ className = '' }: ChartTooltipProps) {
  const { tooltip, xDataKey, width, margin, innerHeight } = useChart();

  if (!tooltip) return null;

  const { item, x, y } = tooltip;
  const label = String(item[xDataKey] ?? '');
  const value = item.value !== undefined ? String(item.value) : '';

  // Tooltip dimensions in SVG viewBox units
  const tooltipWidth = 110;
  const tooltipHeight = 44;

  // Center horizontally over bar, clamped within SVG boundaries
  const rawX = x - tooltipWidth / 2;
  const clampedX = Math.max(margin.left, Math.min(rawX, width - margin.right - tooltipWidth));

  // Position above the bar if space permits, otherwise below top margin
  const targetY = y - tooltipHeight - 8;
  const clampedY = targetY < margin.top ? margin.top + 4 : targetY;

  return (
    <g className={`chart-tooltip pointer-events-none transition-all duration-75 ${className}`}>
      {/* Subtle indicator guideline */}
      <line
        x1={x}
        y1={margin.top}
        x2={x}
        y2={margin.top + innerHeight}
        stroke="#3f3f46"
        strokeWidth={1}
        strokeDasharray="3 3"
        opacity={0.6}
      />

      {/* Tooltip Card */}
      <g transform={`translate(${clampedX}, ${clampedY})`}>
        <rect
          width={tooltipWidth}
          height={tooltipHeight}
          rx={6}
          fill="#09090b"
          stroke="#27272a"
          strokeWidth={1}
          filter="drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5))"
        />
        <text
          x={10}
          y={16}
          fill="#a1a1aa"
          fontSize={10}
          fontFamily="inherit"
          fontWeight={500}
        >
          {label}
        </text>
        <text
          x={10}
          y={32}
          fill="#ffffff"
          fontSize={13}
          fontFamily="inherit"
          fontWeight={600}
        >
          {value}{' '}
          <tspan fill="#71717a" fontSize={10} fontWeight={400}>
            calls
          </tspan>
        </text>
      </g>
    </g>
  );
}
