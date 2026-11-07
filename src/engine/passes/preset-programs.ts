import { AttractorPreset } from '../attractors/attractor';
import { Program } from '../gl/program';
import common from '../shaders/common.glsl';
import fullscreenVert from '../shaders/fullscreen.vert.glsl';
import rk4 from '../shaders/rk4.glsl';
import simulateFrag from '../shaders/simulate.frag.glsl';

export class PresetPrograms {
  private readonly simulatePrograms = new Map<string, Program>();

  constructor(private readonly gl: WebGL2RenderingContext) {}

  simulate(preset: AttractorPreset): Program {
    let program = this.simulatePrograms.get(preset.id);
    if (!program) {
      program = new Program(
        this.gl,
        { fullscreenVert },
        {
          parameters: preset.params
            .map(({ name, value }) => `#define ${name} (${floatLiteral(value)})`)
            .join('\n'),
          deriv: preset.deriv,
          cleanup: preset.params.map(({ name }) => `#undef ${name}`).join('\n'),
          common,
          rk4,
          simulateFrag,
        },
      );
      this.simulatePrograms.set(preset.id, program);
    }
    return program;
  }

  dispose(): void {
    this.simulatePrograms.forEach((program) => program.dispose());
    this.simulatePrograms.clear();
  }
}

function floatLiteral(value: number): string {
  return Number.isInteger(value) ? value.toFixed(1) : String(value);
}
