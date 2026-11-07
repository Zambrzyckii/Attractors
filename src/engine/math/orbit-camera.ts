import { Mat4, multiply, perspective } from './mat4';
import { add, cross, dot, normalize, scale, subtract, Vec3 } from './vec3';

const WORLD_UP: Vec3 = [0, 0, 1];
const NEAR_RATIO = 0.01;
const FAR_RATIO = 100;

export class OrbitCamera {
  target: Vec3 = [0, 0, 0];
  distance = 1;
  azimuth = 0;
  elevation = 0;
  focalLength = 1;

  viewProjection(width: number, height: number): Mat4 {
    const near = this.distance * NEAR_RATIO;
    const far = this.distance * FAR_RATIO;
    return multiply(perspective(this.focalLength, width, height, near, far), this.viewMatrix());
  }

  viewMatrix(): Mat4 {
    const ring = Math.cos(this.elevation);
    const direction: Vec3 = [
      ring * Math.cos(this.azimuth),
      ring * Math.sin(this.azimuth),
      Math.sin(this.elevation),
    ];
    const eye = add(this.target, scale(direction, this.distance));
    const forward = normalize(subtract(this.target, eye));
    const right = normalize(cross(forward, WORLD_UP));
    const up = cross(right, forward);
    // prettier-ignore
    return new Float32Array([
      right[0], up[0], -forward[0], 0,
      right[1], up[1], -forward[1], 0,
      right[2], up[2], -forward[2], 0,
      -dot(right, eye), -dot(up, eye), dot(forward, eye), 1,
    ]);
  }
}
