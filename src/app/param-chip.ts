import { Component, computed, input, output, signal } from '@angular/core';
import { AttractorParam } from '../engine/attractors/attractor';
import { SCALE_SPAN_PX, STEPS, formatValue, keyStep, snapDrag, toPosition } from './param-scale';
import { SlideRule } from './slide-rule';

const DISPLAY_DIGITS = 4;

interface DragStart {
  pointerX: number;
  position: number;
}

@Component({
  selector: 'app-param-chip',
  imports: [SlideRule],
  template: `
    <span
      class="chip"
      role="slider"
      [class.open]="open()"
      [attr.tabindex]="disabled() ? null : 0"
      [attr.aria-label]="param().name"
      [attr.aria-valuemin]="param().min"
      [attr.aria-valuemax]="param().max"
      [attr.aria-valuenow]="value()"
      [attr.aria-valuetext]="valueText()"
      [attr.aria-disabled]="disabled()"
      (pointerdown)="startDrag($event)"
      (pointermove)="drag($event)"
      (pointerup)="close()"
      (lostpointercapture)="close()"
      (focus)="open.set(true)"
      (blur)="close()"
      (keydown)="onKey($event)"
      (dblclick)="reset()"
    >
      <span class="symbol">{{ param().label ?? param().name }}</span>
      <span class="value">{{ display() }}</span>
    </span>
    @if (open()) {
      <app-slide-rule [param]="param()" [value]="value()" [marksDimmed]="marksDimmed()" />
    }
  `,
  styles: `
    :host {
      position: relative;
      display: inline-block;
    }
    .chip {
      display: flex;
      gap: 8px;
      align-items: baseline;
      padding-bottom: 3px;
      border-bottom: 1px dashed var(--hair);
      cursor: ew-resize;
      touch-action: none;
      user-select: none;
    }
    .chip[aria-disabled='true'] {
      cursor: progress;
    }
    .symbol {
      color: var(--dim);
      font: italic 300 22px var(--serif);
    }
    .value {
      color: var(--ink);
      font: 500 14px var(--mono);
    }
    .open {
      border-bottom-color: var(--gold);
    }
    .open .value {
      color: var(--gold);
    }
    app-slide-rule {
      position: absolute;
      top: -52px;
      left: 50%;
      transform: translateX(-50%);
    }
    @media (max-width: 899px), (orientation: portrait) {
      app-slide-rule {
        --rule-width: calc(100vw - 32px);
        position: fixed;
        top: auto;
        bottom: 150px;
        left: 16px;
        transform: none;
      }
    }
  `,
})
export class ParamChip {
  readonly param = input.required<AttractorParam>();
  readonly value = input.required<number>();
  readonly disabled = input(false);
  readonly marksDimmed = input(false);
  readonly valueChange = output<number>();
  protected readonly open = signal(false);
  protected readonly display = computed(() => this.value().toPrecision(DISPLAY_DIGITS));
  protected readonly valueText = computed(() => formatValue(this.value()));
  private dragStart: DragStart | null = null;

  protected startDrag(event: PointerEvent): void {
    if (this.disabled() || event.button !== 0) {
      return;
    }
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.dragStart = { pointerX: event.clientX, position: toPosition(this.param(), this.value()) };
    this.open.set(true);
  }

  protected drag(event: PointerEvent): void {
    if (!this.dragStart) {
      return;
    }
    const dx = event.clientX - this.dragStart.pointerX;
    this.valueChange.emit(
      snapDrag(this.param(), this.dragStart.position + (dx * STEPS) / SCALE_SPAN_PX),
    );
  }

  protected close(): void {
    this.dragStart = null;
    this.open.set(false);
  }

  protected onKey(event: KeyboardEvent): void {
    if (this.disabled() || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    if (event.key === 'Escape' && this.open()) {
      consume(event);
      this.close();
      return;
    }
    const next = keyStep(this.param(), this.value(), event.key, event.shiftKey);
    if (next !== null) {
      consume(event);
      this.open.set(true);
      this.valueChange.emit(next);
    }
  }

  protected reset(): void {
    if (!this.disabled()) {
      this.valueChange.emit(this.param().value);
    }
  }
}

function consume(event: Event): void {
  event.preventDefault();
  event.stopPropagation();
}
