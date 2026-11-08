import { Component, computed, inject } from '@angular/core';
import { ATTRACTORS, findAttractor } from '../engine/attractors/registry';
import { COLOR_MODES, QUALITIES } from '../engine/settings';
import { ViewerStore } from './viewer-store';

@Component({
  selector: 'app-viewer-header',
  template: `
    <section class="system">
      <h1>{{ preset().name }}</h1>
      <nav aria-label="System">
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
    </section>
    <section class="options">
      <div role="group" aria-label="Colour">
        @for (mode of colorModes; track mode.id; let last = $last) {
          <button
            type="button"
            [disabled]="store.benchmarkRunning()"
            [attr.aria-pressed]="mode.id === store.colorMode()"
            (click)="store.colorMode.set(mode.id)"
          >
            {{ mode.name }}
          </button>
          @if (!last) {
            <span aria-hidden="true">/</span>
          }
        }
      </div>
      <div role="group" aria-label="Quality">
        @for (quality of qualities; track quality.id; let last = $last) {
          <button
            type="button"
            [disabled]="store.benchmarkRunning()"
            [attr.aria-pressed]="quality.id === store.qualityId()"
            (click)="store.qualityId.set(quality.id)"
          >
            {{ quality.name }}
          </button>
          @if (!last) {
            <span aria-hidden="true">/</span>
          }
        }
      </div>
    </section>
  `,
  styles: `
    button {
      padding: 0;
      border: 0;
      background: none;
      color: var(--dim);
      cursor: pointer;
    }
    button:hover:not([aria-pressed='true']) {
      color: var(--mute);
    }
    button:disabled {
      cursor: progress;
    }
    .system {
      position: fixed;
      left: 30px;
      top: 58px;
    }
    h1 {
      margin: 0;
      font: italic 300 54px/1 var(--serif);
      letter-spacing: -0.01em;
    }
    nav {
      display: flex;
      gap: 18px;
      margin-top: 12px;
    }
    nav button {
      font: italic 400 20px var(--serif);
    }
    nav button[aria-pressed='true'] {
      color: var(--gold);
    }
    .options {
      position: fixed;
      right: 26px;
      top: 110px;
      display: grid;
      gap: 8px;
      justify-items: end;
    }
    .options div {
      display: flex;
      gap: 8px;
      color: var(--dim);
      font: 14px var(--mono);
    }
    .options button {
      font: inherit;
      text-transform: lowercase;
    }
    .options button[aria-pressed='true'] {
      color: var(--ink);
    }
  `,
})
export class ViewerHeader {
  protected readonly store = inject(ViewerStore);
  protected readonly attractors = ATTRACTORS;
  protected readonly colorModes = COLOR_MODES;
  protected readonly qualities = QUALITIES;
  protected readonly preset = computed(() => findAttractor(this.store.attractorId()));
}
