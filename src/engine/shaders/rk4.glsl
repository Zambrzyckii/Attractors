vec3 rk4Step(vec3 p, float h) {
  vec3 k1 = deriv(p);
  vec3 k2 = deriv(p + 0.5 * h * k1);
  vec3 k3 = deriv(p + 0.5 * h * k2);
  vec3 k4 = deriv(p + h * k3);
  return p + h / 6.0 * (k1 + 2.0 * k2 + 2.0 * k3 + k4);
}
