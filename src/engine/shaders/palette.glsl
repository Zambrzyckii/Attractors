const float PALETTE_STOPS[5] = float[5](0.0, 0.35, 0.62, 0.84, 1.0);
const vec3 PALETTE_COLORS[5] = vec3[5](
  vec3(30.0, 46.0, 120.0),
  vec3(48.0, 140.0, 172.0),
  vec3(120.0, 204.0, 196.0),
  vec3(240.0, 196.0, 112.0),
  vec3(255.0, 246.0, 228.0)
);

vec3 palette(float t) {
  vec3 color = PALETTE_COLORS[0];
  for (int i = 1; i < 5; i++) {
    float start = PALETTE_STOPS[i - 1];
    float along = clamp((t - start) / (PALETTE_STOPS[i] - start), 0.0, 1.0);
    color = mix(color, PALETTE_COLORS[i], along);
  }
  return color / 255.0;
}
