import { AttractorPreset } from './attractor';

export const LORENZ: AttractorPreset = {
  id: 'lorenz',
  name: 'Lorenz',
  params: [
    { name: 'sigma', label: 'σ', value: 10, min: 4, max: 20 },
    {
      name: 'rho',
      label: 'ρ',
      value: 28,
      min: 0.5,
      max: 160,
      scale: 'log',
      marks: [
        { value: 1, title: 'Origin loses stability' },
        { value: 13.93, title: 'Homoclinic explosion' },
        { value: 24.06, title: 'Chaotic attractor becomes stable' },
        { value: 24.74, title: 'Hopf point, C± lose stability' },
        { value: 99.65, title: 'Periodic window' },
      ],
    },
    { name: 'beta', label: 'β', value: 8 / 3, min: 0.5, max: 4 },
  ],
  deriv: `vec3 deriv(vec3 p) {
  return vec3(sigma * (p.y - p.x), p.x * (rho - p.z) - p.y, p.x * p.y - beta * p.z);
}`,
  center: [0, 0, 24.8],
  halfExtent: 25.9,
  centroid: [0, 0, 23.55],
  rmsRadius: 14.78,
  meanSpeed: 95.7,
  ftleRange: [-0.33, 3.3],
  typicalSpeed: 95,
  timeScale: 0.72,
  maxStep: 0.004,
  start: [1, 1, 1],
  spread: 0.3,
};
