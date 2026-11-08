import { Component, computed, inject } from '@angular/core';
import { findAttractor } from '../engine/attractors/registry';
import { LyapunovPanel } from './lyapunov-panel';
import { formatValue } from './param-scale';
import { ViewerStore } from './viewer-store';

@Component({
  selector: 'app-statistics-page',
  imports: [LyapunovPanel],
  template: `
    <section aria-label="Statistics">
      <h1>
        {{ preset().name }}
        <small>
          @for (param of params(); track param.name) {
            <span class="param"><i>{{ param.symbol }}</i> {{ param.value }}</span>
          }
        </small>
      </h1>
      <app-lyapunov-panel />
    </section>
  `,
  styles: `
    section {
      position: fixed;
      top: 70px;
      bottom: 24px;
      left: 30px;
      width: 470px;
      display: grid;
      align-content: start;
      gap: 18px;
      overflow-y: auto;
    }
    h1 {
      margin: 0;
      font: italic 300 46px/1.1 var(--serif);
    }
    small {
      margin-left: 12px;
      color: var(--dim);
      font: normal 400 13px var(--mono);
    }
    i {
      font: italic 15px var(--serif);
    }
    .param + .param::before {
      content: '·';
      margin: 0 8px;
    }
  `,
})
export class StatisticsPage {
  private readonly store = inject(ViewerStore);
  protected readonly preset = computed(() => findAttractor(this.store.attractorId()));
  protected readonly params = computed(() =>
    this.preset().params.map((param, index) => ({
      name: param.name,
      symbol: param.label ?? param.name,
      value: formatValue(this.store.params()[index]),
    })),
  );
}
