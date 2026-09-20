'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';

export interface PieDataItem {
  label: string;
  value: number;
  color?: string;
  fill?: string;
  [key: string]: unknown;
}

export interface PieSliceComputed {
  item: PieDataItem;
  index: number;
  startAngle: number;
  endAngle: number;
  midAngle: number;
  pathD: string;
  percentage: number;
}

interface PieChartContextValue {
  data: PieDataItem[];
  slices: PieSliceComputed[];
  innerRadius: number;
  outerRadius: number;
  size: number;
  total: number;
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
}

const PieChartContext = createContext<PieChartContextValue | null>(null);

export function usePieChart() {
  const ctx = useContext(PieChartContext);
  if (!ctx) {
    throw new Error('usePieChart must be used within a PieChart component');
  }
  return ctx;
}

export interface PieChartProps {
  data: PieDataItem[];
  innerRadius?: number;
  size?: number;
  className?: string;
  children?: React.ReactNode;
}

export function PieChart({
  data,
  innerRadius = 55,
  size = 200,
  className = '',
  children,
}: PieChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = Math.max(innerRadius + 10, cx - 12);

  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  }, [data]);

  const slices = useMemo<PieSliceComputed[]>(() => {
    if (total <= 0 || data.length === 0) return [];

    let currentAngle = -Math.PI / 2; // Start at 12 o'clock

    return data.map((item, index) => {
      const val = Number(item.value) || 0;
      const fraction = val / total;
      const angleSpan = Math.min(fraction * 2 * Math.PI, 2 * Math.PI - 0.0001);
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan;
      const midAngle = startAngle + angleSpan / 2;
      currentAngle = endAngle;

      // Outer arc points
      const x1 = cx + outerRadius * Math.cos(startAngle);
      const y1 = cy + outerRadius * Math.sin(startAngle);
      const x2 = cx + outerRadius * Math.cos(endAngle);
      const y2 = cy + outerRadius * Math.sin(endAngle);

      // Inner arc points
      const x3 = cx + innerRadius * Math.cos(endAngle);
      const y3 = cy + innerRadius * Math.sin(endAngle);
      const x4 = cx + innerRadius * Math.cos(startAngle);
      const y4 = cy + innerRadius * Math.sin(startAngle);

      const largeArcFlag = angleSpan > Math.PI ? 1 : 0;

      const pathD = [
        `M ${x1} ${y1}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
        'Z',
      ].join(' ');

      return {
        item,
        index,
        startAngle,
        endAngle,
        midAngle,
        pathD,
        percentage: Math.round(fraction * 100),
      };
    });
  }, [data, total, cx, cy, innerRadius, outerRadius]);

  const contextValue = useMemo(
    () => ({
      data,
      slices,
      innerRadius,
      outerRadius,
      size,
      total,
      hoveredIndex,
      setHoveredIndex,
    }),
    [data, slices, innerRadius, outerRadius, size, total, hoveredIndex]
  );

  return (
    <PieChartContext.Provider value={contextValue}>
      <div
        className={`relative inline-flex items-center justify-center select-none ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {children}
        </svg>
      </div>
    </PieChartContext.Provider>
  );
}
