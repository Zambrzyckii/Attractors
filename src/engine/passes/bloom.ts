import { Program } from '../gl/program';
import { RenderTarget } from '../gl/target';
import bloomDownFrag from '../shaders/bloom-down.frag.glsl';
import bloomUpFrag from '../shaders/bloom-up.frag.glsl';
import fullscreenVert from '../shaders/fullscreen.vert.glsl';

export const BLOOM_LEVELS = 6;

export class BloomPass {
  private readonly down: Program;
  private readonly up: Program;
  private levels: RenderTarget[] = [];

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.down = new Program(gl, { fullscreenVert }, { bloomDownFrag });
    this.up = new Program(gl, { fullscreenVert }, { bloomUpFrag });
    for (const program of [this.down, this.up]) {
      program.use();
      gl.uniform1i(program.location('uSource'), 0);
    }
  }

  get output(): RenderTarget {
    return this.levels[0];
  }

  level(index: number): RenderTarget {
    return this.levels[index];
  }

  resize(width: number, height: number): void {
    this.disposeLevels();
    for (let index = 0; index < BLOOM_LEVELS; index++) {
      width = Math.ceil(width / 2);
      height = Math.ceil(height / 2);
      this.levels.push(new RenderTarget(this.gl, width, height, 'rgba16f'));
    }
  }

  downsample(source: RenderTarget, exposure: number): void {
    const gl = this.gl;
    gl.disable(gl.BLEND);
    this.down.use();
    gl.uniform1f(this.down.location('uExposure'), exposure);
    let input = source;
    this.levels.forEach((level, index) => {
      level.bind();
      input.bindTexture(0);
      gl.uniform1i(this.down.location('uKarisAverage'), index === 0 ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      input = level;
    });
  }

  upsample(): void {
    const gl = this.gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    this.up.use();
    for (let index = BLOOM_LEVELS - 2; index >= 0; index--) {
      const target = this.levels[index];
      target.bind();
      this.levels[index + 1].bindTexture(0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }

  dispose(): void {
    this.down.dispose();
    this.up.dispose();
    this.disposeLevels();
  }

  private disposeLevels(): void {
    this.levels.forEach((level) => level.dispose());
    this.levels = [];
  }
}
