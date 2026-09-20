'use client';

import React, { useState, useMemo } from 'react';
import { ChartProvider } from './chart-context';
import { ChartMargin, TooltipState } from './types';

export interface BarChartProps {
  data: Record<string, unknown>[];
  xDataKey?: string;
  aspectRatio?: string;
  barGap?: number;
  margin?: Partial<ChartMargin>;
  className?: string;
  children?: React.ReactNode;
}

const DEFAULT_MARGIN: ChartMargin = { top: 8, right: 8, bottom: 40, left: 8 };
const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 250;

export function BarChart({
  data,
  xDataKey = 'day',
  aspectRatio = '4 / 1',
  barGap = 0.1,
  margin: userMargin,
  className = '',
  children,
}: BarChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const margin = useMemo(
    () => ({ ...DEFAULT_MARGIN, ...userMargin }),
    [userMargin]
  );

  const innerWidth = VIEWBOX_WIDTH - margin.left - margin.right;
  const innerHeight = VIEWBOX_HEIGHT - margin.top - margin.bottom;

  const maxValue = useMemo(() => {
    let max = 0;
    for (const d of data) {
      for (const val of Object.values(d)) {
        if (typeof val === 'number' && val > max) {
          max = val;
        }
      }
    }
    return max || 100;
  }, [data]);

  const contextValue = useMemo(
    () => ({
      data,
      xDataKey,
      margin,
      barGap,
      tooltip,
      setTooltip,
      width: VIEWBOX_WIDTH,
      height: VIEWBOX_HEIGHT,
      innerWidth,
      innerHeight,
      maxValue,
    }),
    [data, xDataKey, margin, barGap, tooltip, innerWidth, innerHeight, maxValue]
  );

  return (
    <ChartProvider value={contextValue}>
      <div
        className={`relative w-full overflow-visible select-none ${className}`}
        style={{ aspectRatio }}
      >
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className="w-full h-full overflow-visible"
          onMouseLeave={() => setTooltip(null)}
        >
          {children}
        </svg>
      </div>
    </ChartProvider>
  );
}
