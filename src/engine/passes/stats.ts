import { LiveAttractor } from '../attractors/live-attractor';
import { Program } from '../gl/program';
import { Readback } from '../gl/readback';
import { Reducer } from '../gl/reducer';
import { RenderTarget } from '../gl/target';
import { Vec3 } from '../math/vec3';
import fullscreenVert from '../shaders/fullscreen.vert.glsl';
import statsMapFrag from '../shaders/stats-map.frag.glsl';
import { PresetPrograms } from './preset-programs';

export interface ParticleStats {
  centroid: Vec3;
  rmsRadius: number;
  meanSpeed: number;
}

const MEASURE_EVERY = 4;

export class StatsPass {
  private readonly program: Program;
  private readonly reducer: Reducer;
  private shapeReadback: Readback;
  private speedReadback: Readback;
  private map: RenderTarget | null = null;
  private origin: Vec3 = [0, 0, 0];
  private shape: Omit<ParticleStats, 'meanSpeed'> | null = null;
  private meanSpeed: number | null = null;
  private frames = 0;

  constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly programs: PresetPrograms,
  ) {
    this.program = new Program(gl, { fullscreenVert }, { statsMapFrag });
    this.program.use();
    gl.uniform1i(this.program.location('uState'), 0);
    this.reducer = new Reducer(gl);
    this.shapeReadback = new Readback(gl);
    this.speedReadback = new Readback(gl);
  }

  measure(state: RenderTarget, attractor: LiveAttractor): void {
    const frame = this.frames++;
    if (frame % MEASURE_EVERY !== 0) {
      return;
    }
    if (this.map?.width !== state.width || this.map.height !== state.height) {
      this.map?.dispose();
      this.map = new RenderTarget(this.gl, state.width, state.height, 'rgba32f');
      this.reducer.resize(state.width, state.height);
    }
    const gl = this.gl;
    const speed = (frame / MEASURE_EVERY) % 2 === 1;
    const program = speed ? this.programs.speedMap(attractor.preset) : this.program;
    this.map.bind();
    gl.disable(gl.BLEND);
    program.use();
    if (speed) {
      gl.uniform1i(program.location('uState'), 0);
      gl.uniform4fv(program.location('uParams'), attractor.params);
    } else {
      this.origin = attractor.preset.center;
      gl.uniform3f(program.location('uOrigin'), ...this.origin);
    }
    gl.uniform1f(program.location('uWeight'), 1 / (state.width * state.height));
    state.bindTexture(0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    (speed ? this.speedReadback : this.shapeReadback).request(this.reducer.run(this.map));
  }

  poll(): ParticleStats | null {
    const shape = this.shapeReadback.poll();
    if (shape) {
      const [x, y, z, square] = shape;
      this.shape = {
        centroid: [this.origin[0] + x, this.origin[1] + y, this.origin[2] + z],
        rmsRadius: Math.sqrt(Math.max(0, square - x * x - y * y - z * z)),
      };
    }
    const speed = this.speedReadback.poll();
    if (speed) {
      this.meanSpeed = speed[0];
    }
    if ((!shape && !speed) || !this.shape || this.meanSpeed === null) {
      return null;
    }
    return { ...this.shape, meanSpeed: this.meanSpeed };
  }

  invalidate(): void {
    this.shapeReadback.dispose();
    this.speedReadback.dispose();
    this.shapeReadback = new Readback(this.gl);
    this.speedReadback = new Readback(this.gl);
    this.shape = null;
    this.meanSpeed = null;
  }

  dispose(): void {
    this.program.dispose();
    this.reducer.dispose();
    this.shapeReadback.dispose();
    this.speedReadback.dispose();
    this.map?.dispose();
  }
}
