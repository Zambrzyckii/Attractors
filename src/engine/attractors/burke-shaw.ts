import { AttractorPreset } from './attractor';

export const BURKE_SHAW: AttractorPreset = {
  id: 'burke-shaw',
  name: 'Burke-Shaw',
  params: [
    { name: 's', value: 10, min: 2.5, max: 20 },
    { name: 'v', value: 4.272, min: 1, max: 8.5 },
  ],
  deriv: `vec3 deriv(vec3 p) {
  return vec3(-s * (p.x + p.y), -p.y - s * p.x * p.z, s * p.x * p.y + v);
}`,
  center: [0, 0, -0.01],
  halfExtent: 2.24,
  centroid: [0, 0, 0.14],
  rmsRadius: 1.337,
  meanSpeed: 8.23,
  ftleRange: [-0.35, 2.35],
  typicalSpeed: 8.2,
  timeScale: 0.72,
  maxStep: 0.003,
  start: [-1.011, 0.507, -0.938],
  spread: 0.07,
};
