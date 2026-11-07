import { PingPong } from '../gl/ping-pong';
import { Program } from '../gl/program';
import fullscreenVert from '../shaders/fullscreen.vert.glsl';
import lorenz from '../shaders/lorenz.glsl';
import rk4 from '../shaders/rk4.glsl';
import simulateFrag from '../shaders/simulate.frag.glsl';

const MAX_STEPS_PER_FRAME = 64;

export class SimulatePass {
  private readonly program: Program;

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.program = new Program(gl, { fullscreenVert }, { lorenz, rk4, simulateFrag });
    this.program.use();
    gl.uniform1i(this.program.location('uState'), 0);
  }

  run(state: PingPong, simDelta: number, maxStep: number): void {
    const steps = Math.min(MAX_STEPS_PER_FRAME, Math.ceil(simDelta / maxStep));
    if (steps === 0) {
      return;
    }
    const gl = this.gl;
    state.write.bind();
    gl.disable(gl.BLEND);
    this.program.use();
    state.read.bindTexture(0);
    gl.uniform1i(this.program.location('uSteps'), steps);
    gl.uniform1f(this.program.location('uStep'), Math.min(maxStep, simDelta / steps));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    state.swap();
  }

  dispose(): void {
    this.program.dispose();
  }
}
