uniform sampler2D uSource;

out vec4 outColor;

void main() {
  vec2 sourceTexel = 1.0 / vec2(textureSize(uSource, 0));
  vec2 center = 0.5 * gl_FragCoord.xy * sourceTexel;
  vec3 color = vec3(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      float weight = float((2 - abs(x)) * (2 - abs(y)));
      color += weight * texture(uSource, center + vec2(x, y) * sourceTexel).rgb;
    }
  }
  outColor = vec4(color / 16.0, 1.0);
}
