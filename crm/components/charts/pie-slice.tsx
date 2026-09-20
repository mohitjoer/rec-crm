'use client';

import React from 'react';
import { usePieChart } from './pie-chart';

export interface PieSliceProps {
  index: number;
  hoverEffect?: 'grow' | 'none';
  fill?: string;
  className?: string;
}

const DEFAULT_MONOCHROME_COLORS = [
  '#ffffff', // crisp pure white
  '#a1a1aa', // zinc-400
  '#52525b', // zinc-600
  '#3f3f46', // zinc-700
  '#27272a', // zinc-800
];

export function PieSlice({
  index,
  hoverEffect = 'grow',
  fill,
  className = '',
}: PieSliceProps) {
  const { slices, hoveredIndex, setHoveredIndex } = usePieChart();
  const slice = slices[index];

  if (!slice) return null;

  const isHovered = hoveredIndex === index;
  const isAnyHovered = hoveredIndex !== null;

  const resolvedFill =
    fill ||
    slice.item.color ||
    slice.item.fill ||
    DEFAULT_MONOCHROME_COLORS[index % DEFAULT_MONOCHROME_COLORS.length];

  // Radial outward pop on hover
  const growOffset = hoverEffect === 'grow' && isHovered ? 4 : 0;
  const dx = Math.cos(slice.midAngle) * growOffset;
  const dy = Math.sin(slice.midAngle) * growOffset;

  return (
    <g
      transform={`translate(${dx}, ${dy})`}
      className="transition-transform duration-150 ease-out"
    >
      <path
        d={slice.pathD}
        fill={resolvedFill}
        opacity={isAnyHovered ? (isHovered ? 1 : 0.45) : 0.9}
        stroke="#09090b"
        strokeWidth={1.5}
        className={`cursor-pointer transition-opacity duration-150 ${className}`}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseMove={() => setHoveredIndex(index)}
      />
    </g>
  );
}
