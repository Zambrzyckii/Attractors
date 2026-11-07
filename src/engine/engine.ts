import { AttractorPreset } from './attractors/attractor';
import { ATTRACTORS, findAttractor } from './attractors/registry';
import { FrameClock, smoothing } from './frame-clock';
import { createGlContext, GlCaps } from './gl/context';
import { PingPong } from './gl/ping-pong';
import { RenderTarget } from './gl/target';
import { OrbitCamera } from './math/orbit-camera';
import { AccumulatePass } from './passes/accumulate';
import { BlowUpPass } from './passes/blow-up';
import { CompositePass } from './passes/composite';
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
const INITIAL_AZIMUTH = 0.4 - Math.PI / 2;
const ELEVATION = -0.38;
const CAMERA_DISTANCE = 3.4;
const FOCAL_LENGTH = 2.72;
const AUTO_ROTATE_SPEED = 0.2;
const TRAIL_SECONDS = 0.11;

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
  private readonly accumulate: AccumulatePass;
  private readonly composite: CompositePass;
  private readonly blowUp: BlowUpPass;
  private splatTarget: RenderTarget;
  private history: PingPong;
  private readonly resizeObserver: ResizeObserver;
  private pendingSize: [number, number] | null = null;
  private readonly camera = new OrbitCamera();
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
    this.splat = new SplatPass(gl, this.programs);
    this.accumulate = new AccumulatePass(gl);
    this.composite = new CompositePass(gl);
    this.blowUp = new BlowUpPass(gl);
    this.splatTarget = this.createSplatTarget();
    this.history = this.createHistory();
    this.camera.azimuth = INITIAL_AZIMUTH;
    this.camera.elevation = ELEVATION;
    this.camera.focalLength = FOCAL_LENGTH;
    this.frameCamera();
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
    this.frameCamera();
    this.reseed();
  }

  dispose(): void {
    this.clock.stop();
    this.resizeObserver.disconnect();
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  private frameCamera(): void {
    this.camera.target = [...this.preset.center];
    this.camera.distance = CAMERA_DISTANCE * this.preset.halfExtent;
  }

  private reseed(): void {
    this.anchor.read.clear([...this.preset.start, 0]);
    this.simulate.runSteps(this.anchor, this.preset, ANCHOR_WARMUP_STEPS);
    this.seed.run(this.state.read, this.anchor.read, this.preset);
  }

  private frame(dt: number): void {
    this.applyPendingSize();
    this.camera.azimuth += dt * AUTO_ROTATE_SPEED;
    this.simulate.run(this.state, this.preset, dt * this.preset.timeScale);
    this.splat.run(this.splatTarget, this.state.read, this.preset, {
      viewProjection: this.camera.viewProjection(this.splatTarget.width, this.splatTarget.height),
      referenceDepth: CAMERA_DISTANCE * this.preset.halfExtent,
    });
    this.accumulate.run(this.history, this.splatTarget, smoothing(dt, TRAIL_SECONDS));
    this.composite.run(this.history.read);
    this.reportStats(dt);
  }

  private applyPendingSize(): void {
    if (this.pendingSize) {
      [this.canvas.width, this.canvas.height] = this.pendingSize;
      this.pendingSize = null;
      this.splatTarget.dispose();
      this.history.dispose();
      this.splatTarget = this.createSplatTarget();
      this.history = this.createHistory();
    }
  }

  private createSplatTarget(): RenderTarget {
    return new RenderTarget(this.gl, ...this.screenSize(), 'rgba16f');
  }

  private createHistory(): PingPong {
    return new PingPong(this.gl, ...this.screenSize(), 'rgba16f');
  }

  private screenSize(): [number, number] {
    return [Math.max(1, this.canvas.width), Math.max(1, this.canvas.height)];
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
