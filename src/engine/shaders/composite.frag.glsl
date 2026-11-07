uniform sampler2D uHdr;
uniform vec3 uBackground;
uniform float uExposure;

out vec4 outColor;

void main() {
  vec3 light = texelFetch(uHdr, ivec2(gl_FragCoord.xy), 0).rgb * uExposure;
  outColor = vec4(uBackground + (1.0 - uBackground) * light / (1.0 + light), 1.0);
}
