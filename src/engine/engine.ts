import { AttractorPreset } from './attractors/attractor';
import { ATTRACTORS, findAttractor } from './attractors/registry';
import { FrameClock, smoothing } from './frame-clock';
import { createGlContext, GlCaps } from './gl/context';
import { PingPong } from './gl/ping-pong';
import { BlowUpPass } from './passes/blow-up';
import { PresetPrograms } from './passes/preset-programs';
import { SeedPass } from './passes/seed';
import { SimulatePass } from './passes/simulate';
import { SplatPass } from './passes/splat';

export interface EngineStats {
  fps: number;
}

const STATS_INTERVAL_SECONDS = 0.25;
const STATE_SIZE = 1024;
const ANCHOR_WARMUP_STEPS = 3000;
const INITIAL_YAW = 0.4;
const YAW_SPEED = 0.2;

export class AttractorEngine {
  readonly caps: GlCaps;
  private readonly gl: WebGL2RenderingContext;
  private readonly clock = new FrameClock();
  private preset: AttractorPreset = ATTRACTORS[0];
  private readonly state: PingPong;
  private readonly anchor: PingPong;
  private readonly programs: PresetPrograms;
  private readonly seed: SeedPass;
  private readonly simulate: SimulatePass;
  private readonly splat: SplatPass;
  private readonly blowUp: BlowUpPass;
  private readonly resizeObserver: ResizeObserver;
  private pendingSize: [number, number] | null = null;
  private yaw = INITIAL_YAW;
  private statsListener: ((stats: EngineStats) => void) | null = null;
  private frameSeconds = 1 / 60;
  private sinceStats = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const { gl, caps } = createGlContext(canvas);
    this.gl = gl;
    this.caps = caps;
    this.state = new PingPong(gl, STATE_SIZE, STATE_SIZE, 'rgba32f');
    this.anchor = new PingPong(gl, 1, 1, 'rgba32f');
    this.seed = new SeedPass(gl);
    this.programs = new PresetPrograms(gl);
    this.simulate = new SimulatePass(gl, this.programs);
    this.splat = new SplatPass(gl);
    this.blowUp = new BlowUpPass(gl);
    this.reseed();
    this.resizeObserver = new ResizeObserver(([entry]) => {
      const ratio = window.devicePixelRatio;
      this.pendingSize = [
        Math.round(entry.contentRect.width * ratio),
        Math.round(entry.contentRect.height * ratio),
      ];
    });
    this.resizeObserver.observe(canvas);
  }

  start(): void {
    this.clock.start((dt) => this.frame(dt));
  }

  onStats(listener: (stats: EngineStats) => void): void {
    this.statsListener = listener;
  }

  blowUpParticles(): void {
    this.blowUp.run(this.state, this.preset);
  }

  setAttractor(id: string): void {
    const preset = findAttractor(id);
    if (preset === this.preset) {
      return;
    }
    this.preset = preset;
    this.reseed();
  }

  dispose(): void {
    this.clock.stop();
    this.resizeObserver.disconnect();
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  private reseed(): void {
    this.anchor.read.clear([...this.preset.start, 0]);
    this.simulate.runSteps(this.anchor, this.preset, ANCHOR_WARMUP_STEPS);
    this.seed.run(this.state.read, this.anchor.read, this.preset);
  }

  private frame(dt: number): void {
    this.applyPendingSize();
    this.yaw += dt * YAW_SPEED;
    this.simulate.run(this.state, this.preset, dt * this.preset.timeScale);
    this.splat.run(this.state.read, {
      center: this.preset.center,
      halfExtent: this.preset.halfExtent,
      yaw: this.yaw,
      width: this.canvas.width,
      height: this.canvas.height,
    });
    this.reportStats(dt);
  }

  private applyPendingSize(): void {
    if (this.pendingSize) {
      [this.canvas.width, this.canvas.height] = this.pendingSize;
      this.pendingSize = null;
    }
  }

  private reportStats(dt: number): void {
    if (dt <= 0) {
      return;
    }
    this.frameSeconds += (dt - this.frameSeconds) * smoothing(dt, 0.5);
    this.sinceStats += dt;
    if (this.sinceStats >= STATS_INTERVAL_SECONDS) {
      this.sinceStats = 0;
      this.statsListener?.({ fps: 1 / this.frameSeconds });
    }
  }
}
