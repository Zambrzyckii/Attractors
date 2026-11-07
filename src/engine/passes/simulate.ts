import { AttractorPreset } from '../attractors/attractor';
import { PingPong } from '../gl/ping-pong';
import { PresetPrograms } from './preset-programs';

const MAX_STEPS_PER_DRAW = 64;

export class SimulatePass {
  private drawIndex = 0;

  constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly programs: PresetPrograms,
  ) {}

  run(state: PingPong, preset: AttractorPreset, simDelta: number): void {
    const steps = Math.min(MAX_STEPS_PER_DRAW, Math.ceil(simDelta / preset.maxStep));
    if (steps === 0) {
      return;
    }
    this.draw(state, preset, steps, Math.min(preset.maxStep, simDelta / steps));
  }

  runSteps(state: PingPong, preset: AttractorPreset, count: number): void {
    for (let done = 0; done < count; done += MAX_STEPS_PER_DRAW) {
      this.draw(state, preset, Math.min(MAX_STEPS_PER_DRAW, count - done), preset.maxStep);
    }
  }

  private draw(state: PingPong, preset: AttractorPreset, steps: number, step: number): void {
    const gl = this.gl;
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
    gl.uniform1ui(program.location('uDrawIndex'), this.drawIndex++);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    state.swap();
  }
}
