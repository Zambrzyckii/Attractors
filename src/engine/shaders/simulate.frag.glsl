uniform sampler2D uState;
uniform int uSteps;
uniform float uStep;
uniform vec3 uCenter;
uniform float uHalfExtent;
uniform uint uDrawIndex;
uniform float uNoise;

out vec4 outState;

const float ESCAPE_LIMIT = 10.0;
const float JITTER = 1e-3;

void main() {
  vec4 state = texelFetch(uState, ivec2(gl_FragCoord.xy), 0);
  vec3 position = state.xyz;
  for (int i = 0; i < uSteps; i++) {
    position = rk4Step(position, uStep);
  }
  position += uNoise * (random3(uvec3(gl_FragCoord.xy, 3u * uDrawIndex + 2u)) - 0.5);
  if (!all(lessThan(abs(position - uCenter), vec3(ESCAPE_LIMIT * uHalfExtent)))) {
    vec3 pick = random3(uvec3(gl_FragCoord.xy, 3u * uDrawIndex));
    state = texelFetch(uState, ivec2(pick.xy * vec2(textureSize(uState, 0))), 0);
    vec3 jitter = random3(uvec3(gl_FragCoord.xy, 3u * uDrawIndex + 1u)) - 0.5;
    position = state.xyz + jitter * JITTER * uHalfExtent;
  }
  outState = vec4(position, state.w);
}
