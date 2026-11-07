uniform sampler2D uSource;
uniform float uSpread;
uniform bool uAroundZ;

out vec4 outState;

void main() {
  uvec2 texel = uvec2(gl_FragCoord.xy);
  vec2 donor = random3(uvec3(texel, 2u)).xy * vec2(textureSize(uSource, 0));
  vec3 origin = texelFetch(uSource, ivec2(donor), 0).xyz;
  vec3 position = origin + (random3(uvec3(texel, 0u)) - 0.5) * uSpread;
  if (uAroundZ) {
    float angle = 6.2831853 * random3(uvec3(texel, 1u)).x;
    position.xy = mat2(cos(angle), sin(angle), -sin(angle), cos(angle)) * position.xy;
  }
  outState = vec4(position, 0.0);
}
