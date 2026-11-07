import { DecimalPipe } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { ViewerStore } from './viewer-store';

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
        }
        <dt>Renderer</dt>
        <dd>{{ renderer() }}</dd>
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
}
