export interface GlCaps {
  renderer: string;
  version: string;
  maxTextureSize: number;
  maxDrawBuffers: number;
  pointSizeRange: [number, number];
  extensions: Record<string, boolean>;
}

const CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
  alpha: false,
  antialias: false,
  depth: false,
  stencil: false,
  premultipliedAlpha: false,
  preserveDrawingBuffer: false,
  powerPreference: 'high-performance',
};

const REQUIRED_EXTENSIONS = ['EXT_color_buffer_float'];
const OPTIONAL_EXTENSIONS = [
  'EXT_float_blend',
  'OES_texture_float_linear',
  'EXT_disjoint_timer_query_webgl2',
  'KHR_parallel_shader_compile',
];

export function createGlContext(canvas: HTMLCanvasElement): {
  gl: WebGL2RenderingContext;
  caps: GlCaps;
} {
  const gl = canvas.getContext('webgl2', CONTEXT_ATTRIBUTES);
  if (!gl) {
    throw new Error('WebGL2 is not available in this browser.');
  }
  const extensions: Record<string, boolean> = {};
  for (const name of [...REQUIRED_EXTENSIONS, ...OPTIONAL_EXTENSIONS]) {
    extensions[name] = gl.getExtension(name) !== null;
  }
  const missing = REQUIRED_EXTENSIONS.filter((name) => !extensions[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required WebGL2 extension: ${missing.join(', ')}.`);
  }
  const pointSizes = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array;
  return {
    gl,
    caps: {
      renderer: rendererName(gl),
      version: gl.getParameter(gl.VERSION),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxDrawBuffers: gl.getParameter(gl.MAX_DRAW_BUFFERS),
      pointSizeRange: [pointSizes[0], pointSizes[1]],
      extensions,
    },
  };
}

function rendererName(gl: WebGL2RenderingContext): string {
  const name: string = gl.getParameter(gl.RENDERER);
  if (name !== 'WebKit WebGL') {
    return name;
  }
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  return debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : name;
}
