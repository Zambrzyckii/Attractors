import { Component, computed, inject } from '@angular/core';
import { LYAPUNOV_HISTORY_SAMPLES } from '../engine/lyapunov-estimate';
import { elementSize } from './element-size';
import { groupDigits } from './format';
import { buildSparkline } from './sparkline';
import { ViewerStore } from './viewer-store';

const HEIGHT = 56;
const PADDING = 10;
const READOUT_SPACE = 170;
const TEXT_GAP = 12;
const TEXT_DROP = 9;
const TEXT_TOP = 28;
const TEXT_BOTTOM_GAP = 8;

@Component({
  selector: 'app-seismograph',
  template: `
    @if (meta(); as text) {
      <p>{{ text }}</p>
    }
    <svg [attr.width]="width()" [attr.height]="height()" aria-hidden="true">
      @if (line(); as line) {
        <line
          class="zero"
          x1="0"
          [attr.x2]="traceWidth()"
          [attr.y1]="line.zero"
          [attr.y2]="line.zero"
        />
        <g class="trace" [class.settling]="estimate() === null">
          <polyline [attr.points]="line.points" />
          <circle [attr.cx]="line.head.x" [attr.cy]="line.head.y" r="3" />
        </g>
      }
      <!-- prettier-ignore -->
      <text [class.measuring]="estimate() === null" [attr.x]="textX()" [attr.y]="textY()">λ<tspan class="sub" baseline-shift="sub">1</tspan> {{ readout() }}</text>
    </svg>
  `,
  styles: `
    :host {
      position: fixed;
      right: 0;
      bottom: 0;
      left: 0;
      height: 56px;
      pointer-events: none;
      animation: enter 400ms ease 200ms backwards;
    }
    p {
      position: absolute;
      right: 30px;
      bottom: 62px;
      margin: 0;
      color: var(--dim);
      font: 13px var(--mono);
    }
    svg {
      display: block;
    }
    .zero {
      stroke: var(--hair);
      stroke-dasharray: 2 5;
    }
    .trace {
      opacity: 0.8;
    }
    .trace.settling {
      opacity: 0.4;
    }
    polyline {
      fill: none;
      stroke: var(--gold);
      stroke-width: 1.1;
      stroke-linejoin: round;
    }
    circle {
      fill: var(--gold);
    }
    text {
      fill: var(--ink);
      font: italic 300 28px var(--serif);
    }
    text.measuring {
      fill: var(--dim);
    }
    .sub {
      font-size: 17px;
    }
    @media (max-width: 899px), (orientation: portrait) {
      :host {
        height: 44px;
      }
      p {
        right: 16px;
        bottom: 50px;
      }
    }
  `,
})
export class Seismograph {
  private readonly store = inject(ViewerStore);
  private readonly size = elementSize({ width: 0, height: HEIGHT });
  protected readonly width = computed(() => this.size().width);
  protected readonly height = computed(() => this.size().height);
  protected readonly traceWidth = computed(() => Math.max(0, this.width() - READOUT_SPACE));
  protected readonly estimate = computed(() => this.store.stats()?.lyapunov.estimate ?? null);
  protected readonly readout = computed(() => this.estimate()?.toFixed(3) ?? 'measuring');
  protected readonly line = computed(() =>
    buildSparkline(
      this.store.stats()?.lyapunov.history ?? [],
      LYAPUNOV_HISTORY_SAMPLES,
      this.traceWidth(),
      this.height(),
      PADDING,
    ),
  );
  protected readonly textX = computed(() => this.traceWidth() + TEXT_GAP);
  protected readonly textY = computed(() => {
    const head = this.line()?.head.y ?? this.height() / 2;
    return Math.min(Math.max(head + TEXT_DROP, TEXT_TOP), this.height() - TEXT_BOTTOM_GAP);
  });
  protected readonly meta = computed(() => {
    const stats = this.store.stats();
    return stats
      ? `${groupDigits(stats.particles)} particles · ${Math.round(stats.fps)} fps`
      : null;
  });
}
