flat in vec3 vColor;
flat in float vSigma;
flat in float vPointSize;

out vec4 outColor;

void main() {
  vec2 offset = (gl_PointCoord - 0.5) * vPointSize;
  float variance = vSigma * vSigma;
  float weight = exp(-dot(offset, offset) / (2.0 * variance)) / (6.2831853 * variance);
  outColor = vec4(vColor * weight, 1.0);
}
