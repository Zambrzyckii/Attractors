export interface Sparkline {
  points: string;
  zero: number;
  head: { x: number; y: number };
}

export function buildSparkline(
  history: readonly number[],
  capacity: number,
  width: number,
  height: number,
  padding: number,
): Sparkline | null {
  if (history.length < 2) {
    return null;
  }
  const low = Math.min(0, ...history);
  const span = Math.max(0, ...history) - low || 1;
  const y = (value: number) => padding + (1 - (value - low) / span) * (height - 2 * padding);
  const step = width / (capacity - 1);
  const x = (index: number) => width - (history.length - 1 - index) * step;
  const last = history.length - 1;
  return {
    points: history.map((value, index) => `${x(index)},${y(value)}`).join(' '),
    zero: y(0),
    head: { x: x(last), y: y(history[last]) },
  };
}
