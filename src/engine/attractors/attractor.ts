export interface AttractorParam {
  name: string;
  value: number;
}

export interface AttractorPreset {
  id: string;
  name: string;
  params: AttractorParam[];
  deriv: string;
  center: [number, number, number];
  halfExtent: number;
  centroid: [number, number, number];
  rmsRadius: number;
  meanSpeed: number;
  typicalSpeed: number;
  timeScale: number;
  maxStep: number;
  start: [number, number, number];
  spread: number;
  seedAroundZ?: boolean;
}
