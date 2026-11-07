import { LiveAttractor } from '../attractors/live-attractor';
import { PingPong } from '../gl/ping-pong';
import { PresetPrograms } from './preset-programs';

const MAX_STEPS_PER_DRAW = 64;
const NOISE_FLOOR = 1e-4;

export class SimulatePass {
  private drawIndex = 0;

  constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly programs: PresetPrograms,
  ) {}

  run(state: PingPong, attractor: LiveAttractor, simDelta: number): void {
    const { maxStep } = attractor.preset;
    const steps = Math.min(MAX_STEPS_PER_DRAW, Math.ceil(simDelta / maxStep));
    if (steps === 0) {
      return;
    }
    this.draw(state, attractor, steps, Math.min(maxStep, simDelta / steps));
  }

  runSteps(state: PingPong, attractor: LiveAttractor, count: number): void {
    for (let done = 0; done < count; done += MAX_STEPS_PER_DRAW) {
      const steps = Math.min(MAX_STEPS_PER_DRAW, count - done);
      this.draw(state, attractor, steps, attractor.preset.maxStep);
    }
  }

  private draw(state: PingPong, attractor: LiveAttractor, steps: number, step: number): void {
    const gl = this.gl;
    const preset = attractor.preset;
    const program = this.programs.simulate(preset);
    state.write.bind();
    gl.disable(gl.BLEND);
    program.use();
    state.read.bindTexture(0);
    gl.uniform1i(program.location('uState'), 0);
    gl.uniform1i(program.location('uSteps'), steps);
    gl.uniform1f(program.location('uStep'), step);
    gl.uniform3f(program.location('uCenter'), ...preset.center);
    gl.uniform1f(program.location('uHalfExtent'), preset.halfExtent);
    gl.uniform4fv(program.location('uParams'), attractor.params);
    const noise = NOISE_FLOOR * preset.halfExtent * Math.sqrt(12 * steps * step);
    gl.uniform1f(program.location('uNoise'), noise);
    gl.uniform1ui(program.location('uDrawIndex'), this.drawIndex++);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    state.swap();
  }
}
