uniform sampler2D uHdr;
uniform sampler2D uBloom;
uniform vec3 uBackground;
uniform float uExposure;
uniform float uBloomStrength;
uniform float uBloomLevels;
uniform uint uFrame;

out vec4 outColor;

void main() {
  vec3 image = texelFetch(uHdr, ivec2(gl_FragCoord.xy), 0).rgb;
  vec3 bloom = texture(uBloom, 0.5 * gl_FragCoord.xy / vec2(textureSize(uBloom, 0))).rgb / uBloomLevels;
  vec3 light = mix(image, bloom, uBloomStrength) * uExposure;
  vec3 color = uBackground + (1.0 - uBackground) * agx(light);
  uvec3 seed = uvec3(gl_FragCoord.xy, 2u * uFrame);
  vec3 noise = random3(seed) + random3(seed + uvec3(0u, 0u, 1u)) - 1.0;
  outColor = vec4(color + noise / 255.0, 1.0);
}
