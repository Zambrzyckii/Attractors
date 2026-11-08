import { Component, computed, inject, input } from '@angular/core';
import { BenchmarkReport } from '../engine/engine';
import { findQuality } from '../engine/settings';
import { groupDigits } from './format';
import { ViewerStore } from './viewer-store';

@Component({
  selector: 'app-benchmark-table',
  template: `
    <p>{{ table().note }}</p>
    <table>
      <thead>
        <tr>
          <td></td>
          @for (column of table().columns; track column.name) {
            <th scope="col" [class.current]="column.current">{{ column.name }}</th>
          }
        </tr>
      </thead>
      <tbody>
        @for (row of table().rows; track row.label) {
          <tr>
            <th scope="row">{{ row.label }}</th>
            @for (cell of row.cells; track $index) {
              <td [class.current]="table().columns[$index].current">{{ cell }}</td>
            }
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: `
    p {
      margin: 0 0 6px;
      color: var(--dim);
      font: 13px var(--mono);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font: 12px var(--mono);
    }
    th,
    td {
      padding: 3px 0 3px 12px;
      border-bottom: 1px solid var(--hair);
      color: var(--ink);
      font-weight: 400;
      text-align: right;
    }
    th[scope='row'] {
      padding-left: 0;
      color: var(--dim);
      text-align: left;
    }
    thead th {
      color: var(--mute);
    }
    .current,
    thead .current {
      color: var(--gold);
    }
  `,
})
export class BenchmarkTable {
  readonly report = input.required<BenchmarkReport>();
  private readonly store = inject(ViewerStore);
  protected readonly table = computed(() => {
    const report = this.report();
    const current = findQuality(this.store.qualityId()).name;
    const cells = (value: (row: BenchmarkReport['rows'][number]) => string) =>
      report.rows.map(value);
    return {
      note: `GPU ms per frame, interval ${report.intervalMs.toFixed(1)} ms`,
      columns: report.rows.map((row) => ({ name: row.quality, current: row.quality === current })),
      rows: [
        { label: 'particles', cells: cells((row) => groupDigits(row.particles)) },
        { label: 'frame', cells: cells((row) => row.frameMs.toFixed(2)) },
        ...report.passes.map((pass, index) => ({
          label: pass,
          cells: cells((row) => row.passMs[index].toFixed(2)),
        })),
      ],
    };
  });
}
