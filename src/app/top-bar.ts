import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ViewerStore } from './viewer-store';

@Component({
  selector: 'app-top-bar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <button
      type="button"
      class="mark"
      [disabled]="store.benchmarkRunning()"
      (click)="openSelect()"
    >
      Attractors
    </button>
    <nav aria-label="Pages">
      <a
        routerLink="/"
        routerLinkActive="active"
        ariaCurrentWhenActive="page"
        [routerLinkActiveOptions]="{ exact: true }"
        >Viewer</a
      >
      <a routerLink="/statistics" routerLinkActive="active" ariaCurrentWhenActive="page"
        >Statistics</a
      >
    </nav>
  `,
  styles: `
    .mark {
      position: fixed;
      top: 22px;
      left: 30px;
      padding: 0;
      border: 0;
      background: none;
      color: var(--mute);
      font: italic 300 22px/1.2 var(--serif);
      cursor: pointer;
    }
    .mark:hover:not(:disabled) {
      color: var(--ink);
    }
    .mark:disabled {
      cursor: progress;
    }
    nav {
      position: fixed;
      top: 24px;
      right: 26px;
      display: flex;
      gap: 22px;
      font: 14px var(--mono);
    }
    a {
      padding-bottom: 2px;
      border-bottom: 1px solid transparent;
      color: var(--mute);
      text-decoration: none;
    }
    a:hover {
      color: var(--ink);
    }
    .active {
      border-bottom-color: var(--gold);
      color: var(--ink);
    }
  `,
})
export class TopBar {
  protected readonly store = inject(ViewerStore);
  private readonly router = inject(Router);

  protected openSelect(): void {
    this.store.phase.set('select');
    void this.router.navigate(['/']);
  }
}
