import { Component, computed, inject } from '@angular/core';
import { ATTRACTORS, findAttractor } from '../engine/attractors/registry';
import { QUALITIES } from '../engine/settings';
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
        (click)="reset()"
      >
        Reset
      </button>
    </section>
    <nav class="panel attractors" aria-label="Attractor">
      @for (attractor of attractors; track attractor.id) {
        <button
          type="button"
          [disabled]="store.benchmarkRunning()"
          [attr.aria-pressed]="attractor.id === store.attractorId()"
          (click)="store.attractorId.set(attractor.id)"
        >
          {{ attractor.name }}
        </button>
      }
    </nav>
    <nav class="panel quality" aria-label="Quality">
      @for (quality of qualities; track quality.id) {
        <button
          type="button"
          [disabled]="store.benchmarkRunning()"
          [attr.aria-pressed]="quality.id === store.qualityId()"
          (click)="store.qualityId.set(quality.id)"
        >
          {{ quality.name }}
        </button>
      }
    </nav>
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
    .attractors {
      left: 16px;
    }
    .params {
      left: 16px;
      bottom: 72px;
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
    .quality {
      right: 16px;
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
    button:hover,
    button[aria-pressed='true'] {
      color: var(--fg);
    }
    button[aria-pressed='true'] {
      border-color: var(--line);
    }
  `,
})
export class ControlPanel {
  protected readonly store = inject(ViewerStore);
  protected readonly attractors = ATTRACTORS;
  protected readonly qualities = QUALITIES;
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

  protected reset(): void {
    this.store.params.set(this.preset().params.map(({ value }) => value));
  }
}
