uniform sampler2D uState;
uniform sampler2D uShadow;
uniform int uSteps;
uniform float uStep;
uniform vec3 uCenter;
uniform float uHalfExtent;
uniform uint uDrawIndex;
uniform float uNoise;
uniform float uShadowDistance;
uniform float uFtleBlend;

layout(location = 0) out vec4 outState;
layout(location = 1) out vec4 outShadow;

const float ESCAPE_LIMIT = 10.0;
const float JITTER = 1e-3;

void main() {
  vec4 state = texelFetch(uState, ivec2(gl_FragCoord.xy), 0);
  vec3 position = state.xyz;
  vec3 offset = texelFetch(uShadow, ivec2(gl_FragCoord.xy), 0).xyz;
  for (int i = 0; i < uSteps; i++) {
    vec3 next = rk4Step(position, uStep);
    offset = rk4Step(position + offset, uStep) - next;
    position = next;
  }
  float growth = length(offset) / uShadowDistance;
  float rate = log(growth) / (float(uSteps) * uStep);
  offset /= growth;
  state.w = mix(state.w, rate, uFtleBlend);
  position += uNoise * (random3(uvec3(gl_FragCoord.xy, 3u * uDrawIndex + 2u)) - 0.5);
  if (!all(lessThan(abs(position - uCenter), vec3(ESCAPE_LIMIT * uHalfExtent)))) {
    vec3 pick = random3(uvec3(gl_FragCoord.xy, 3u * uDrawIndex));
    ivec2 donor = ivec2(pick.xy * vec2(textureSize(uState, 0)));
    state = texelFetch(uState, donor, 0);
    vec4 shadow = texelFetch(uShadow, donor, 0);
    offset = shadow.xyz;
    rate = shadow.w;
    vec3 jitter = random3(uvec3(gl_FragCoord.xy, 3u * uDrawIndex + 1u)) - 0.5;
    position = state.xyz + jitter * JITTER * uHalfExtent;
  }
  outState = vec4(position, state.w);
  outShadow = vec4(offset, rate);
}
