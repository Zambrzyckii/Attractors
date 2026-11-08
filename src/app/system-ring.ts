import { Component, computed, effect, ElementRef, inject, signal } from '@angular/core';
import { ATTRACTORS } from '../engine/attractors/registry';
import { ViewerStore } from './viewer-store';

const COUNT = ATTRACTORS.length;
const FRONT_ANGLE = 90;
const SETTLE_MS = 300;

@Component({
  selector: 'app-system-ring',
  host: { '(document:keydown)': 'onKey($event)' },
  template: `
    <p class="mark">Attractors</p>
    <div class="ring">
      <div class="ellipse"></div>
      @for (attractor of attractors; track attractor.id; let index = $index) {
        <button
          type="button"
          [class.front]="index === front()"
          [style.--a]="angle(index)"
          (focus)="onFocus($event, index)"
          (click)="choose(index)"
        >
          {{ attractor.name }}
        </button>
      }
    </div>
    <p class="hint">
      <kbd class="kbd">←</kbd> <kbd class="kbd">→</kbd> turn · <kbd class="kbd">Enter</kbd> open
    </p>
  `,
  styles: `
    .mark {
      position: fixed;
      top: 22px;
      left: 30px;
      margin: 0;
      color: var(--mute);
      font: italic 300 22px/1.2 var(--serif);
    }
    .ring {
      position: fixed;
      inset: 0;
      transform: rotate(-8deg);
      transform-origin: 50% 52%;
      pointer-events: none;
    }
    .ellipse {
      position: absolute;
      top: 52%;
      left: 50%;
      width: 75vw;
      height: 46vh;
      border: 1px solid var(--hair);
      border-radius: 50%;
      transform: translate(-50%, -50%);
    }
    button {
      --near: pow((1 + sin(var(--a))) / 2, 1.6);
      position: absolute;
      top: calc(52% + sin(var(--a)) * 23vh);
      left: calc(50% + cos(var(--a)) * 37.5vw);
      padding: 0;
      border: 0;
      background: none;
      color: var(--ink);
      font: italic 300 calc(20px + 34px * var(--near)) / 1 var(--serif);
      white-space: nowrap;
      opacity: calc(0.3 + 0.7 * var(--near));
      transform: translate(-50%, -50%) rotate(8deg);
      transition: --a 450ms ease;
      cursor: pointer;
      pointer-events: auto;
    }
    button::before {
      content: '';
      position: absolute;
      top: -12px;
      left: 50%;
      width: 5px;
      height: 5px;
      margin-left: -2.5px;
      border-radius: 50%;
      background: currentColor;
    }
    .front {
      color: var(--gold);
    }
    .hint {
      position: fixed;
      right: 0;
      bottom: 22px;
      left: 0;
      margin: 0;
      color: var(--dim);
      font: 13px var(--mono);
      text-align: center;
    }
    @media (prefers-reduced-motion: reduce) {
      button {
        transition: none;
      }
    }
  `,
})
export class SystemRing {
  private readonly store = inject(ViewerStore);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly attractors = ATTRACTORS;
  private readonly turns = signal(
    ATTRACTORS.findIndex(({ id }) => id === this.store.attractorId()),
  );
  protected readonly front = computed(() => mod(this.turns(), COUNT));

  constructor() {
    effect((onCleanup) => {
      const id = ATTRACTORS[this.front()].id;
      const timer = setTimeout(() => this.store.attractorId.set(id), SETTLE_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected angle(index: number): string {
    return `${FRONT_ANGLE + ((index - this.turns()) * 360) / COUNT}deg`;
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    switch (event.code) {
      case 'ArrowLeft':
        this.turns.update((turns) => turns - 1);
        break;
      case 'ArrowRight':
      case 'KeyN':
        this.turns.update((turns) => turns + 1);
        break;
      case 'Enter':
      case 'NumpadEnter':
      case 'Space':
        if (!this.isRingButton(event.target)) {
          event.preventDefault();
          this.open();
        }
        break;
    }
  }

  protected onFocus(event: FocusEvent, index: number): void {
    if ((event.target as HTMLElement).matches(':focus-visible')) {
      this.turnTo(index);
    }
  }

  protected choose(index: number): void {
    if (index === this.front()) {
      this.open();
    } else {
      this.turnTo(index);
    }
  }

  private turnTo(index: number): void {
    const delta = mod(index - this.front() + COUNT / 2, COUNT) - COUNT / 2;
    this.turns.update((turns) => turns + delta);
  }

  private open(): void {
    this.store.attractorId.set(ATTRACTORS[this.front()].id);
    this.store.phase.set('view');
  }

  private isRingButton(target: EventTarget | null): boolean {
    return target instanceof HTMLButtonElement && this.element.contains(target);
  }
}

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
