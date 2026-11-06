import { FrameClock, smoothing } from './frame-clock';
import { createGlContext, GlCaps } from './gl/context';

export interface EngineStats {
  fps: number;
}

const STATS_INTERVAL_SECONDS = 0.25;

export class AttractorEngine {
  readonly caps: GlCaps;
  private readonly gl: WebGL2RenderingContext;
  private readonly clock = new FrameClock();
  private statsListener: ((stats: EngineStats) => void) | null = null;
  private frameSeconds = 1 / 60;
  private sinceStats = 0;

  constructor(canvas: HTMLCanvasElement) {
    const { gl, caps } = createGlContext(canvas);
    this.gl = gl;
    this.caps = caps;
  }

  start(): void {
    this.clock.start((dt, time) => this.frame(dt, time));
  }

  onStats(listener: (stats: EngineStats) => void): void {
    this.statsListener = listener;
  }

  dispose(): void {
    this.clock.stop();
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  private frame(dt: number, time: number): void {
    const gl = this.gl;
    const pulse = 0.5 + 0.5 * Math.sin(time * 2);
    gl.clearColor((12 + 10 * pulse) / 255, (16 + 14 * pulse) / 255, (15 + 14 * pulse) / 255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.reportStats(dt);
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
