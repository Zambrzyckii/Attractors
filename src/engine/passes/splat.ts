import { AttractorPreset } from '../attractors/attractor';
import { RenderTarget } from '../gl/target';
import { PresetPrograms } from './preset-programs';

export interface SplatView {
  center: [number, number, number];
  halfExtent: number;
  yaw: number;
}

const PARTICLE_GAIN = 0.031;

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
    gl.uniform1f(program.location('uGain'), PARTICLE_GAIN);
    gl.uniform3f(program.location('uCenter'), ...view.center);
    gl.uniform1f(program.location('uHalfExtent'), view.halfExtent);
    gl.uniform1f(program.location('uYaw'), view.yaw);
    gl.uniform2f(program.location('uViewport'), target.width, target.height);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.drawArrays(gl.POINTS, 0, state.width * state.height);
  }
}
