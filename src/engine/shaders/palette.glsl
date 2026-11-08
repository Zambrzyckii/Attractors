const float PALETTE_STOPS[5] = float[5](0.0, 0.35, 0.62, 0.84, 1.0);
const vec3 PALETTE_COLORS[5] = vec3[5](
  vec3(30.0, 46.0, 120.0),
  vec3(48.0, 140.0, 172.0),
  vec3(120.0, 204.0, 196.0),
  vec3(240.0, 196.0, 112.0),
  vec3(255.0, 246.0, 228.0)
);

const vec3 DIVERGING_COLORS[3] = vec3[3](
  vec3(90.0, 150.0, 255.0),
  vec3(150.0, 150.0, 155.0),
  vec3(225.0, 130.0, 50.0)
);

vec3 srgbToLinear(vec3 encoded) {
  return mix(encoded / 12.92, pow((encoded + 0.055) / 1.055, vec3(2.4)), step(0.04045, encoded));
}

vec3 palette(float t) {
  vec3 color = PALETTE_COLORS[0];
  for (int i = 1; i < 5; i++) {
    float start = PALETTE_STOPS[i - 1];
    float along = clamp((t - start) / (PALETTE_STOPS[i] - start), 0.0, 1.0);
    color = mix(color, PALETTE_COLORS[i], along);
  }
  return srgbToLinear(color / 255.0);
}

vec3 divergingPalette(float t) {
  float along = clamp(t, -1.0, 1.0);
  vec3 color = along < 0.0
    ? mix(DIVERGING_COLORS[1], DIVERGING_COLORS[0], -along)
    : mix(DIVERGING_COLORS[1], DIVERGING_COLORS[2], along);
  return srgbToLinear(color / 255.0);
}
