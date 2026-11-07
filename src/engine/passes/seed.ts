import { Program } from '../gl/program';
import { RenderTarget } from '../gl/target';
import common from '../shaders/common.glsl';
import fullscreenVert from '../shaders/fullscreen.vert.glsl';
import seedFrag from '../shaders/seed.frag.glsl';

export class SeedPass {
  private readonly program: Program;

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.program = new Program(gl, { fullscreenVert }, { common, seedFrag });
  }

  run(target: RenderTarget, center: [number, number, number], halfSize: number): void {
    const gl = this.gl;
    target.bind();
    gl.disable(gl.BLEND);
    this.program.use();
    gl.uniform3f(this.program.location('uCenter'), ...center);
    gl.uniform1f(this.program.location('uHalfSize'), halfSize);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose(): void {
    this.program.dispose();
  }
}
