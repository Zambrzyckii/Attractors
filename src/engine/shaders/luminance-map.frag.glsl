uniform sampler2D uSource;

out vec4 outColor;

void main() {
  vec3 color = texelFetch(uSource, ivec2(gl_FragCoord.xy), 0).rgb;
  float light = dot(color, vec3(0.2126, 0.7152, 0.0722));
  outColor = vec4(light * log2(max(light, 1e-12)), light, 0.0, 0.0);
}
