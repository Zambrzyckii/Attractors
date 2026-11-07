import { Program } from '../gl/program';
import { RenderTarget } from '../gl/target';
import compositeFrag from '../shaders/composite.frag.glsl';
import fullscreenVert from '../shaders/fullscreen.vert.glsl';

const BACKGROUND: [number, number, number] = [12 / 255, 16 / 255, 15 / 255];
const EXPOSURE = 16.7;

export class CompositePass {
  private readonly program: Program;

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.program = new Program(gl, { fullscreenVert }, { compositeFrag });
    this.program.use();
    gl.uniform1i(this.program.location('uHdr'), 0);
    gl.uniform3f(this.program.location('uBackground'), ...BACKGROUND);
    gl.uniform1f(this.program.location('uExposure'), EXPOSURE);
  }

  run(hdr: RenderTarget): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, hdr.width, hdr.height);
    gl.disable(gl.BLEND);
    this.program.use();
    hdr.bindTexture(0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose(): void {
    this.program.dispose();
  }
}
