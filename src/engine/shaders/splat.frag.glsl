uniform vec3 uColor;

in float vBrightness;

out vec4 outColor;

void main() {
  outColor = vec4(uColor * vBrightness, 1.0);
}
