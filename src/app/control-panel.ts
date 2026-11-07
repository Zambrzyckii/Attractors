import { Component, inject } from '@angular/core';
import { ATTRACTORS } from '../engine/attractors/registry';
import { ViewerStore } from './viewer-store';

@Component({
  selector: 'app-control-panel',
  template: `
    <nav class="panel" aria-label="Attractor">
      @for (attractor of attractors; track attractor.id) {
        <button
          type="button"
          [attr.aria-pressed]="attractor.id === store.attractorId()"
          (click)="store.attractorId.set(attractor.id)"
        >
          {{ attractor.name }}
        </button>
      }
    </nav>
  `,
  styles: `
    .panel {
      position: fixed;
      bottom: 16px;
      left: 16px;
      display: flex;
      gap: 4px;
      padding: 6px;
      background: rgb(12 16 15 / 0.8);
      border: 1px solid var(--line);
      border-radius: 8px;
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
}
