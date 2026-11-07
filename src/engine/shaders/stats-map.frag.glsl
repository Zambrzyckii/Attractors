uniform sampler2D uState;
uniform vec3 uOrigin;
uniform float uWeight;

out vec4 outColor;

void main() {
  vec3 offset = texelFetch(uState, ivec2(gl_FragCoord.xy), 0).xyz - uOrigin;
  outColor = uWeight * vec4(offset, dot(offset, offset));
}
