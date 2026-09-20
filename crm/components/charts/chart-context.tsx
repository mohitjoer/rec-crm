'use client';

import React, { createContext, useContext } from 'react';
import { ChartContextValue } from './types';

const ChartContext = createContext<ChartContextValue | null>(null);

export function ChartProvider({
  value,
  children,
}: {
  value: ChartContextValue;
  children: React.ReactNode;
}) {
  return <ChartContext.Provider value={value}>{children}</ChartContext.Provider>;
}

export function useChart(): ChartContextValue {
  const ctx = useContext(ChartContext);
  if (!ctx) {
    throw new Error('useChart must be used within a ChartProvider');
  }
  return ctx;
}
