import { Injectable, linkedSignal, signal } from '@angular/core';
import { ATTRACTORS, findAttractor } from '../engine/attractors/registry';
import { BenchmarkReport, EngineStats } from '../engine/engine';
import { ColorMode, DEFAULT_QUALITY, hasQuality } from '../engine/settings';

@Injectable({ providedIn: 'root' })
export class ViewerStore {
  readonly attractorId = signal(ATTRACTORS[0].id);
  readonly params = linkedSignal(() =>
    findAttractor(this.attractorId()).params.map(({ value }) => value),
  );
  private readonly requestedQuality = requestedQuality();
  readonly qualityPinned = this.requestedQuality !== null;
  readonly qualityId = signal(this.requestedQuality ?? DEFAULT_QUALITY);
  readonly colorMode = signal<ColorMode>('speed');
  readonly stats = signal<EngineStats | null>(null);
  readonly benchmark = signal<BenchmarkReport | null>(null);
  readonly benchmarkRunning = signal(false);
}

function requestedQuality(): string | null {
  const requested = new URLSearchParams(window.location.search).get('quality');
  return requested !== null && hasQuality(requested) ? requested : null;
}
