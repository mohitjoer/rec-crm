export interface ChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface TooltipState {
  item: Record<string, unknown>;
  x: number;
  y: number;
  index: number;
}

export interface ChartContextValue {
  data: Record<string, unknown>[];
  xDataKey: string;
  margin: ChartMargin;
  barGap: number;
  tooltip: TooltipState | null;
  setTooltip: (tooltip: TooltipState | null) => void;
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  maxValue: number;
}
