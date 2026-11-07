import { AttractorPreset } from './attractor';

export const HALVORSEN: AttractorPreset = {
  id: 'halvorsen',
  name: 'Halvorsen',
  params: [{ name: 'a', value: 1.4 }],
  deriv: `vec3 deriv(vec3 p) {
  return -a * p - 4.0 * (p.yzx + p.zxy) - p.yzx * p.yzx;
}`,
  center: [-3.49, -3.49, -3.49],
  halfExtent: 9.84,
  centroid: [-3.094, -3.094, -3.094],
  rmsRadius: 7.65,
  meanSpeed: 38.17,
  typicalSpeed: 38.4,
  timeScale: 0.96,
  maxStep: 0.004,
  start: [-4.398, 2.825, -7.767],
  spread: 0.6,
};
