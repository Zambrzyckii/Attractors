export type Mat4 = Float32Array;

export function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Float32Array(16);
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[k * 4 + row] * b[column * 4 + k];
      }
      out[column * 4 + row] = sum;
    }
  }
  return out;
}

export function perspective(
  focalLength: number,
  width: number,
  height: number,
  near: number,
  far: number,
): Mat4 {
  const side = Math.min(width, height);
  const out = new Float32Array(16);
  out[0] = (focalLength * side) / width;
  out[5] = (focalLength * side) / height;
  out[10] = (far + near) / (near - far);
  out[11] = -1;
  out[14] = (2 * far * near) / (near - far);
  return out;
}
