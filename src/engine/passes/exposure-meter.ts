import { smoothing } from '../frame-clock';
import { Program } from '../gl/program';
import { Readback } from '../gl/readback';
import { Reducer } from '../gl/reducer';
import { RenderTarget } from '../gl/target';
import fullscreenVert from '../shaders/fullscreen.vert.glsl';
import luminanceMapFrag from '../shaders/luminance-map.frag.glsl';

export const METER_LEVEL = 3;
const MEASURE_EVERY = 4;
const BASE_EXPOSURE = 3.3;
const KEY = 0.112;
const ADAPTATION = 0.5;
const MIN_EV = 1;
const MAX_EV = 3;
const ADAPT_SECONDS = 2;

export class ExposureMeter {
  private readonly program: Program;
  private readonly reducer: Reducer;
  private readonly readback: Readback;
  private map: RenderTarget | null = null;
  private frames = 0;
  private logAverage: number | null = null;
  private exposure = BASE_EXPOSURE;

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.program = new Program(gl, { fullscreenVert }, { luminanceMapFrag });
    this.program.use();
    gl.uniform1i(this.program.location('uSource'), 0);
    this.reducer = new Reducer(gl);
    this.readback = new Readback(gl);
  }

  resize(width: number, height: number): void {
    this.map?.dispose();
    this.map = new RenderTarget(this.gl, width, height, 'rgba32f');
    this.reducer.resize(width, height);
  }

  measure(source: RenderTarget): void {
    if (!this.map || this.frames++ % MEASURE_EVERY !== 0) {
      return;
    }
    const gl = this.gl;
    this.map.bind();
    gl.disable(gl.BLEND);
    this.program.use();
    source.bindTexture(0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.readback.request(this.reducer.run(this.map));
  }

  update(dt: number): number {
    const sums = this.readback.poll();
    if (sums && sums[1] > 0) {
      this.logAverage = sums[0] / sums[1];
    }
    if (this.logAverage !== null) {
      this.exposure = this.adapt(this.logAverage, dt);
    }
    return this.exposure;
  }

  dispose(): void {
    this.program.dispose();
    this.reducer.dispose();
    this.readback.dispose();
    this.map?.dispose();
  }

  private adapt(logAverage: number, dt: number): number {
    const base = Math.log2(BASE_EXPOSURE);
    const full = Math.log2(KEY) - logAverage;
    const target = Math.min(MAX_EV, Math.max(MIN_EV, base + ADAPTATION * (full - base)));
    const current = Math.log2(this.exposure);
    return 2 ** (current + (target - current) * smoothing(dt, ADAPT_SECONDS));
  }
}
