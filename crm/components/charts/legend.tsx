'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { RingDataItem } from './ring-chart';

interface LegendItemContextValue {
  item: RingDataItem;
  index: number;
  isHovered: boolean;
  isAnyHovered: boolean;
  total: number;
  max: number;
  onHover: (index: number | null) => void;
}

const LegendItemContext = createContext<LegendItemContextValue | null>(null);

export function useLegendItem() {
  const ctx = useContext(LegendItemContext);
  if (!ctx) {
    throw new Error('useLegendItem must be used within a Legend component');
  }
  return ctx;
}

interface LegendItemScopeProps {
  item: RingDataItem;
  index: number;
  isHovered: boolean;
  isAnyHovered: boolean;
  total: number;
  max: number;
  onHover: (index: number | null) => void;
  children: React.ReactNode;
}

function LegendItemScope({
  item,
  index,
  isHovered,
  isAnyHovered,
  total,
  max,
  onHover,
  children,
}: LegendItemScopeProps) {
  const contextValue = useMemo(
    () => ({
      item,
      index,
      isHovered,
      isAnyHovered,
      total,
      max,
      onHover,
    }),
    [item, index, isHovered, isAnyHovered, total, max, onHover]
  );

  return (
    <LegendItemContext.Provider value={contextValue}>
      {children}
    </LegendItemContext.Provider>
  );
}

export interface LegendProps {
  hoveredIndex?: number | null;
  items: RingDataItem[];
  onHoverChange?: (index: number | null) => void;
  className?: string;
  children?: React.ReactNode;
}

export function Legend({
  hoveredIndex = null,
  items,
  onHoverChange,
  className = '',
  children,
}: LegendProps) {
  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  }, [items]);

  const handleHover = useMemo(
    () => onHoverChange || (() => {}),
    [onHoverChange]
  );

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      {items.map((item, index) => {
        const isHovered = hoveredIndex === index;
        const isAnyHovered = hoveredIndex !== null && hoveredIndex !== undefined;
        const max = item.max ?? item.target ?? (total || 100);

        return (
          <LegendItemScope
            key={item.label}
            item={item}
            index={index}
            isHovered={isHovered}
            isAnyHovered={isAnyHovered}
            total={total}
            max={max}
            onHover={handleHover}
          >
            {children}
          </LegendItemScope>
        );
      })}
    </div>
  );
}

export function LegendItemComponent({
  className = '',
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const { index, isHovered, isAnyHovered, onHover } = useLegendItem();

  return (
    <div
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      className={`group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 text-xs px-3 py-2 rounded-xl border transition-all duration-150 cursor-pointer overflow-hidden ${
        isHovered
          ? 'bg-zinc-100 border-zinc-400 text-zinc-950 shadow-sm dark:bg-zinc-800/90 dark:border-zinc-700 dark:text-white'
          : isAnyHovered
          ? 'bg-zinc-50/50 border-zinc-200/60 text-zinc-400 opacity-50 dark:bg-zinc-900/30 dark:border-zinc-900/60 dark:text-zinc-500'
          : 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:bg-zinc-100 hover:border-zinc-300 dark:bg-zinc-900/50 dark:border-zinc-800/80 dark:text-zinc-300 dark:hover:border-zinc-700/80 dark:hover:bg-zinc-900/80'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function LegendMarker({ className = '' }: { className?: string }) {
  const { item } = useLegendItem();
  const color = item.color || '#ffffff';

  return (
    <span
      className={`w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10 dark:ring-white/20 ${className}`}
      style={{ backgroundColor: color }}
    />
  );
}

export function LegendLabel({ className = '' }: { className?: string }) {
  const { item } = useLegendItem();

  return (
    <span className={`font-semibold min-w-0 break-words text-zinc-800 group-hover:text-zinc-950 dark:text-zinc-300 dark:group-hover:text-white transition-colors ${className}`}>
      {item.label}
    </span>
  );
}

export interface LegendValueProps {
  showPercentage?: boolean;
  className?: string;
}

export function LegendValue({
  showPercentage = false,
  className = '',
}: LegendValueProps) {
  const { item, max } = useLegendItem();
  const pct = Math.min(100, Math.round(((Number(item.value) || 0) / (max || 1)) * 100));

  return (
    <div className={`flex items-center gap-1 font-mono text-xs shrink-0 ${className}`}>
      <span className="font-bold text-zinc-900 dark:text-white">
        {Number(item.value || 0).toLocaleString()}
      </span>
      {showPercentage && (
        <span className="text-zinc-500 dark:text-zinc-400 text-[10px]">({pct}%)</span>
      )}
    </div>
  );
}

export function LegendProgress({ className = '' }: { className?: string }) {
  const { item, max } = useLegendItem();
  const pct = Math.min(100, Math.max(0, Math.round(((Number(item.value) || 0) / (max || 1)) * 100)));
  const color = item.color || '#ffffff';

  return (
    <div className={`col-start-2 col-span-2 w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden shrink-0 ${className}`}>
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}
