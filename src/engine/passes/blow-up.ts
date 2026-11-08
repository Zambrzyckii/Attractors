import { AttractorPreset } from '../attractors/attractor';
import { PingPong } from '../gl/ping-pong';
import { Program } from '../gl/program';
import blowUpFrag from '../shaders/blow-up.frag.glsl';
import common from '../shaders/common.glsl';
import fullscreenVert from '../shaders/fullscreen.vert.glsl';

const DISTANCE_IN_HALF_EXTENTS = 100;

export class BlowUpPass {
  private readonly program: Program;
  private presses = 0;

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.program = new Program(gl, { fullscreenVert }, { common, blowUpFrag });
    this.program.use();
    gl.uniform1i(this.program.location('uState'), 0);
    gl.uniform1i(this.program.location('uShadow'), 1);
  }

  run(state: PingPong, preset: AttractorPreset): void {
    const gl = this.gl;
    state.write.bind();
    gl.disable(gl.BLEND);
    this.program.use();
    state.read.bindTexture(0);
    state.read.bindTexture(1, 1);
    gl.uniform3f(this.program.location('uCenter'), ...preset.center);
    gl.uniform1f(this.program.location('uDistance'), DISTANCE_IN_HALF_EXTENTS * preset.halfExtent);
    gl.uniform1ui(this.program.location('uPress'), this.presses++);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    state.swap();
  }

  dispose(): void {
    this.program.dispose();
  }
}
