import { Component, computed, input, output } from '@angular/core';
import { AttractorParam } from '../engine/attractors/attractor';

const STEPS = 1000;
const SNAP_STEPS = 10;

@Component({
  selector: 'app-param-slider',
  template: `
    <label>
      <span class="name">{{ param().label ?? param().name }}</span>
      <span class="track">
        <input
          type="range"
          min="0"
          [max]="steps"
          step="1"
          [value]="position()"
          [disabled]="disabled()"
          [attr.aria-valuetext]="format(value())"
          (input)="onInput($event)"
        />
        @for (mark of param().marks; track mark.value) {
          <span
            class="tick"
            [class.dimmed]="marksDimmed()"
            [style.left.%]="percent(mark.value)"
          ></span>
        }
        <span class="tick default" [style.left.%]="percent(param().value)"></span>
      </span>
      <output>{{ format(value()) }}</output>
    </label>
    @if (param().marks; as marks) {
      <div class="marks" [class.dimmed]="marksDimmed()">
        @for (mark of marks; track mark.value) {
          <button
            type="button"
            [title]="mark.title"
            [disabled]="disabled()"
            (click)="valueChange.emit(mark.value)"
          >
            {{ format(mark.value) }}
          </button>
        }
      </div>
    }
  `,
  styles: `
    label {
      display: grid;
      grid-template-columns: 2ch 1fr 7ch;
      align-items: center;
      gap: 8px;
    }
    .track {
      position: relative;
    }
    input {
      width: 100%;
      margin: 0;
      accent-color: var(--fg);
    }
    .tick {
      position: absolute;
      top: -4px;
      width: 1px;
      height: 6px;
      background: var(--muted);
      pointer-events: none;
    }
    .tick.default {
      background: var(--fg);
    }
    output {
      text-align: right;
    }
    .marks {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin: 4px 0 0 calc(2ch + 8px);
    }
    .dimmed {
      opacity: 0.35;
    }
    button {
      padding: 2px 6px;
      border: 1px solid var(--line);
      border-radius: 4px;
      background: none;
      color: var(--muted);
      font: inherit;
      cursor: pointer;
    }
    button:hover {
      color: var(--fg);
    }
  `,
})
export class ParamSlider {
  readonly param = input.required<AttractorParam>();
  readonly value = input.required<number>();
  readonly disabled = input(false);
  readonly marksDimmed = input(false);
  readonly valueChange = output<number>();
  protected readonly steps = STEPS;
  protected readonly position = computed(() => this.toPosition(this.value()));

  protected onInput(event: Event): void {
    const position = Number((event.target as HTMLInputElement).value);
    const param = this.param();
    const snapped = Math.abs(position - this.toPosition(param.value)) <= SNAP_STEPS;
    this.valueChange.emit(snapped ? param.value : this.fromPosition(position));
  }

  protected percent(value: number): number {
    return (this.toPosition(value) / STEPS) * 100;
  }

  protected format(value: number): string {
    return String(Number(value.toPrecision(4)));
  }

  private toPosition(value: number): number {
    const { min, max, scale } = this.param();
    const fraction =
      scale === 'log' ? Math.log(value / min) / Math.log(max / min) : (value - min) / (max - min);
    return fraction * STEPS;
  }

  private fromPosition(position: number): number {
    const { min, max, scale } = this.param();
    const fraction = position / STEPS;
    return scale === 'log' ? min * (max / min) ** fraction : min + fraction * (max - min);
  }
}
