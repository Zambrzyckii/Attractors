uniform sampler2D uState;
uniform mat4 uViewProjection;
uniform float uReferenceDepth;
uniform float uTypicalSpeed;
uniform float uGain;

flat out vec3 vColor;
flat out float vSigma;
flat out float vPointSize;

const float SIGMA = 1.0;
const float PALETTE_SPAN = 1.7;

void main() {
  int width = textureSize(uState, 0).x;
  vec3 position = texelFetch(uState, ivec2(gl_VertexID % width, gl_VertexID / width), 0).xyz;
  gl_Position = uViewProjection * vec4(position, 1.0);
  float perspective = uReferenceDepth / gl_Position.w;
  float pointSize = 2.0 * ceil(3.0 * SIGMA) + 1.0;
  gl_PointSize = pointSize;
  vSigma = SIGMA;
  vPointSize = pointSize;
  float speed = length(deriv(position));
  vColor = palette(speed / (PALETTE_SPAN * uTypicalSpeed)) * uGain * perspective * perspective;
}
