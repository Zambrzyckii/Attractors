import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-top-bar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <p class="mark">Attractors</p>
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
      margin: 0;
      color: var(--mute);
      font: italic 300 22px/1.2 var(--serif);
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
export class TopBar {}
