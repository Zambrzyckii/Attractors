import { AttractorPreset } from './attractor';

export const PARAM_SLOTS = 8;

export class LiveAttractor {
  readonly params = new Float32Array(PARAM_SLOTS);

  constructor(readonly preset: AttractorPreset) {
    this.params.set(preset.params.map(({ value }) => value));
  }

  setParam(name: string, value: number): void {
    const index = this.preset.params.findIndex((param) => param.name === name);
    if (index < 0) {
      throw new Error(`Unknown parameter ${name} in ${this.preset.name}.`);
    }
    this.params[index] = value;
  }
}
