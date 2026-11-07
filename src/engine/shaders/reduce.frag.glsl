uniform sampler2D uSource;

out vec4 outColor;

void main() {
  ivec2 size = textureSize(uSource, 0);
  ivec2 origin = ivec2(gl_FragCoord.xy) * BLOCK;
  vec4 sum = vec4(0.0);
  for (int y = 0; y < BLOCK; y++) {
    for (int x = 0; x < BLOCK; x++) {
      ivec2 texel = origin + ivec2(x, y);
      if (all(lessThan(texel, size))) {
        sum += texelFetch(uSource, texel, 0);
      }
    }
  }
  outColor = sum;
}
