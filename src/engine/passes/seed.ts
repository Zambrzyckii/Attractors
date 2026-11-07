import { AttractorPreset } from '../attractors/attractor';
import { Program } from '../gl/program';
import { RenderTarget } from '../gl/target';
import common from '../shaders/common.glsl';
import fullscreenVert from '../shaders/fullscreen.vert.glsl';
import seedFrag from '../shaders/seed.frag.glsl';

export class SeedPass {
  private readonly program: Program;

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.program = new Program(gl, { fullscreenVert }, { common, seedFrag });
    this.program.use();
    gl.uniform1i(this.program.location('uAnchor'), 0);
  }

  run(target: RenderTarget, anchor: RenderTarget, preset: AttractorPreset): void {
    const gl = this.gl;
    target.bind();
    gl.disable(gl.BLEND);
    this.program.use();
    anchor.bindTexture(0);
    gl.uniform1f(this.program.location('uSpread'), preset.spread);
    gl.uniform1i(this.program.location('uAroundZ'), preset.seedAroundZ ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose(): void {
    this.program.dispose();
  }
}
