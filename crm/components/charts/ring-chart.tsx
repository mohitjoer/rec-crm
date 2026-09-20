'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';

export interface RingDataItem {
  label: string;
  value: number;
  max?: number;
  target?: number;
  color?: string;
  [key: string]: unknown;
}

export interface RingChartContextValue {
  data: RingDataItem[];
  size: number;
  strokeWidth: number;
  ringGap: number;
  total: number;
  hoveredIndex: number | null;
  onHoverChange: (index: number | null) => void;
  getRingRadius: (index: number) => number;
}

const RingChartContext = createContext<RingChartContextValue | null>(null);

export function useRingChart() {
  const ctx = useContext(RingChartContext);
  if (!ctx) {
    throw new Error('useRingChart must be used within a RingChart component');
  }
  return ctx;
}

export interface RingChartProps {
  data: RingDataItem[];
  hoveredIndex?: number | null;
  onHoverChange?: (index: number | null) => void;
  size?: number;
  strokeWidth?: number;
  ringGap?: number;
  className?: string;
  children?: React.ReactNode;
}

export function RingChart({
  data,
  hoveredIndex,
  onHoverChange,
  size = 180,
  strokeWidth = 10,
  ringGap = 4,
  className = '',
  children,
}: RingChartProps) {
  const [internalHovered, setInternalHovered] = useState<number | null>(null);

  const currentHovered = hoveredIndex !== undefined ? hoveredIndex : internalHovered;
  const handleHoverChange = useMemo(
    () => (index: number | null) => {
      if (onHoverChange) {
        onHoverChange(index);
      }
      setInternalHovered(index);
    },
    [onHoverChange]
  );

  const total = useMemo(() => {
    return data.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  }, [data]);

  const getRingRadius = React.useCallback(
    (index: number) => {
      const cx = size / 2;
      const outerRadius = cx - strokeWidth / 2 - 4;
      return Math.max(10, outerRadius - index * (strokeWidth + ringGap));
    },
    [size, strokeWidth, ringGap]
  );

  const contextValue = useMemo(
    () => ({
      data,
      size,
      strokeWidth,
      ringGap,
      total,
      hoveredIndex: currentHovered,
      onHoverChange: handleHoverChange,
      getRingRadius,
    }),
    [data, size, strokeWidth, ringGap, total, currentHovered, handleHoverChange, getRingRadius]
  );

  return (
    <RingChartContext.Provider value={contextValue}>
      <div
        className={`relative inline-flex items-center justify-center select-none ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
          onMouseLeave={() => handleHoverChange(null)}
        >
          {children}
        </svg>
      </div>
    </RingChartContext.Provider>
  );
}
