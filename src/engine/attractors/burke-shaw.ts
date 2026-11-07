import { AttractorPreset } from './attractor';

export const BURKE_SHAW: AttractorPreset = {
  id: 'burke-shaw',
  name: 'Burke-Shaw',
  params: [
    { name: 's', value: 10 },
    { name: 'v', value: 4.272 },
  ],
  deriv: `vec3 deriv(vec3 p) {
  return vec3(-s * (p.x + p.y), -p.y - s * p.x * p.z, s * p.x * p.y + v);
}`,
  center: [0, 0, -0.01],
  halfExtent: 2.24,
  timeScale: 0.72,
  maxStep: 0.003,
  start: [-1.011, 0.507, -0.938],
  spread: 0.07,
};
