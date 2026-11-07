uniform sampler2D uHistory;
uniform sampler2D uFrame;
uniform float uBlend;

out vec4 outColor;

void main() {
  ivec2 texel = ivec2(gl_FragCoord.xy);
  outColor = mix(texelFetch(uHistory, texel, 0), texelFetch(uFrame, texel, 0), uBlend);
}
