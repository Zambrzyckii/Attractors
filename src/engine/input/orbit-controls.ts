import { smoothing } from '../frame-clock';
import { OrbitCamera } from '../math/orbit-camera';

const ORBIT_PER_HEIGHT = Math.PI;
const MAX_ELEVATION = 1.45;
const ZOOM_PER_PIXEL = 0.0015;
const LINE_PIXELS = 16;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_SECONDS = 0.12;
const IDLE_SECONDS = 3;
const SPIN_UP_SECONDS = 0.6;
const AUTO_ROTATE_SPEED = 0.2;

interface Glide {
  from: number;
  to: number;
  elapsed: number;
  seconds: number;
}

export class OrbitControls {
  zoom = 1;
  private targetZoom = 1;
  private glide: Glide | null = null;
  private dragPointer: number | null = null;
  private lastX = 0;
  private lastY = 0;
  private idleSeconds = IDLE_SECONDS;
  private spin = 1;

  constructor(
    private readonly element: HTMLElement,
    private readonly camera: OrbitCamera,
  ) {
    element.addEventListener('pointerdown', this.onPointerDown);
    element.addEventListener('pointermove', this.onPointerMove);
    element.addEventListener('pointerup', this.onPointerEnd);
    element.addEventListener('pointercancel', this.onPointerEnd);
    element.addEventListener('lostpointercapture', this.onPointerEnd);
    element.addEventListener('wheel', this.onWheel, { passive: false });
  }

  update(dt: number): void {
    this.idleSeconds = this.dragPointer === null ? this.idleSeconds + dt : 0;
    if (this.idleSeconds >= IDLE_SECONDS) {
      this.spin += (1 - this.spin) * smoothing(dt, SPIN_UP_SECONDS);
    }
    this.camera.azimuth += dt * AUTO_ROTATE_SPEED * this.spin;
    if (this.glide) {
      this.advanceGlide(this.glide, dt);
    } else {
      this.zoom *= (this.targetZoom / this.zoom) ** smoothing(dt, ZOOM_SECONDS);
    }
  }

  glideZoom(from: number, to: number, seconds: number): void {
    this.glide = { from, to, elapsed: 0, seconds };
  }

  private advanceGlide(glide: Glide, dt: number): void {
    glide.elapsed += dt;
    const t = glide.seconds > 0 ? Math.min(1, glide.elapsed / glide.seconds) : 1;
    this.zoom = glide.from * (glide.to / glide.from) ** (1 - (1 - t) ** 3);
    this.targetZoom = this.zoom;
    if (t === 1) {
      this.glide = null;
    }
  }

  dispose(): void {
    this.element.removeEventListener('pointerdown', this.onPointerDown);
    this.element.removeEventListener('pointermove', this.onPointerMove);
    this.element.removeEventListener('pointerup', this.onPointerEnd);
    this.element.removeEventListener('pointercancel', this.onPointerEnd);
    this.element.removeEventListener('lostpointercapture', this.onPointerEnd);
    this.element.removeEventListener('wheel', this.onWheel);
  }

  private interrupt(): void {
    this.idleSeconds = 0;
    this.spin = 0;
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || this.dragPointer !== null) {
      return;
    }
    this.element.setPointerCapture(event.pointerId);
    this.dragPointer = event.pointerId;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.interrupt();
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.dragPointer) {
      return;
    }
    const radiansPerPixel = ORBIT_PER_HEIGHT / Math.max(1, this.element.clientHeight);
    const elevation = this.camera.elevation + (event.clientY - this.lastY) * radiansPerPixel;
    this.camera.azimuth -= (event.clientX - this.lastX) * radiansPerPixel;
    this.camera.elevation = Math.min(MAX_ELEVATION, Math.max(-MAX_ELEVATION, elevation));
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  };

  private readonly onPointerEnd = (event: PointerEvent): void => {
    if (event.pointerId === this.dragPointer) {
      this.dragPointer = null;
    }
  };

  private readonly onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.glide = null;
    const unit =
      event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? LINE_PIXELS
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? this.element.clientHeight
          : 1;
    const zoom = this.targetZoom * Math.exp(event.deltaY * unit * ZOOM_PER_PIXEL);
    this.targetZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
    this.interrupt();
  };
}
