uniform sampler2D uHdr;
uniform vec3 uBackground;

out vec4 outColor;

void main() {
  vec3 light = texelFetch(uHdr, ivec2(gl_FragCoord.xy), 0).rgb;
  outColor = vec4(uBackground + light, 1.0);
}
