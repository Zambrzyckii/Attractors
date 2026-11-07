import { PingPong } from '../gl/ping-pong';
import { Program } from '../gl/program';
import { RenderTarget } from '../gl/target';
import accumulateFrag from '../shaders/accumulate.frag.glsl';
import fullscreenVert from '../shaders/fullscreen.vert.glsl';

export class AccumulatePass {
  private readonly program: Program;

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.program = new Program(gl, { fullscreenVert }, { accumulateFrag });
    this.program.use();
    gl.uniform1i(this.program.location('uHistory'), 0);
    gl.uniform1i(this.program.location('uFrame'), 1);
  }

  run(history: PingPong, frame: RenderTarget, blend: number): void {
    const gl = this.gl;
    history.write.bind();
    gl.disable(gl.BLEND);
    this.program.use();
    history.read.bindTexture(0);
    frame.bindTexture(1);
    gl.uniform1f(this.program.location('uBlend'), blend);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    history.swap();
  }

  dispose(): void {
    this.program.dispose();
  }
}
