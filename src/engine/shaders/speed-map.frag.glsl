uniform sampler2D uState;
uniform float uWeight;

out vec4 outColor;

void main() {
  vec3 position = texelFetch(uState, ivec2(gl_FragCoord.xy), 0).xyz;
  outColor = vec4(uWeight * length(deriv(position)), 0.0, 0.0, 0.0);
}
