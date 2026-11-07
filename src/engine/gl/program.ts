const HEADER = [
  '#version 300 es',
  'precision highp float;',
  'precision highp int;',
  'precision highp sampler2D;',
];

export type ShaderChunks = Record<string, string>;

interface Stage {
  lines: string[];
  origins: string[];
}

export class Program {
  private readonly handle: WebGLProgram;
  private readonly locations = new Map<string, WebGLUniformLocation | null>();

  constructor(
    private readonly gl: WebGL2RenderingContext,
    vertex: ShaderChunks,
    fragment: ShaderChunks,
  ) {
    const stages = [assemble(vertex), assemble(fragment)];
    const shaders = [
      compile(gl, gl.VERTEX_SHADER, stages[0]),
      compile(gl, gl.FRAGMENT_SHADER, stages[1]),
    ];
    this.handle = gl.createProgram();
    shaders.forEach((shader) => gl.attachShader(this.handle, shader));
    gl.linkProgram(this.handle);
    const linked: boolean = gl.getProgramParameter(this.handle, gl.LINK_STATUS);
    const failure = linked ? '' : describeFailure(gl, this.handle, shaders, stages);
    shaders.forEach((shader) => gl.deleteShader(shader));
    if (!linked) {
      gl.deleteProgram(this.handle);
      throw new Error(failure);
    }
  }

  use(): void {
    this.gl.useProgram(this.handle);
  }

  location(name: string): WebGLUniformLocation | null {
    let location = this.locations.get(name);
    if (location === undefined) {
      location = this.gl.getUniformLocation(this.handle, name);
      this.locations.set(name, location);
    }
    return location;
  }

  dispose(): void {
    this.gl.deleteProgram(this.handle);
  }
}

function assemble(chunks: ShaderChunks): Stage {
  const stage: Stage = { lines: [...HEADER], origins: HEADER.map(() => 'header') };
  for (const [name, text] of Object.entries(chunks)) {
    text.split('\n').forEach((line, index) => {
      stage.lines.push(line);
      stage.origins.push(`${name}:${index + 1}`);
    });
  }
  return stage;
}

function compile(gl: WebGL2RenderingContext, type: GLenum, stage: Stage): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Could not create a shader because the WebGL context is lost.');
  }
  gl.shaderSource(shader, stage.lines.join('\n'));
  gl.compileShader(shader);
  return shader;
}

function describeFailure(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  shaders: WebGLShader[],
  stages: Stage[],
): string {
  const compileErrors = shaders
    .map((shader, index) =>
      gl.getShaderParameter(shader, gl.COMPILE_STATUS)
        ? ''
        : annotate(gl.getShaderInfoLog(shader), stages[index]),
    )
    .filter(Boolean);
  const details =
    compileErrors.length > 0 ? compileErrors : [gl.getProgramInfoLog(program)?.trim()];
  return ['Shader program failed to link.', ...details].filter(Boolean).join('\n');
}

function annotate(log: string | null, stage: Stage): string {
  const output: string[] = [];
  let quoted = -1;
  for (const entry of (log ?? '').trim().split('\n')) {
    output.push(entry);
    const index = Number(/^ERROR: \d+:(\d+):/.exec(entry)?.[1]) - 1;
    const code: string | undefined = stage.lines[index];
    if (code !== undefined && index !== quoted) {
      output.push(`  ${stage.origins[index]} | ${code.trim()}`);
      quoted = index;
    }
  }
  return output.join('\n');
}
