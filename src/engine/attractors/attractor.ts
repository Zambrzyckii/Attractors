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
  timeScale: number;
  maxStep: number;
}
