import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { LYAPUNOV_HISTORY_SAMPLES } from '../engine/lyapunov-estimate';
import { ViewerStore } from './viewer-store';

const SPARK_WIDTH = 160;
const SPARK_HEIGHT = 32;
const SPARK_PADDING = 2;

@Component({
  selector: 'app-hud',
  imports: [DecimalPipe],
  template: `
    <section class="hud">
      <dl>
        @if (store.stats(); as stats) {
          <dt>Frame rate</dt>
          <dd>{{ stats.fps | number: '1.0-0' }} fps</dd>
          <dt>Particles</dt>
          <dd>{{ stats.particles | number }}</dd>
          <dt>Exposure</dt>
          <dd>
            {{ stats.exposure | number: '1.2-2' }}× (EV
            {{ log2(stats.exposure) | number: '1.2-2' }})
          </dd>
          <dt>Lyapunov λ₁</dt>
          <dd>
            @if (stats.lyapunov.estimate !== null) {
              {{ stats.lyapunov.estimate | number: '1.3-3' }}
            } @else {
              <span class="measuring">measuring</span>
            }
            @if (sparkline(); as line) {
              <svg
                [class.settling]="stats.lyapunov.estimate === null"
                [attr.viewBox]="'0 0 ' + sparkWidth + ' ' + sparkHeight"
                [attr.width]="sparkWidth"
                [attr.height]="sparkHeight"
                aria-hidden="true"
              >
                <line x1="0" [attr.x2]="sparkWidth" [attr.y1]="line.zero" [attr.y2]="line.zero" />
                <polyline [attr.points]="line.points" />
              </svg>
            }
          </dd>
        }
        <dt>Renderer</dt>
        <dd>{{ renderer() }}</dd>
        <dt>Keys</dt>
        <dd>H hide · R reset · N next · F fullscreen</dd>
      </dl>
      <button type="button" [disabled]="store.benchmarkRunning()" (click)="benchmark.emit()">
        {{ store.benchmarkRunning() ? 'Measuring…' : 'Benchmark' }}
      </button>
      @if (store.benchmark(); as report) {
        <p>GPU ms per frame, interval {{ report.intervalMs | number: '1.1-1' }} ms</p>
        <table>
          <thead>
            <tr>
              <th>Quality</th>
              <th>Frame</th>
              @for (pass of report.passes; track pass) {
                <th>{{ pass }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of report.rows; track row.quality) {
              <tr>
                <th>{{ row.quality }}</th>
                <td>{{ row.frameMs | number: '1.2-2' }}</td>
                @for (ms of row.passMs; track $index) {
                  <td>{{ ms | number: '1.2-2' }}</td>
                }
              </tr>
            }
          </tbody>
        </table>
      }
    </section>
  `,
  styles: `
    .hud {
      position: fixed;
      top: 16px;
      left: 16px;
      padding: 12px 16px;
      display: grid;
      gap: 12px;
      justify-items: start;
      background: rgb(12 16 15 / 0.8);
      border: 1px solid var(--line);
      border-radius: 8px;
      font:
        14px/1.4 ui-monospace,
        monospace;
    }
    dl {
      margin: 0;
      display: grid;
      grid-template-columns: auto auto;
      gap: 4px 16px;
    }
    dt,
    th,
    p {
      color: var(--muted);
      font-weight: normal;
    }
    dd {
      margin: 0;
    }
    .measuring {
      color: var(--muted);
    }
    svg {
      display: block;
      margin-top: 4px;
    }
    svg.settling {
      opacity: 0.4;
    }
    line {
      stroke: var(--line);
    }
    polyline {
      fill: none;
      stroke: var(--fg);
    }
    button {
      padding: 6px 12px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: none;
      color: var(--fg);
      font: inherit;
      cursor: pointer;
    }
    button:disabled {
      color: var(--muted);
      cursor: progress;
    }
    table {
      border-spacing: 12px 2px;
      margin: 0 -12px;
    }
    p {
      margin: 0 0 -8px;
    }
    th {
      text-align: left;
    }
    td {
      text-align: right;
    }
  `,
})
export class Hud {
  readonly renderer = input.required<string>();
  readonly benchmark = output();
  protected readonly store = inject(ViewerStore);
  protected readonly log2 = Math.log2;
  protected readonly sparkWidth = SPARK_WIDTH;
  protected readonly sparkHeight = SPARK_HEIGHT;
  protected readonly sparkline = computed(() => {
    const history = this.store.stats()?.lyapunov.history ?? [];
    if (history.length < 2) {
      return null;
    }
    const low = Math.min(0, ...history);
    const span = Math.max(0, ...history) - low || 1;
    const y = (value: number) =>
      SPARK_PADDING + (1 - (value - low) / span) * (SPARK_HEIGHT - 2 * SPARK_PADDING);
    const step = SPARK_WIDTH / (LYAPUNOV_HISTORY_SAMPLES - 1);
    const offset = SPARK_WIDTH - (history.length - 1) * step;
    return {
      points: history.map((value, index) => `${offset + index * step},${y(value)}`).join(' '),
      zero: y(0),
    };
  });
}
