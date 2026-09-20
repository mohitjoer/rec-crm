'use client';

import React from 'react';
import { useRingChart } from './ring-chart';

export interface RingProps {
  index: number;
  className?: string;
}

const DEFAULT_RING_COLORS = [
  '#ffffff', // bright white
  '#a1a1aa', // zinc-400
  '#52525b', // zinc-600
  '#3f3f46', // zinc-700
  '#27272a', // zinc-800
];

export function Ring({ index, className = '' }: RingProps) {
  const {
    data,
    size,
    strokeWidth,
    total,
    hoveredIndex,
    onHoverChange,
    getRingRadius,
  } = useRingChart();

  const item = data[index];
  if (!item) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = getRingRadius(index);
  const circumference = 2 * Math.PI * radius;

  // Compute progress fraction
  const max = item.max ?? item.target ?? (total || 100);
  const fraction = Math.min(1, Math.max(0, (Number(item.value) || 0) / (max || 1)));
  const strokeDashoffset = circumference * (1 - fraction);

  const isHovered = hoveredIndex === index;
  const isAnyHovered = hoveredIndex !== null;
  const color = item.color || DEFAULT_RING_COLORS[index % DEFAULT_RING_COLORS.length];

  return (
    <g className={`ring-group ${className}`}>
      {/* Background track */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="#27272a"
        strokeWidth={strokeWidth}
        opacity={0.35}
      />

      {/* Progress arc */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={isHovered ? strokeWidth + 2 : strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        opacity={isAnyHovered ? (isHovered ? 1 : 0.35) : 0.95}
        className="transition-[stroke-width,opacity] duration-200 cursor-pointer"
        onMouseEnter={() => onHoverChange(index)}
        onMouseMove={() => onHoverChange(index)}
      />
    </g>
  );
}
