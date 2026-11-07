import { Program } from '../gl/program';
import { Readback } from '../gl/readback';
import { Reducer } from '../gl/reducer';
import { RenderTarget } from '../gl/target';
import { Vec3 } from '../math/vec3';
import fullscreenVert from '../shaders/fullscreen.vert.glsl';
import statsMapFrag from '../shaders/stats-map.frag.glsl';

export interface ParticleStats {
  centroid: Vec3;
  rmsRadius: number;
}

const MEASURE_EVERY = 4;

export class StatsPass {
  private readonly program: Program;
  private readonly reducer: Reducer;
  private readback: Readback;
  private map: RenderTarget | null = null;
  private origin: Vec3 = [0, 0, 0];
  private frames = 0;

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.program = new Program(gl, { fullscreenVert }, { statsMapFrag });
    this.program.use();
    gl.uniform1i(this.program.location('uState'), 0);
    this.reducer = new Reducer(gl);
    this.readback = new Readback(gl);
  }

  measure(state: RenderTarget, origin: Vec3): void {
    if (this.frames++ % MEASURE_EVERY !== 0) {
      return;
    }
    if (this.map?.width !== state.width || this.map.height !== state.height) {
      this.map?.dispose();
      this.map = new RenderTarget(this.gl, state.width, state.height, 'rgba32f');
      this.reducer.resize(state.width, state.height);
    }
    const gl = this.gl;
    this.origin = origin;
    this.map.bind();
    gl.disable(gl.BLEND);
    this.program.use();
    gl.uniform3f(this.program.location('uOrigin'), ...origin);
    gl.uniform1f(this.program.location('uWeight'), 1 / (state.width * state.height));
    state.bindTexture(0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.readback.request(this.reducer.run(this.map));
  }

  poll(): ParticleStats | null {
    const means = this.readback.poll();
    if (!means) {
      return null;
    }
    const [x, y, z, square] = means;
    return {
      centroid: [this.origin[0] + x, this.origin[1] + y, this.origin[2] + z],
      rmsRadius: Math.sqrt(Math.max(0, square - x * x - y * y - z * z)),
    };
  }

  invalidate(): void {
    this.readback.dispose();
    this.readback = new Readback(this.gl);
  }

  dispose(): void {
    this.program.dispose();
    this.reducer.dispose();
    this.readback.dispose();
    this.map?.dispose();
  }
}
