import { AttractorPreset } from './attractor';

export const AIZAWA: AttractorPreset = {
  id: 'aizawa',
  name: 'Aizawa',
  params: [
    { name: 'a', value: 0.95, min: 0.2, max: 1.2 },
    { name: 'b', value: 0.7, min: 0.5, max: 1.4 },
    { name: 'c', value: 0.6, min: 0.3, max: 1.2 },
    { name: 'd', value: 3.5, min: 0.8, max: 7 },
    { name: 'e', value: 0.25, min: 0.05, max: 0.5 },
    { name: 'f', value: 0.1, min: 0.02, max: 0.2 },
  ],
  deriv: `vec3 deriv(vec3 p) {
  return vec3(
    (p.z - b) * p.x - d * p.y,
    d * p.x + (p.z - b) * p.y,
    c + a * p.z - p.z * p.z * p.z / 3.0 - (p.x * p.x + p.y * p.y) * (1.0 + e * p.z) +
      f * p.z * p.x * p.x * p.x
  );
}`,
  center: [0, 0, 0.74],
  halfExtent: 1.49,
  centroid: [0, 0, 0.688],
  rmsRadius: 1.051,
  meanSpeed: 2.575,
  ftleRange: [-0.2, 0.31],
  typicalSpeed: 2.6,
  timeScale: 3,
  maxStep: 0.01,
  start: [0.1, 0, 0],
  spread: 0.14,
  seedAroundZ: true,
};
