const float SIGMA = 10.0;
const float RHO = 28.0;
const float BETA = 8.0 / 3.0;

vec3 deriv(vec3 p) {
  return vec3(SIGMA * (p.y - p.x), p.x * (RHO - p.z) - p.y, p.x * p.y - BETA * p.z);
}
