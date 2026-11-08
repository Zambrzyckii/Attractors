import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { findAttractor } from '../engine/attractors/registry';
import { AttractorEngine } from '../engine/engine';
import { measureRefreshRate } from '../engine/frame-clock';
import { defaultQualityFor } from '../engine/settings';
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
      @if (renderer(); as renderer) {
        <app-hud [renderer]="renderer" (benchmark)="runBenchmark()" />
      }
    }
    @if (error(); as message) {
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
  protected readonly renderer = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly store = inject(ViewerStore);
  private engine: AttractorEngine | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);
    const injector = inject(Injector);
    afterNextRender(async () => {
      if (!this.store.qualityPinned) {
        this.store.qualityId.set(defaultQualityFor(await measureRefreshRate()));
        if (destroyRef.destroyed) {
          return;
        }
      }
      try {
        const engine = new AttractorEngine(this.canvas().nativeElement, this.store.qualityId());
        this.engine = engine;
        this.renderer.set(engine.caps.renderer);
        engine.onStats((stats) => this.store.stats.set(stats));
        engine.start();
        destroyRef.onDestroy(() => engine.dispose());
        effect(
          () => {
            const preset = findAttractor(this.store.attractorId());
            const values = this.store.params();
            engine.setAttractor(preset.id);
            preset.params.forEach(({ name }, index) => engine.setParam(name, values[index]));
          },
          { injector },
        );
        effect(() => engine.setQuality(this.store.qualityId()), { injector });
        effect(() => engine.setColorMode(this.store.colorMode()), { injector });
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
      } catch (cause) {
        this.error.set(cause instanceof Error ? cause.message : String(cause));
      }
    });
  }

  protected async runBenchmark(): Promise<void> {
    if (!this.engine || this.store.benchmarkRunning()) {
      return;
    }
    this.store.benchmarkRunning.set(true);
    try {
      this.store.benchmark.set(await this.engine.benchmark());
    } finally {
      this.store.benchmarkRunning.set(false);
    }
  }
}

function toggleFullscreen(): void {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
  } else {
    void document.documentElement.requestFullscreen();
  }
}
