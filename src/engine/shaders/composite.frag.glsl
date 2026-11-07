uniform sampler2D uHdr;
uniform sampler2D uBloom;
uniform vec3 uBackground;
uniform float uExposure;
uniform float uBloomStrength;
uniform float uBloomLevels;

out vec4 outColor;

void main() {
  vec3 image = texelFetch(uHdr, ivec2(gl_FragCoord.xy), 0).rgb;
  vec3 bloom = texture(uBloom, 0.5 * gl_FragCoord.xy / vec2(textureSize(uBloom, 0))).rgb / uBloomLevels;
  vec3 light = mix(image, bloom, uBloomStrength) * uExposure;
  outColor = vec4(uBackground + (1.0 - uBackground) * agx(light), 1.0);
}
