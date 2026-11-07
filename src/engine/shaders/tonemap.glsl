// AgX constants from the MIT-licensed minimal AgX by Benjamin Wrensch (iolite-engine.com/blog_posts/minimal_agx_implementation).
const mat3 AGX_INSET = mat3(
  0.842479062253094, 0.0423282422610123, 0.0423756549057051,
  0.0784335999999992, 0.878468636469772, 0.0784336,
  0.0792237451477643, 0.0791661274605434, 0.879142973793104
);
const mat3 AGX_OUTSET = mat3(
  1.19687900512017, -0.0528968517574562, -0.0529716355144438,
  -0.0980208811401368, 1.15190312990417, -0.0980434501171241,
  -0.0990297440797205, -0.0989611768448433, 1.15107367264116
);
const float MIN_EV = -12.47393;
const float MAX_EV = 4.026069;

vec3 agxEncode(vec3 light) {
  vec3 stops = log2(max(light, exp2(MIN_EV)));
  return clamp((stops - MIN_EV) / (MAX_EV - MIN_EV), 0.0, 1.0);
}

vec3 agxContrast(vec3 x) {
  vec3 x2 = x * x;
  vec3 x4 = x2 * x2;
  return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232;
}

vec3 agx(vec3 light) {
  vec3 encoded = agxEncode(AGX_INSET * light);
  return clamp(AGX_OUTSET * agxContrast(encoded), 0.0, 1.0);
}
