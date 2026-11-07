import { smoothing } from '../frame-clock';
import { add, scale, subtract, Vec3 } from '../math/vec3';
import { ParticleStats } from '../passes/stats';
import { AttractorPreset } from './attractor';

export const PARAM_SLOTS = 8;
const FRAMING_SECONDS = 4;
const MIN_SPREAD = 0.25;

export class LiveAttractor {
  readonly params = new Float32Array(PARAM_SLOTS);
  center: Vec3;
  halfExtent: number;
  private readonly defaults = new Float32Array(PARAM_SLOTS);
  private targetCenter: Vec3;
  private targetHalfExtent: number;

  constructor(readonly preset: AttractorPreset) {
    this.defaults.set(preset.params.map(({ value }) => value));
    this.params.set(this.defaults);
    this.center = this.targetCenter = [...preset.center];
    this.halfExtent = this.targetHalfExtent = preset.halfExtent;
  }

  setParam(name: string, value: number): void {
    const index = this.preset.params.findIndex((param) => param.name === name);
    if (index < 0) {
      throw new Error(`Unknown parameter ${name} in ${this.preset.name}.`);
    }
    this.params[index] = value;
  }

  follow(stats: ParticleStats | null, dt: number): void {
    const { center, halfExtent, centroid, rmsRadius } = this.preset;
    if (this.params.every((value, index) => value === this.defaults[index])) {
      this.targetCenter = [...center];
      this.targetHalfExtent = halfExtent;
    } else if (stats && Number.isFinite(stats.rmsRadius)) {
      this.targetCenter = add(center, subtract(stats.centroid, centroid));
      if (stats.rmsRadius >= MIN_SPREAD * rmsRadius) {
        this.targetHalfExtent = (halfExtent * stats.rmsRadius) / rmsRadius;
      }
    }
    const amount = smoothing(dt, FRAMING_SECONDS);
    this.center = add(this.center, scale(subtract(this.targetCenter, this.center), amount));
    this.halfExtent *= (this.targetHalfExtent / this.halfExtent) ** amount;
  }
}
