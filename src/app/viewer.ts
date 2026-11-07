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
import { AttractorEngine } from '../engine/engine';
import { measureRefreshRate } from '../engine/frame-clock';
import { defaultQualityFor } from '../engine/settings';
import { ControlPanel } from './control-panel';
import { Hud } from './hud';
import { ViewerStore } from './viewer-store';

@Component({
  selector: 'app-viewer',
  imports: [ControlPanel, Hud],
  template: `
    <canvas #canvas></canvas>
    <app-control-panel />
    @if (renderer(); as renderer) {
      <app-hud [renderer]="renderer" (benchmark)="runBenchmark()" />
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
  private readonly store = inject(ViewerStore);
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
        effect(() => engine.setAttractor(this.store.attractorId()), { injector });
        effect(() => engine.setQuality(this.store.qualityId()), { injector });
        const onKeyDown = (event: KeyboardEvent) => {
          if (event.code === 'KeyB') {
            engine.blowUpParticles();
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
