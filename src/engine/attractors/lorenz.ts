import { AttractorPreset } from './attractor';

export const LORENZ: AttractorPreset = {
  id: 'lorenz',
  name: 'Lorenz',
  params: [
    { name: 'sigma', value: 10 },
    { name: 'rho', value: 28 },
    { name: 'beta', value: 8 / 3 },
  ],
  deriv: `vec3 deriv(vec3 p) {
  return vec3(sigma * (p.y - p.x), p.x * (rho - p.z) - p.y, p.x * p.y - beta * p.z);
}`,
  center: [0, 0, 24.8],
  halfExtent: 25.9,
  timeScale: 0.72,
  maxStep: 0.004,
};
