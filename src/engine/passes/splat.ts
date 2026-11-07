import { AttractorPreset } from '../attractors/attractor';
import { Program } from '../gl/program';
import { RenderTarget } from '../gl/target';
import { Mat4 } from '../math/mat4';
import copyFrag from '../shaders/copy.frag.glsl';
import fullscreenVert from '../shaders/fullscreen.vert.glsl';
import { PresetPrograms } from './preset-programs';

export interface SplatView {
  viewProjection: Mat4;
  referenceDepth: number;
  focusDistance: number;
  blurScale: number;
}

const PARTICLE_GAIN = 0.031;
const REFERENCE_SIDE = 1080;
const REFERENCE_PARTICLES = 1024 * 1024;
const BATCH_PARTICLES = 1024 * 1024;
const SHARP_SIGMA = 1;
const MAX_SIGMA = 4;

export class SplatPass {
  private readonly copy: Program;
  private frame: RenderTarget;
  private sum: RenderTarget | null;
  private written: RenderTarget;
  private readonly maxSigma: number;
  private frames = 0;

  constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly programs: PresetPrograms,
    private readonly floatBlend: boolean,
    maxPointSize: number,
    width: number,
    height: number,
  ) {
    const fittingSigma = Math.floor((maxPointSize - 1) / 6);
    this.maxSigma = Math.max(SHARP_SIGMA, Math.min(MAX_SIGMA, fittingSigma));
    this.copy = new Program(gl, { fullscreenVert }, { copyFrag });
    this.copy.use();
    gl.uniform1i(this.copy.location('uSource'), 0);
    [this.frame, this.sum] = this.createTargets(width, height);
    this.written = this.frame;
  }

  get output(): RenderTarget {
    return this.written;
  }

  resize(width: number, height: number): void {
    this.disposeTargets();
    [this.frame, this.sum] = this.createTargets(width, height);
    this.written = this.frame;
  }

  run(state: RenderTarget, preset: AttractorPreset, view: SplatView): void {
    const gl = this.gl;
    const program = this.programs.splat(preset);
    const count = state.width * state.height;
    program.use();
    gl.uniform1i(program.location('uState'), 0);
    gl.uniform1f(program.location('uTypicalSpeed'), preset.typicalSpeed);
    const screenScale = (Math.min(this.frame.width, this.frame.height) / REFERENCE_SIDE) ** 2;
    const particleScale = REFERENCE_PARTICLES / count;
    gl.uniform1f(program.location('uGain'), PARTICLE_GAIN * screenScale * particleScale);
    gl.uniformMatrix4fv(program.location('uViewProjection'), false, view.viewProjection);
    gl.uniform1f(program.location('uReferenceDepth'), view.referenceDepth);
    gl.uniform1f(program.location('uFocusDistance'), view.focusDistance);
    gl.uniform1f(program.location('uBlurScale'), view.blurScale);
    gl.uniform1f(program.location('uMaxSigma'), this.maxSigma);
    gl.uniform1ui(program.location('uFrame'), this.frames++);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    if (!this.sum || count <= BATCH_PARTICLES) {
      this.drawPoints(program, state, 0, count);
      this.written = this.frame;
      return;
    }
    this.sum.clear([0, 0, 0, 0]);
    for (let first = 0; first < count; first += BATCH_PARTICLES) {
      this.drawPoints(program, state, first, Math.min(BATCH_PARTICLES, count - first));
      this.sum.bind();
      this.copy.use();
      this.frame.bindTexture(0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    this.written = this.sum;
  }

  dispose(): void {
    this.copy.dispose();
    this.disposeTargets();
  }

  private drawPoints(program: Program, state: RenderTarget, first: number, count: number): void {
    this.frame.clear([0, 0, 0, 0]);
    program.use();
    state.bindTexture(0);
    this.gl.drawArrays(this.gl.POINTS, first, count);
  }

  private createTargets(width: number, height: number): [RenderTarget, RenderTarget | null] {
    const frame = new RenderTarget(this.gl, width, height, 'rgba16f');
    const sum = this.floatBlend ? new RenderTarget(this.gl, width, height, 'rgba32f') : null;
    return [frame, sum];
  }

  private disposeTargets(): void {
    this.frame.dispose();
    this.sum?.dispose();
  }
}
