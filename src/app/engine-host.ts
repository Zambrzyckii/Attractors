import { computed, effect, EffectRef, inject, Injectable, Injector, signal } from '@angular/core';
import { findAttractor } from '../engine/attractors/registry';
import { AttractorEngine } from '../engine/engine';
import { measureRefreshRate } from '../engine/frame-clock';
import { defaultQualityFor } from '../engine/settings';
import { ViewerStore } from './viewer-store';

@Injectable({ providedIn: 'root' })
export class EngineHost {
  private readonly store = inject(ViewerStore);
  private readonly injector = inject(Injector);
  private readonly current = signal<AttractorEngine | null>(null);
  private readonly failure = signal<string | null>(null);
  private readonly measured = signal(false);
  private effects: EffectRef[] = [];
  private generation = 0;
  readonly engine = this.current.asReadonly();
  readonly caps = computed(() => this.current()?.caps ?? null);
  readonly error = this.failure.asReadonly();
  readonly refreshMeasured = this.measured.asReadonly();

  async start(canvas: HTMLCanvasElement): Promise<void> {
    const generation = ++this.generation;
    if (!this.store.qualityPinned) {
      this.store.qualityId.set(defaultQualityFor(await measureRefreshRate()));
      if (generation !== this.generation) {
        return;
      }
    }
    this.measured.set(true);
    try {
      const engine = new AttractorEngine(canvas, this.store.qualityId());
      engine.onStats((stats) => this.store.stats.set(stats));
      engine.start();
      this.current.set(engine);
      const injector = this.injector;
      this.effects = [
        effect(
          () => {
            const preset = findAttractor(this.store.attractorId());
            const values = this.store.params();
            engine.setAttractor(preset.id);
            preset.params.forEach(({ name }, index) => engine.setParam(name, values[index]));
          },
          { injector },
        ),
        effect(() => engine.setQuality(this.store.qualityId()), { injector }),
        effect(() => engine.setColorMode(this.store.colorMode()), { injector }),
      ];
    } catch (cause) {
      this.failure.set(cause instanceof Error ? cause.message : String(cause));
    }
  }

  async runBenchmark(): Promise<void> {
    const engine = this.current();
    if (!engine || this.store.benchmarkRunning()) {
      return;
    }
    this.store.benchmarkRunning.set(true);
    try {
      this.store.benchmark.set(await engine.benchmark());
    } finally {
      this.store.benchmarkRunning.set(false);
    }
  }

  dispose(): void {
    this.generation++;
    this.effects.forEach((ref) => ref.destroy());
    this.effects = [];
    this.current()?.dispose();
    this.current.set(null);
  }
}
