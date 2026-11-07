uniform sampler2D uState;
uniform vec3 uCenter;
uniform float uHalfExtent;
uniform float uYaw;
uniform vec2 uViewport;
uniform float uTypicalSpeed;
uniform float uGain;

flat out vec3 vColor;
flat out float vSigma;
flat out float vPointSize;

const float PITCH = 0.38;
const float CAMERA_DISTANCE = 3.4;
const float SCALE = 0.4;
const float SIGMA = 1.0;
const float PALETTE_SPAN = 1.7;

void main() {
  int width = textureSize(uState, 0).x;
  vec3 position = texelFetch(uState, ivec2(gl_VertexID % width, gl_VertexID / width), 0).xyz;
  vec3 local = (position - uCenter) / uHalfExtent;
  float x1 = local.x * cos(uYaw) + local.y * sin(uYaw);
  float z1 = local.y * cos(uYaw) - local.x * sin(uYaw);
  float y1 = local.z * cos(PITCH) - z1 * sin(PITCH);
  float z2 = local.z * sin(PITCH) + z1 * cos(PITCH);
  float perspective = CAMERA_DISTANCE / (CAMERA_DISTANCE + z2);
  float side = min(uViewport.x, uViewport.y);
  gl_Position = vec4(vec2(x1, y1) * perspective * 2.0 * SCALE * side / uViewport, 0.0, 1.0);
  float pointSize = 2.0 * ceil(3.0 * SIGMA) + 1.0;
  gl_PointSize = pointSize;
  vSigma = SIGMA;
  vPointSize = pointSize;
  float speed = length(deriv(position));
  vColor = palette(speed / (PALETTE_SPAN * uTypicalSpeed)) * uGain * perspective * perspective;
}
