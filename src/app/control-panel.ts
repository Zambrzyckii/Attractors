import { Component, computed, inject } from '@angular/core';
import { findAttractor } from '../engine/attractors/registry';
import { ParamSlider } from './param-slider';
import { ViewerStore } from './viewer-store';

@Component({
  selector: 'app-control-panel',
  imports: [ParamSlider],
  template: `
    <section class="panel params" aria-label="Parameters">
      @for (param of preset().params; track param.name; let index = $index) {
        <app-param-slider
          [param]="param"
          [value]="store.params()[index]"
          [disabled]="store.benchmarkRunning()"
          [marksDimmed]="othersChanged(index)"
          (valueChange)="setParam(index, $event)"
        />
      }
      <button
        type="button"
        class="reset"
        [disabled]="store.benchmarkRunning() || atDefaults()"
        (click)="store.resetParams()"
      >
        Reset
      </button>
    </section>
  `,
  styles: `
    .panel {
      position: fixed;
      bottom: 16px;
      display: flex;
      gap: 4px;
      padding: 6px;
      background: rgb(12 16 15 / 0.8);
      border: 1px solid var(--line);
      border-radius: 8px;
    }
    .params {
      left: 16px;
      bottom: 16px;
      width: 320px;
      flex-direction: column;
      gap: 8px;
      padding: 10px 12px;
      color: var(--muted);
      font:
        14px/1.4 ui-monospace,
        monospace;
    }
    .reset {
      align-self: flex-end;
    }
    button {
      padding: 6px 12px;
      border: 1px solid transparent;
      border-radius: 6px;
      background: none;
      color: var(--muted);
      font:
        14px/1.4 ui-monospace,
        monospace;
      cursor: pointer;
    }
    button:disabled {
      cursor: progress;
    }
    button:hover {
      color: var(--fg);
    }
  `,
})
export class ControlPanel {
  protected readonly store = inject(ViewerStore);
  protected readonly preset = computed(() => findAttractor(this.store.attractorId()));
  protected readonly atDefaults = computed(() =>
    this.store.params().every((value, index) => value === this.preset().params[index].value),
  );

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
