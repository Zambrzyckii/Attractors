import { FrameClock, smoothing } from './frame-clock';
import { createGlContext, GlCaps } from './gl/context';
import { RenderTarget } from './gl/target';
import { SeedPass } from './passes/seed';
import { SplatPass } from './passes/splat';

export interface EngineStats {
  fps: number;
}

const STATS_INTERVAL_SECONDS = 0.25;
const STATE_SIZE = 1024;
const LORENZ_CENTER: [number, number, number] = [0, 0, 24.8];
const LORENZ_HALF_EXTENT = 25.9;
const INITIAL_YAW = 0.4;
const YAW_SPEED = 0.2;

export class AttractorEngine {
  readonly caps: GlCaps;
  private readonly gl: WebGL2RenderingContext;
  private readonly clock = new FrameClock();
  private readonly state: RenderTarget;
  private readonly seed: SeedPass;
  private readonly splat: SplatPass;
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
    this.state = new RenderTarget(gl, STATE_SIZE, STATE_SIZE, 'rgba32f');
    this.seed = new SeedPass(gl);
    this.seed.run(this.state, LORENZ_CENTER, LORENZ_HALF_EXTENT / 2);
    this.splat = new SplatPass(gl);
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

  dispose(): void {
    this.clock.stop();
    this.resizeObserver.disconnect();
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  private frame(dt: number): void {
    this.applyPendingSize();
    this.yaw += dt * YAW_SPEED;
    this.splat.run(this.state, {
      center: LORENZ_CENTER,
      halfExtent: LORENZ_HALF_EXTENT,
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
