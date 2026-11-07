import fullscreenVert from '../shaders/fullscreen.vert.glsl';
import reduceFrag from '../shaders/reduce.frag.glsl';
import { Program } from './program';
import { RenderTarget } from './target';

const BLOCK = 4;

export class Reducer {
  private readonly program: Program;
  private levels: RenderTarget[] = [];

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.program = new Program(
      gl,
      { fullscreenVert },
      { block: `const int BLOCK = ${BLOCK};`, reduceFrag },
    );
    this.program.use();
    gl.uniform1i(this.program.location('uSource'), 0);
  }

  resize(width: number, height: number): void {
    this.disposeLevels();
    while (width > 1 || height > 1) {
      width = Math.ceil(width / BLOCK);
      height = Math.ceil(height / BLOCK);
      this.levels.push(new RenderTarget(this.gl, width, height, 'rgba32f'));
    }
  }

  run(source: RenderTarget): RenderTarget {
    const gl = this.gl;
    gl.disable(gl.BLEND);
    this.program.use();
    let input = source;
    for (const level of this.levels) {
      level.bind();
      input.bindTexture(0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      input = level;
    }
    return input;
  }

  dispose(): void {
    this.program.dispose();
    this.disposeLevels();
  }

  private disposeLevels(): void {
    this.levels.forEach((level) => level.dispose());
    this.levels = [];
  }
}
