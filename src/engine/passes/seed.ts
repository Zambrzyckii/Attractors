import { AttractorPreset } from '../attractors/attractor';
import { Program } from '../gl/program';
import { RenderTarget } from '../gl/target';
import common from '../shaders/common.glsl';
import fullscreenVert from '../shaders/fullscreen.vert.glsl';
import seedFrag from '../shaders/seed.frag.glsl';

const RESAMPLE_JITTER = 1e-3;

export class SeedPass {
  private readonly program: Program;

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.program = new Program(gl, { fullscreenVert }, { common, seedFrag });
    this.program.use();
    gl.uniform1i(this.program.location('uSource'), 0);
  }

  run(target: RenderTarget, anchor: RenderTarget, preset: AttractorPreset): void {
    this.draw(target, anchor, preset.spread, preset.seedAroundZ ?? false);
  }

  resample(target: RenderTarget, source: RenderTarget, preset: AttractorPreset): void {
    this.draw(target, source, RESAMPLE_JITTER * preset.halfExtent, false);
  }

  dispose(): void {
    this.program.dispose();
  }

  private draw(target: RenderTarget, source: RenderTarget, spread: number, aroundZ: boolean): void {
    const gl = this.gl;
    target.bind();
    gl.disable(gl.BLEND);
    this.program.use();
    source.bindTexture(0);
    gl.uniform1f(this.program.location('uSpread'), spread);
    gl.uniform1i(this.program.location('uAroundZ'), aroundZ ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
