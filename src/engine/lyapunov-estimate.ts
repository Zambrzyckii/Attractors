export const LYAPUNOV_HISTORY_SAMPLES = 240;
const WINDOW_SAMPLES = 40;
const SETTLE_SECONDS = 25;

export interface LyapunovReading {
  estimate: number | null;
  history: readonly number[];
}

export class LyapunovEstimate {
  private latest: number | null = null;
  private history: number[] = [];
  private settleLeft = SETTLE_SECONDS;

  restart(): void {
    this.latest = null;
    this.history = [];
    this.settleLeft = SETTLE_SECONDS;
  }

  observe(meanFtle: number): void {
    if (Number.isFinite(meanFtle)) {
      this.latest = meanFtle;
    }
  }

  sample(seconds: number, settling: boolean): LyapunovReading {
    this.settleLeft = settling ? SETTLE_SECONDS : Math.max(0, this.settleLeft - seconds);
    if (this.latest !== null) {
      this.history = [...this.history.slice(1 - LYAPUNOV_HISTORY_SAMPLES), this.latest];
    }
    const window = this.history.slice(-WINDOW_SAMPLES);
    const settled = this.settleLeft === 0 && window.length > 0;
    return {
      estimate: settled ? window.reduce((sum, value) => sum + value, 0) / window.length : null,
      history: this.history,
    };
  }
}
