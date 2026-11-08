uniform sampler2D uState;
uniform mat4 uViewProjection;
uniform float uReferenceDepth;
uniform float uFocusDistance;
uniform float uBlurScale;
uniform float uMaxSigma;
uniform float uTypicalSpeed;
uniform bool uFtleColor;
uniform vec2 uFtleRange;
uniform float uGain;
uniform uint uFrame;

flat out vec3 vColor;
flat out float vSigma;
flat out float vPointSize;

const float SIGMA = 1.0;
const float PALETTE_SPAN = 1.7;
const vec4 CULLED = vec4(2.0, 2.0, 2.0, 1.0);

void main() {
  int width = textureSize(uState, 0).x;
  vec4 state = texelFetch(uState, ivec2(gl_VertexID % width, gl_VertexID / width), 0);
  vec3 position = state.xyz;
  gl_Position = uViewProjection * vec4(position, 1.0);
  float blur = uBlurScale * abs(1.0 / gl_Position.w - 1.0 / uFocusDistance);
  float sigma = min(sqrt(SIGMA * SIGMA + blur * blur), uMaxSigma);
  float keep = (SIGMA * SIGMA) / (sigma * sigma);
  if (random3(uvec3(uint(gl_VertexID), uFrame, 0u)).x >= keep) {
    gl_Position = CULLED;
    return;
  }
  float perspective = uReferenceDepth / gl_Position.w;
  float pointSize = 2.0 * ceil(3.0 * sigma) + 1.0;
  gl_PointSize = pointSize;
  vSigma = sigma;
  vPointSize = pointSize;
  float ftleSpan = state.w < 0.0 ? -uFtleRange.x : uFtleRange.y;
  vec3 color = uFtleColor
    ? divergingPalette(state.w / ftleSpan)
    : palette(length(deriv(position)) / (PALETTE_SPAN * uTypicalSpeed));
  vColor = color * uGain * perspective * perspective / keep;
}
