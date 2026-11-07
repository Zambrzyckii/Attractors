const MAX_FRAME_SECONDS = 0.1;

export class FrameClock {
  private handle = 0;
  private lastNow = -1;
  private time = 0;

  start(onFrame: (dt: number, time: number) => void): void {
    const tick = (now: number) => {
      const dt = this.lastNow < 0 ? 0 : Math.min(MAX_FRAME_SECONDS, (now - this.lastNow) / 1000);
      this.lastNow = now;
      this.time += dt;
      onFrame(dt, this.time);
      this.handle = requestAnimationFrame(tick);
    };
    this.handle = requestAnimationFrame(tick);
  }

  stop(): void {
    cancelAnimationFrame(this.handle);
    this.lastNow = -1;
  }
}

export function smoothing(dt: number, tau: number): number {
  return 1 - Math.exp(-dt / tau);
}

const REFRESH_SAMPLES = 16;

export function measureRefreshRate(): Promise<number> {
  return new Promise((resolve) => {
    const intervals: number[] = [];
    let lastNow = -1;
    const tick = (now: number) => {
      if (lastNow >= 0) {
        intervals.push(now - lastNow);
      }
      lastNow = now;
      if (intervals.length < REFRESH_SAMPLES) {
        requestAnimationFrame(tick);
        return;
      }
      intervals.sort((a, b) => a - b);
      resolve(1000 / intervals[intervals.length >> 1]);
    };
    requestAnimationFrame(tick);
  });
}
