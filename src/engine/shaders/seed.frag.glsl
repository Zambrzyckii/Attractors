uniform vec3 uCenter;
uniform float uHalfSize;

out vec4 outState;

void main() {
  vec3 offset = random3(uvec3(gl_FragCoord.xy, 0u)) * 2.0 - 1.0;
  outState = vec4(uCenter + offset * uHalfSize, 0.0);
}
