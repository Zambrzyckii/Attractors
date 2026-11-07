import { AttractorPreset } from '../attractors/attractor';
import { RenderTarget } from '../gl/target';
import { Mat4 } from '../math/mat4';
import { PresetPrograms } from './preset-programs';

export interface SplatView {
  viewProjection: Mat4;
  referenceDepth: number;
}

const PARTICLE_GAIN = 0.031;
const REFERENCE_SIDE = 1080;
const REFERENCE_PARTICLES = 1024 * 1024;

export class SplatPass {
  constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly programs: PresetPrograms,
  ) {}

  run(target: RenderTarget, state: RenderTarget, preset: AttractorPreset, view: SplatView): void {
    const gl = this.gl;
    const program = this.programs.splat(preset);
    target.clear([0, 0, 0, 0]);
    program.use();
    state.bindTexture(0);
    gl.uniform1i(program.location('uState'), 0);
    gl.uniform1f(program.location('uTypicalSpeed'), preset.typicalSpeed);
    const screenScale = (Math.min(target.width, target.height) / REFERENCE_SIDE) ** 2;
    const particleScale = REFERENCE_PARTICLES / (state.width * state.height);
    gl.uniform1f(program.location('uGain'), PARTICLE_GAIN * screenScale * particleScale);
    gl.uniformMatrix4fv(program.location('uViewProjection'), false, view.viewProjection);
    gl.uniform1f(program.location('uReferenceDepth'), view.referenceDepth);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.drawArrays(gl.POINTS, 0, state.width * state.height);
  }
}
