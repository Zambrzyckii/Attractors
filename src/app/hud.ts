import { DecimalPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { ViewerStore } from './viewer-store';

@Component({
  selector: 'app-hud',
  imports: [DecimalPipe],
  template: `
    <dl class="hud">
      @if (store.stats(); as stats) {
        <dt>Frame rate</dt>
        <dd>{{ stats.fps | number: '1.0-0' }} fps</dd>
        <dt>Particles</dt>
        <dd>{{ stats.particles | number }}</dd>
        <dt>Exposure</dt>
        <dd>
          {{ stats.exposure | number: '1.2-2' }}× (EV {{ log2(stats.exposure) | number: '1.2-2' }})
        </dd>
      }
      <dt>Renderer</dt>
      <dd>{{ renderer() }}</dd>
    </dl>
  `,
  styles: `
    .hud {
      position: fixed;
      top: 16px;
      left: 16px;
      margin: 0;
      padding: 12px 16px;
      display: grid;
      grid-template-columns: auto auto;
      gap: 4px 16px;
      background: rgb(12 16 15 / 0.8);
      border: 1px solid var(--line);
      border-radius: 8px;
      font:
        14px/1.4 ui-monospace,
        monospace;
    }
    dt {
      color: var(--muted);
    }
    dd {
      margin: 0;
    }
  `,
})
export class Hud {
  readonly renderer = input.required<string>();
  protected readonly store = inject(ViewerStore);
  protected readonly log2 = Math.log2;
}
