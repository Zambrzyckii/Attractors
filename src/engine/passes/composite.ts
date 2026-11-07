import { Program } from '../gl/program';
import { RenderTarget } from '../gl/target';
import compositeFrag from '../shaders/composite.frag.glsl';
import fullscreenVert from '../shaders/fullscreen.vert.glsl';
import { BLOOM_LEVELS } from './bloom';

const BACKGROUND: [number, number, number] = [12 / 255, 16 / 255, 15 / 255];
const BLOOM_STRENGTH = 0.08;

export class CompositePass {
  private readonly program: Program;

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.program = new Program(gl, { fullscreenVert }, { compositeFrag });
    this.program.use();
    gl.uniform1i(this.program.location('uHdr'), 0);
    gl.uniform1i(this.program.location('uBloom'), 1);
    gl.uniform3f(this.program.location('uBackground'), ...BACKGROUND);
    gl.uniform1f(this.program.location('uBloomStrength'), BLOOM_STRENGTH);
    gl.uniform1f(this.program.location('uBloomLevels'), BLOOM_LEVELS);
  }

  run(hdr: RenderTarget, bloom: RenderTarget, exposure: number): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, hdr.width, hdr.height);
    gl.disable(gl.BLEND);
    this.program.use();
    gl.uniform1f(this.program.location('uExposure'), exposure);
    hdr.bindTexture(0);
    bloom.bindTexture(1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose(): void {
    this.program.dispose();
  }
}
