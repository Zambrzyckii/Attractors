import { inject, Injectable } from '@angular/core';
import { EngineHost } from './engine-host';
import { ViewerStore } from './viewer-store';

@Injectable({ providedIn: 'root' })
export class Shortcuts {
  private readonly store = inject(ViewerStore);
  private readonly host = inject(EngineHost);

  handle(event: KeyboardEvent): void {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    const idle = !this.store.benchmarkRunning();
    switch (event.code) {
      case 'KeyB':
        this.host.engine()?.blowUpParticles();
        break;
      case 'KeyH':
        this.store.uiHidden.update((hidden) => !hidden);
        break;
      case 'KeyR':
        if (idle) {
          this.store.resetParams();
        }
        break;
      case 'KeyN':
        if (idle) {
          this.store.nextAttractor();
        }
        break;
      case 'KeyF':
        toggleFullscreen();
        break;
    }
  }
}

export function toggleFullscreen(): void {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
  } else {
    void document.documentElement.requestFullscreen();
  }
}
