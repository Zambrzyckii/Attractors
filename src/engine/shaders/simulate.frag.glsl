uniform sampler2D uState;
uniform int uSteps;
uniform float uStep;

out vec4 outState;

void main() {
  vec4 state = texelFetch(uState, ivec2(gl_FragCoord.xy), 0);
  vec3 position = state.xyz;
  for (int i = 0; i < uSteps; i++) {
    position = rk4Step(position, uStep);
  }
  outState = vec4(position, state.w);
}
