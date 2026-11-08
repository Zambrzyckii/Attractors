uniform sampler2D uState;
uniform sampler2D uShadow;
uniform vec3 uCenter;
uniform float uDistance;
uniform uint uPress;

layout(location = 0) out vec4 outState;
layout(location = 1) out vec4 outShadow;

const float THROWN_SHARE = 0.9;
const float INFINITE_SHARE = 0.5;

void main() {
  vec4 state = texelFetch(uState, ivec2(gl_FragCoord.xy), 0);
  vec3 random = random3(uvec3(gl_FragCoord.xy, uPress));
  if (random.x < THROWN_SHARE) {
    vec3 away = state.xyz - uCenter;
    float reach = max(max(abs(away.x), abs(away.y)), abs(away.z));
    float throwDistance = random.y < INFINITE_SHARE ? uDistance / 0.0 : uDistance;
    state.xyz = uCenter + away / reach * throwDistance;
  }
  outState = state;
  outShadow = texelFetch(uShadow, ivec2(gl_FragCoord.xy), 0);
}
