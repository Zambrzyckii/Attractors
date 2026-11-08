import { smoothing } from '../frame-clock';
import { add, scale, subtract, Vec3 } from '../math/vec3';
import { ParticleStats } from '../passes/stats';
import { AttractorPreset } from './attractor';

export const PARAM_SLOTS = 8;
const FRAMING_SECONDS = 4;
const MIN_SPREAD = 0.25;
const MIN_SPEED = 0.25;
const GLIDE_SECONDS = 2;

export class LiveAttractor {
  readonly params = new Float32Array(PARAM_SLOTS);
  center: Vec3;
  halfExtent: number;
  private readonly defaults = new Float32Array(PARAM_SLOTS);
  private readonly glideFrom = new Float32Array(PARAM_SLOTS);
  private readonly glideTo = new Float32Array(PARAM_SLOTS);
  private readonly glideProgress = new Float64Array(PARAM_SLOTS).fill(1);
  private targetCenter: Vec3;
  private targetHalfExtent: number;
  private slowdown = 1;
  private targetSlowdown = 1;
  private speedScale = 1;
  private targetSpeedScale = 1;

  constructor(readonly preset: AttractorPreset) {
    this.defaults.set(preset.params.map(({ value }) => value));
    this.params.set(this.defaults);
    this.glideTo.set(this.defaults);
    this.center = this.targetCenter = [...preset.center];
    this.halfExtent = this.targetHalfExtent = preset.halfExtent;
  }

  get timeScale(): number {
    return this.preset.timeScale / this.slowdown;
  }

  get maxStep(): number {
    return this.preset.maxStep / this.slowdown;
  }

  get typicalSpeed(): number {
    return this.preset.typicalSpeed * this.speedScale;
  }

  setParam(name: string, value: number): void {
    const index = this.preset.params.findIndex((param) => param.name === name);
    if (index < 0) {
      throw new Error(`Unknown parameter ${name} in ${this.preset.name}.`);
    }
    const target = Math.fround(value);
    if (target === this.glideTo[index]) {
      return;
    }
    this.glideFrom[index] = this.params[index];
    this.glideTo[index] = target;
    this.glideProgress[index] = 0;
  }

  follow(stats: ParticleStats | null, dt: number): void {
    this.glide(dt);
    if (this.params.every((value, index) => value === this.defaults[index])) {
      this.targetCenter = [...this.preset.center];
      this.targetHalfExtent = this.preset.halfExtent;
      this.targetSlowdown = this.targetSpeedScale = 1;
    } else if (stats) {
      this.aimFraming(stats);
      this.aimSpeed(stats);
    }
    const amount = smoothing(dt, FRAMING_SECONDS);
    this.center = add(this.center, scale(subtract(this.targetCenter, this.center), amount));
    this.halfExtent *= (this.targetHalfExtent / this.halfExtent) ** amount;
    this.slowdown *= (this.targetSlowdown / this.slowdown) ** amount;
    this.speedScale *= (this.targetSpeedScale / this.speedScale) ** amount;
  }

  private glide(dt: number): void {
    this.glideProgress.forEach((progress, index) => {
      if (progress === 1) {
        return;
      }
      const next = Math.min(1, progress + dt / GLIDE_SECONDS);
      const from = this.glideFrom[index];
      const to = this.glideTo[index];
      this.glideProgress[index] = next;
      this.params[index] = next === 1 ? to : from + (to - from) * next;
    });
  }

  private aimFraming({ centroid, rmsRadius }: ParticleStats): void {
    const preset = this.preset;
    if (!Number.isFinite(rmsRadius)) {
      return;
    }
    this.targetCenter = add(preset.center, subtract(centroid, preset.centroid));
    if (rmsRadius >= MIN_SPREAD * preset.rmsRadius) {
      this.targetHalfExtent = (preset.halfExtent * rmsRadius) / preset.rmsRadius;
    }
  }

  private aimSpeed({ rmsRadius, meanSpeed }: ParticleStats): void {
    const preset = this.preset;
    if (!Number.isFinite(meanSpeed) || !Number.isFinite(rmsRadius) || rmsRadius <= 0) {
      return;
    }
    const rate = meanSpeed / rmsRadius / (preset.meanSpeed / preset.rmsRadius);
    this.targetSlowdown = Math.max(1, rate);
    this.targetSpeedScale = Math.max(MIN_SPEED, meanSpeed / preset.meanSpeed);
  }
}
