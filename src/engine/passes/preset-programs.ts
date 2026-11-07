import { AttractorPreset } from '../attractors/attractor';
import { Program, ShaderChunks } from '../gl/program';
import common from '../shaders/common.glsl';
import fullscreenVert from '../shaders/fullscreen.vert.glsl';
import palette from '../shaders/palette.glsl';
import rk4 from '../shaders/rk4.glsl';
import simulateFrag from '../shaders/simulate.frag.glsl';
import splatFrag from '../shaders/splat.frag.glsl';
import splatVert from '../shaders/splat.vert.glsl';

export class PresetPrograms {
  private readonly simulatePrograms = new Map<string, Program>();
  private readonly splatPrograms = new Map<string, Program>();

  constructor(private readonly gl: WebGL2RenderingContext) {}

  simulate(preset: AttractorPreset): Program {
    let program = this.simulatePrograms.get(preset.id);
    if (!program) {
      program = new Program(
        this.gl,
        { fullscreenVert },
        { ...derivChunks(preset), common, rk4, simulateFrag },
      );
      this.simulatePrograms.set(preset.id, program);
    }
    return program;
  }

  splat(preset: AttractorPreset): Program {
    let program = this.splatPrograms.get(preset.id);
    if (!program) {
      program = new Program(this.gl, { ...derivChunks(preset), palette, splatVert }, { splatFrag });
      this.splatPrograms.set(preset.id, program);
    }
    return program;
  }

  dispose(): void {
    for (const programs of [this.simulatePrograms, this.splatPrograms]) {
      programs.forEach((program) => program.dispose());
      programs.clear();
    }
  }
}

function derivChunks(preset: AttractorPreset): ShaderChunks {
  return {
    parameters: preset.params
      .map(({ name, value }) => `#define ${name} (${floatLiteral(value)})`)
      .join('\n'),
    deriv: preset.deriv,
    cleanup: preset.params.map(({ name }) => `#undef ${name}`).join('\n'),
  };
}

function floatLiteral(value: number): string {
  return Number.isInteger(value) ? value.toFixed(1) : String(value);
}
