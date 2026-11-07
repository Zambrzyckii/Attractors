import { AttractorPreset } from './attractor';
import { AIZAWA } from './aizawa';
import { BURKE_SHAW } from './burke-shaw';
import { HALVORSEN } from './halvorsen';
import { LORENZ } from './lorenz';

export const ATTRACTORS: readonly AttractorPreset[] = [LORENZ, AIZAWA, HALVORSEN, BURKE_SHAW];

export function findAttractor(id: string): AttractorPreset {
  const preset = ATTRACTORS.find((candidate) => candidate.id === id);
  if (!preset) {
    throw new Error(`Unknown attractor ${id}.`);
  }
  return preset;
}
