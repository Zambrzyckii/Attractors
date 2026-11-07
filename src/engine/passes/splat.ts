import { Program } from '../gl/program';
import { RenderTarget } from '../gl/target';
import splatFrag from '../shaders/splat.frag.glsl';
import splatVert from '../shaders/splat.vert.glsl';

export interface SplatView {
  center: [number, number, number];
  halfExtent: number;
  yaw: number;
  width: number;
  height: number;
}

const BACKGROUND: [number, number, number] = [12 / 255, 16 / 255, 15 / 255];
const POINT_COLOR: [number, number, number] = [3 / 255, 5 / 255, 5 / 255];

export class SplatPass {
  private readonly program: Program;

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.program = new Program(gl, { splatVert }, { splatFrag });
    this.program.use();
    gl.uniform1i(this.program.location('uState'), 0);
    gl.uniform3f(this.program.location('uColor'), ...POINT_COLOR);
  }

  run(state: RenderTarget, view: SplatView): void {
    const gl = this.gl;
    const program = this.program;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, view.width, view.height);
    gl.clearColor(...BACKGROUND, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    program.use();
    state.bindTexture(0);
    gl.uniform3f(program.location('uCenter'), ...view.center);
    gl.uniform1f(program.location('uHalfExtent'), view.halfExtent);
    gl.uniform1f(program.location('uYaw'), view.yaw);
    gl.uniform2f(program.location('uViewport'), view.width, view.height);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.drawArrays(gl.POINTS, 0, state.width * state.height);
  }

  dispose(): void {
    this.program.dispose();
  }
}
