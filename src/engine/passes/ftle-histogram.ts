import { Program } from '../gl/program';
import { Readback } from '../gl/readback';
import { RenderTarget } from '../gl/target';
import ftleHistogramFrag from '../shaders/ftle-histogram.frag.glsl';
import fullscreenVert from '../shaders/fullscreen.vert.glsl';

export const FTLE_BINS = 48;
const TEXELS = FTLE_BINS / 4;
const SAMPLES = 64;

export interface FtleHistogram {
  range: [number, number];
  counts: number[];
  mean: number;
}

export class FtleHistogramPass {
  private readonly program: Program;
  private readonly target: RenderTarget;
  private readback: Readback;

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.program = new Program(gl, { fullscreenVert }, { ftleHistogramFrag });
    this.program.use();
    gl.uniform1i(this.program.location('uState'), 0);
    this.target = new RenderTarget(gl, TEXELS, 1, 'rgba32f');
    this.readback = new Readback(gl, TEXELS);
  }

  measure(state: RenderTarget, range: [number, number]): void {
    const gl = this.gl;
    this.target.bind();
    gl.disable(gl.BLEND);
    this.program.use();
    gl.uniform2f(this.program.location('uRange'), ...range);
    gl.uniform2i(
      this.program.location('uStride'),
      Math.max(1, Math.floor(state.width / SAMPLES)),
      Math.max(1, Math.floor(state.height / SAMPLES)),
    );
    state.bindTexture(0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.readback.request(this.target);
  }

  poll(): number[] | null {
    const result = this.readback.poll();
    return result ? Array.from(result) : null;
  }

  invalidate(): void {
    this.readback.dispose();
    this.readback = new Readback(this.gl, TEXELS);
  }

  dispose(): void {
    this.program.dispose();
    this.target.dispose();
    this.readback.dispose();
  }
}
