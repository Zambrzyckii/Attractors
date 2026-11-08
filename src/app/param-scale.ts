import { AttractorParam } from '../engine/attractors/attractor';

export const STEPS = 1000;
export const SNAP_STEPS = 10;
export const SCALE_SPAN_PX = 1100;

const SAME_POSITION = 1e-6;
const RANGE_TOLERANCE = 1e-9;
const LINEAR_MAJOR_COUNT = 8;
const MINORS_PER_MAJOR = 5;
const NICE_FACTORS = [1, 2, 5];

export interface ScaleTicks {
  major: { value: number; label: string }[];
  minor: number[];
}

export function toPosition(param: AttractorParam, value: number): number {
  const { min, max, scale } = param;
  const fraction =
    scale === 'log' ? Math.log(value / min) / Math.log(max / min) : (value - min) / (max - min);
  return fraction * STEPS;
}

export function fromPosition(param: AttractorParam, position: number): number {
  const { min, max, scale } = param;
  const fraction = Math.min(Math.max(position, 0), STEPS) / STEPS;
  return scale === 'log' ? min * (max / min) ** fraction : min + fraction * (max - min);
}

export function formatValue(value: number): string {
  return String(Number(value.toPrecision(4)));
}

export function snapTargets(param: AttractorParam): number[] {
  const marks = param.marks?.map((mark) => mark.value) ?? [];
  return [param.value, ...marks].sort((a, b) => a - b);
}

export function snapDrag(param: AttractorParam, position: number): number {
  const distance = (target: number) => Math.abs(toPosition(param, target) - position);
  const nearest = snapTargets(param).reduce((best, target) =>
    distance(target) < distance(best) ? target : best,
  );
  return distance(nearest) <= SNAP_STEPS ? nearest : fromPosition(param, position);
}

export function keyStep(
  param: AttractorParam,
  value: number,
  key: string,
  shift: boolean,
): number | null {
  const targets = snapTargets(param);
  switch (key) {
    case 'Home':
      return param.min;
    case 'End':
      return param.max;
    case '[':
      return targets.filter((target) => target < value).at(-1) ?? null;
    case ']':
      return targets.find((target) => target > value) ?? null;
  }
  const move = keyMove(key, shift);
  if (move === null) {
    return null;
  }
  const position = toPosition(param, value) + move;
  const exact = targets.find(
    (target) => Math.abs(toPosition(param, target) - position) < SAME_POSITION,
  );
  return exact ?? fromPosition(param, position);
}

export function niceStep(span: number, count: number): number {
  const raw = span / count;
  const exponent = Math.floor(Math.log10(raw));
  const factor = NICE_FACTORS.find((candidate) => Number(`${candidate}e${exponent}`) >= raw) ?? 10;
  return Number(`${factor}e${exponent}`);
}

export function scaleTicks(param: AttractorParam): ScaleTicks {
  return param.scale === 'log' ? logTicks(param.min, param.max) : linearTicks(param.min, param.max);
}

function linearTicks(min: number, max: number): ScaleTicks {
  const step = niceStep(max - min, LINEAR_MAJOR_COUNT);
  const first = Math.ceil((min * MINORS_PER_MAJOR) / step - RANGE_TOLERANCE);
  const last = Math.floor((max * MINORS_PER_MAJOR) / step + RANGE_TOLERANCE);
  const ticks: ScaleTicks = { major: [], minor: [] };
  for (let index = first; index <= last; index++) {
    const value = (index * step) / MINORS_PER_MAJOR;
    if (index % MINORS_PER_MAJOR === 0) {
      ticks.major.push({ value, label: formatValue(value) });
    } else {
      ticks.minor.push(value);
    }
  }
  return ticks;
}

function logTicks(min: number, max: number): ScaleTicks {
  const ticks: ScaleTicks = { major: [], minor: [] };
  const lastDecade = Math.floor(Math.log10(max));
  for (let decade = Math.floor(Math.log10(min)); decade <= lastDecade; decade++) {
    for (let factor = 1; factor <= 9; factor++) {
      const value = Number(`${factor}e${decade}`);
      if (value < min || value > max) {
        continue;
      }
      if (NICE_FACTORS.includes(factor)) {
        ticks.major.push({ value, label: formatValue(value) });
      } else {
        ticks.minor.push(value);
      }
    }
  }
  return ticks;
}

function keyMove(key: string, shift: boolean): number | null {
  switch (key) {
    case 'ArrowLeft':
      return shift ? -10 : -1;
    case 'ArrowRight':
      return shift ? 10 : 1;
    case 'PageDown':
      return -100;
    case 'PageUp':
      return 100;
    default:
      return null;
  }
}
