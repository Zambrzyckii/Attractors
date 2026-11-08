import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { EngineHost } from './engine-host';
import { Intro } from './intro';
import { ViewerStore } from './viewer-store';

@Injectable({ providedIn: 'root' })
export class Shortcuts {
  private readonly store = inject(ViewerStore);
  private readonly host = inject(EngineHost);
  private readonly router = inject(Router);
  private readonly intro = inject(Intro);

  handle(event: KeyboardEvent): void {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    if (this.store.phase() === 'start') {
      this.handleStart(event);
      return;
    }
    if (this.store.phase() === 'select' && event.code !== 'KeyF') {
      return;
    }
    const idle = !this.store.benchmarkRunning();
    switch (event.code) {
      case 'KeyB':
        this.host.engine()?.blowUpParticles();
        break;
      case 'KeyH':
        if (!this.router.url.startsWith('/statistics')) {
          this.store.uiHidden.update((hidden) => !hidden);
        }
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

  private handleStart(event: KeyboardEvent): void {
    if (this.host.error()) {
      return;
    }
    this.intro.begin();
    if (event.code === 'KeyF') {
      toggleFullscreen();
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
