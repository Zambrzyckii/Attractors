import { Component, computed, inject, output } from '@angular/core';
import { findQuality } from '../engine/settings';
import { EngineHost } from './engine-host';
import { groupDigits } from './format';
import { formatValue } from './param-scale';
import { ViewerStore } from './viewer-store';

interface StatRow {
  label: string;
  value: string;
}

const PENDING = 'pending';

const KEYS: { caps: string[]; action: string }[] = [
  { caps: ['←', '→'], action: 'Move a focused chip' },
  { caps: ['[', ']'], action: 'Previous or next mark on a focused chip' },
  { caps: ['Esc'], action: 'Close the open rule' },
  { caps: ['H'], action: 'Hide or show the UI' },
  { caps: ['R'], action: 'Reset parameters' },
  { caps: ['N'], action: 'Next system' },
  { caps: ['F'], action: 'Toggle fullscreen' },
  { caps: ['B'], action: 'Scatter the particles' },
];

@Component({
  selector: 'app-stat-lists',
  template: `
    @for (group of groups(); track group.title) {
      <section>
        <h3>{{ group.title }}</h3>
        @for (row of group.rows; track row.label) {
          <p><span>{{ row.label }}</span><span>{{ row.value }}</span></p>
        }
      </section>
    }
    <section>
      <h3>Device</h3>
      @for (row of device(); track row.label) {
        <p><span>{{ row.label }}</span><span>{{ row.value }}</span></p>
      }
      <p>
        <span>benchmark</span>
        <button type="button" [disabled]="store.benchmarkRunning()" (click)="run.emit()">
          {{ store.benchmarkRunning() ? 'Measuring…' : 'Run' }}
        </button>
      </p>
    </section>
    <section class="keys">
      <h3>Keys</h3>
      @for (key of keys; track key.action) {
        <p>
          <span>
            @for (cap of key.caps; track cap) {
              <kbd class="kbd">{{ cap }}</kbd>
            }
          </span>
          <span>{{ key.action }}</span>
        </p>
      }
    </section>
  `,
  styles: `
    :host {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px 28px;
    }
    h3 {
      margin: 0 0 4px;
      font: italic 300 19px var(--serif);
    }
    p {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin: 0;
      padding: 3px 0;
      border-bottom: 1px solid var(--hair);
      color: var(--ink);
      font: 13px var(--mono);
    }
    p span:first-child {
      color: var(--dim);
    }
    span:last-child {
      text-align: right;
    }
    .keys {
      grid-column: 1 / -1;
    }
    kbd + kbd {
      margin-left: 4px;
    }
    button {
      padding: 0;
      border: 0;
      background: none;
      color: var(--gold);
      font: inherit;
      cursor: pointer;
    }
    button:disabled {
      color: var(--dim);
      cursor: progress;
    }
  `,
})
export class StatLists {
  readonly run = output();
  protected readonly store = inject(ViewerStore);
  private readonly host = inject(EngineHost);
  protected readonly keys = KEYS;
  protected readonly groups = computed(() => {
    const stats = this.store.stats();
    const cloud = stats?.cloud ?? null;
    return [
      {
        title: 'Shape',
        rows: [
          { label: 'centroid x', value: fixed(cloud?.centroid[0]) },
          { label: 'centroid y', value: fixed(cloud?.centroid[1]) },
          { label: 'centroid z', value: fixed(cloud?.centroid[2]) },
          { label: 'rms radius', value: fixed(cloud?.rmsRadius) },
        ],
      },
      {
        title: 'Motion',
        rows: [
          { label: 'mean speed', value: cloud ? formatValue(cloud.meanSpeed) : PENDING },
          { label: 'time step', value: stats ? formatValue(stats.timeStep) : PENDING },
          { label: 'substeps per frame', value: stats ? String(stats.substeps) : PENDING },
          { label: 'state', value: motionState(stats?.gliding, stats?.lyapunov.estimate) },
        ],
      },
      {
        title: 'Rendering',
        rows: stats
          ? [
              { label: 'frame rate', value: `${Math.round(stats.fps)} fps` },
              { label: 'particles', value: groupDigits(stats.particles) },
              { label: 'exposure', value: exposureText(stats.exposure) },
            ]
          : [],
      },
    ];
  });
  protected readonly device = computed((): StatRow[] => {
    const caps = this.host.caps();
    const quality = { label: 'quality', value: findQuality(this.store.qualityId()).name };
    if (!caps) {
      return [quality];
    }
    return [
      { label: 'renderer', value: caps.renderer },
      { label: 'max texture', value: groupDigits(caps.maxTextureSize) },
      { label: 'float blending', value: caps.extensions['EXT_float_blend'] ? 'yes' : 'no' },
      quality,
    ];
  });
}

function fixed(value: number | undefined): string {
  if (value === undefined) {
    return PENDING;
  }
  const rounded = Math.round(value * 100) / 100;
  return (rounded === 0 ? 0 : rounded).toFixed(2);
}

function motionState(gliding: boolean | undefined, estimate: number | null | undefined): string {
  if (gliding) {
    return 'gliding';
  }
  return estimate === null || estimate === undefined ? 'measuring' : 'settled';
}

function exposureText(exposure: number): string {
  return `${exposure.toFixed(2)}× EV ${Math.log2(exposure).toFixed(2)}`;
}
