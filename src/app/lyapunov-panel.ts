import { Component, computed, inject } from '@angular/core';
import { LYAPUNOV_HISTORY_SAMPLES } from '../engine/lyapunov-estimate';
import { buildSparkline } from './sparkline';
import { ViewerStore } from './viewer-store';

const WIDTH = 470;
const HEIGHT = 86;
const PLOT_WIDTH = 408;
const PLOT_TOP = 6;
const PLOT_HEIGHT = 64;
const PADDING = 2;
const VALUE_GAP = 6;
const VALUE_DROP = 4;

@Component({
  selector: 'app-lyapunov-panel',
  template: `
    <p>
      <b [class.measuring]="estimate() === null">λ<sub>1</sub> {{ readout() }}</b>
      <span>largest Lyapunov exponent, 10 s mean</span>
    </p>
    <svg [attr.width]="width" [attr.height]="height" aria-hidden="true">
      @if (line(); as line) {
        <g [attr.transform]="'translate(0 ' + plotTop + ')'" [class.settling]="estimate() === null">
          <line
            class="zero"
            x1="0"
            [attr.x2]="plotWidth"
            [attr.y1]="line.zero"
            [attr.y2]="line.zero"
          />
          <polyline [attr.points]="line.points" />
          @if (estimate() !== null) {
            <text class="value" [attr.x]="plotWidth + valueGap" [attr.y]="line.head.y + valueDrop">
              {{ readout() }}
            </text>
          }
        </g>
      }
      <text x="0" [attr.y]="height - 2">60 s ago</text>
      <text class="now" [attr.x]="plotWidth" [attr.y]="height - 2">now</text>
    </svg>
  `,
  styles: `
    p {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 4px 14px;
      margin: 0 0 6px;
    }
    b {
      color: var(--gold);
      font: italic 300 52px/1 var(--serif);
      white-space: nowrap;
    }
    b.measuring {
      color: var(--dim);
    }
    span {
      color: var(--dim);
      font: 13px var(--mono);
    }
    svg {
      display: block;
    }
    .settling {
      opacity: 0.4;
    }
    .zero {
      stroke: var(--hair);
      stroke-dasharray: 2 5;
    }
    polyline {
      fill: none;
      stroke: var(--gold);
      stroke-width: 1.2;
      stroke-linejoin: round;
    }
    text {
      fill: var(--dim);
      font: 12px var(--mono);
    }
    .now {
      text-anchor: end;
    }
    .value {
      fill: var(--gold);
    }
  `,
})
export class LyapunovPanel {
  private readonly store = inject(ViewerStore);
  protected readonly width = WIDTH;
  protected readonly height = HEIGHT;
  protected readonly plotWidth = PLOT_WIDTH;
  protected readonly plotTop = PLOT_TOP;
  protected readonly valueGap = VALUE_GAP;
  protected readonly valueDrop = VALUE_DROP;
  private readonly history = computed(() => this.store.stats()?.lyapunov.history ?? []);
  protected readonly estimate = computed(() => this.store.stats()?.lyapunov.estimate ?? null);
  protected readonly readout = computed(() => this.estimate()?.toFixed(3) ?? 'measuring');
  protected readonly line = computed(() =>
    buildSparkline(this.history(), LYAPUNOV_HISTORY_SAMPLES, PLOT_WIDTH, PLOT_HEIGHT, PADDING),
  );
}
