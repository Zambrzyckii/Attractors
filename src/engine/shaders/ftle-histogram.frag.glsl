uniform sampler2D uState;
uniform vec2 uRange;
uniform ivec2 uStride;

out vec4 outBins;

const int SAMPLES = 64;
const int BINS = 48;

void main() {
  int first = int(gl_FragCoord.x) * 4;
  vec4 bins = vec4(0.0);
  for (int y = 0; y < SAMPLES; y++) {
    for (int x = 0; x < SAMPLES; x++) {
      float ftle = texelFetch(uState, ivec2(x, y) * uStride, 0).w;
      float scaled = (ftle - uRange.x) / (uRange.y - uRange.x) * float(BINS);
      int bin = clamp(int(floor(scaled)), 0, BINS - 1) - first;
      if (bin >= 0 && bin < 4) {
        bins[bin] += 1.0;
      }
    }
  }
  outBins = bins / float(SAMPLES * SAMPLES);
}
