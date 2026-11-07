import { AttractorPreset } from '../attractors/attractor';
import { PingPong } from '../gl/ping-pong';
import { PresetPrograms } from './preset-programs';

const MAX_STEPS_PER_FRAME = 64;

export class SimulatePass {
  constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly programs: PresetPrograms,
  ) {}

  run(state: PingPong, preset: AttractorPreset, simDelta: number): void {
    const steps = Math.min(MAX_STEPS_PER_FRAME, Math.ceil(simDelta / preset.maxStep));
    if (steps === 0) {
      return;
    }
    const gl = this.gl;
    const program = this.programs.simulate(preset);
    state.write.bind();
    gl.disable(gl.BLEND);
    program.use();
    state.read.bindTexture(0);
    gl.uniform1i(program.location('uState'), 0);
    gl.uniform1i(program.location('uSteps'), steps);
    gl.uniform1f(program.location('uStep'), Math.min(preset.maxStep, simDelta / steps));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    state.swap();
  }
}
