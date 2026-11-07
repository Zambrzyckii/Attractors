export interface QualityPreset {
  id: string;
  name: string;
  width: number;
  height: number;
}

const TINY: QualityPreset = { id: 'tiny', name: 'Tiny', width: 128, height: 128 };

export const QUALITIES: readonly QualityPreset[] = [
  { id: 'low', name: 'Low', width: 512, height: 512 },
  { id: 'medium', name: 'Medium', width: 1024, height: 1024 },
  { id: 'high', name: 'High', width: 2048, height: 1024 },
  { id: 'ultra', name: 'Ultra', width: 2048, height: 2048 },
];

export const DEFAULT_QUALITY = 'medium';
const HIGH_REFRESH_RATE = 100;

const ALL_QUALITIES = [TINY, ...QUALITIES];

export function hasQuality(id: string): boolean {
  return ALL_QUALITIES.some((candidate) => candidate.id === id);
}

export function defaultQualityFor(refreshRate: number): string {
  return refreshRate >= HIGH_REFRESH_RATE ? 'medium' : 'high';
}

export function findQuality(id: string): QualityPreset {
  const preset = ALL_QUALITIES.find((candidate) => candidate.id === id);
  if (!preset) {
    throw new Error(`Unknown quality ${id}.`);
  }
  return preset;
}
