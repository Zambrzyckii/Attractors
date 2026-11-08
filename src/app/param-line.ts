import { Component, computed, inject } from '@angular/core';
import { findAttractor } from '../engine/attractors/registry';
import { ParamChip } from './param-chip';
import { ViewerStore } from './viewer-store';

@Component({
  selector: 'app-param-line',
  imports: [ParamChip],
  template: `
    <section aria-label="Parameters">
      @for (param of preset().params; track param; let index = $index) {
        <app-param-chip
          [param]="param"
          [value]="store.params()[index]"
          [disabled]="store.benchmarkRunning()"
          [marksDimmed]="othersChanged(index)"
          (valueChange)="setParam(index, $event)"
        />
      }
    </section>
  `,
  styles: `
    section {
      position: fixed;
      left: 32px;
      bottom: 74px;
      display: flex;
      gap: 22px;
      align-items: baseline;
    }
  `,
})
export class ParamLine {
  protected readonly store = inject(ViewerStore);
  protected readonly preset = computed(() => findAttractor(this.store.attractorId()));

  protected othersChanged(index: number): boolean {
    const defaults = this.preset().params;
    return this.store
      .params()
      .some((value, other) => other !== index && value !== defaults[other].value);
  }

  protected setParam(index: number, value: number): void {
    this.store.params.update((values) =>
      values.map((current, other) => (other === index ? value : current)),
    );
  }
}
