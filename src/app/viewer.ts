import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { EngineHost } from './engine-host';
import { Hud } from './hud';
import { ParamLine } from './param-line';
import { Seismograph } from './seismograph';
import { ViewerHeader } from './viewer-header';
import { ViewerStore } from './viewer-store';

@Component({
  selector: 'app-viewer',
  imports: [Hud, ParamLine, Seismograph, ViewerHeader],
  template: `
    <canvas #canvas></canvas>
    @if (!store.uiHidden()) {
      <app-viewer-header />
      <app-param-line />
      <app-seismograph />
      @if (host.caps(); as caps) {
        <app-hud [renderer]="caps.renderer" (benchmark)="host.runBenchmark()" />
      }
    }
    @if (host.error(); as message) {
      <p class="error">{{ message }}</p>
    }
  `,
  styles: `
    canvas {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
      touch-action: none;
      cursor: grab;
    }
    canvas:active {
      cursor: grabbing;
    }
    .error {
      position: fixed;
      top: 16px;
      left: 16px;
      margin: 0;
      color: var(--warn);
      font-size: 17px;
      font-family: ui-monospace, monospace;
      white-space: pre-wrap;
    }
  `,
})
export class Viewer {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  protected readonly store = inject(ViewerStore);
  protected readonly host = inject(EngineHost);

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => this.host.dispose());
    afterNextRender(async () => {
      await this.host.start(this.canvas().nativeElement);
      const engine = this.host.engine();
      if (engine && !destroyRef.destroyed) {
        const onKeyDown = (event: KeyboardEvent) => {
          if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
            return;
          }
          const idle = !this.store.benchmarkRunning();
          switch (event.code) {
            case 'KeyB':
              engine.blowUpParticles();
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
        };
        window.addEventListener('keydown', onKeyDown);
        destroyRef.onDestroy(() => window.removeEventListener('keydown', onKeyDown));
      }
    });
  }
}

function toggleFullscreen(): void {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
  } else {
    void document.documentElement.requestFullscreen();
  }
}
