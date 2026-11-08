import { inject, Injectable, signal } from '@angular/core';
import { EngineHost, INTRO_ZOOM } from './engine-host';
import { ViewerStore } from './viewer-store';

const FLIGHT_MS = 1200;
const CALM_MS = 400;

@Injectable({ providedIn: 'root' })
export class Intro {
  private readonly store = inject(ViewerStore);
  private readonly host = inject(EngineHost);
  private readonly running = signal(false);
  readonly leaving = this.running.asReadonly();

  begin(): void {
    const engine = this.host.engine();
    if (!engine || this.host.error() || this.running()) {
      return;
    }
    this.running.set(true);
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (calm) {
      engine.glideZoom(1, 1, 0);
    } else {
      engine.glideZoom(INTRO_ZOOM, 1, FLIGHT_MS / 1000);
    }
    setTimeout(
      () => {
        this.store.phase.set('select');
        this.running.set(false);
      },
      calm ? CALM_MS : FLIGHT_MS,
    );
  }
}
