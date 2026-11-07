uniform sampler2D uSource;
uniform bool uKarisAverage;
uniform float uExposure;

out vec4 outColor;

vec2 sourceTexel;
vec2 center;

vec3 tap(float x, float y) {
  return texture(uSource, center + vec2(x, y) * sourceTexel).rgb;
}

float karisWeight(vec3 color) {
  return 1.0 / (1.0 + dot(color * uExposure, vec3(0.2126, 0.7152, 0.0722)));
}

void main() {
  sourceTexel = 1.0 / vec2(textureSize(uSource, 0));
  center = 2.0 * gl_FragCoord.xy * sourceTexel;
  vec3 a = tap(-2.0, 2.0), b = tap(0.0, 2.0), c = tap(2.0, 2.0);
  vec3 d = tap(-2.0, 0.0), e = tap(0.0, 0.0), f = tap(2.0, 0.0);
  vec3 g = tap(-2.0, -2.0), h = tap(0.0, -2.0), i = tap(2.0, -2.0);
  vec3 j = tap(-1.0, 1.0), k = tap(1.0, 1.0), l = tap(-1.0, -1.0), m = tap(1.0, -1.0);
  vec3 boxes[5] = vec3[5](j + k + l + m, a + b + d + e, b + c + e + f, d + e + g + h, e + f + h + i);
  const float BOX_WEIGHTS[5] = float[5](0.5, 0.125, 0.125, 0.125, 0.125);
  vec3 color = vec3(0.0);
  float total = 0.0;
  for (int n = 0; n < 5; n++) {
    vec3 box = boxes[n] * 0.25;
    float weight = BOX_WEIGHTS[n] * (uKarisAverage ? karisWeight(box) : 1.0);
    color += box * weight;
    total += weight;
  }
  outColor = vec4(color / total, 1.0);
}
