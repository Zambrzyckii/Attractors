uniform sampler2D uState;
uniform float uWeight;

out vec4 outColor;

void main() {
  vec4 state = texelFetch(uState, ivec2(gl_FragCoord.xy), 0);
  outColor = vec4(uWeight * length(deriv(state.xyz)), uWeight * state.w, 0.0, 0.0);
}
