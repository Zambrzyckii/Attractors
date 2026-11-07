import { Injectable, signal } from '@angular/core';
import { ATTRACTORS } from '../engine/attractors/registry';
import { BenchmarkReport, EngineStats } from '../engine/engine';
import { DEFAULT_QUALITY, hasQuality } from '../engine/settings';

@Injectable({ providedIn: 'root' })
export class ViewerStore {
  readonly attractorId = signal(ATTRACTORS[0].id);
  private readonly requestedQuality = requestedQuality();
  readonly qualityPinned = this.requestedQuality !== null;
  readonly qualityId = signal(this.requestedQuality ?? DEFAULT_QUALITY);
  readonly stats = signal<EngineStats | null>(null);
  readonly benchmark = signal<BenchmarkReport | null>(null);
  readonly benchmarkRunning = signal(false);
}

function requestedQuality(): string | null {
  const requested = new URLSearchParams(window.location.search).get('quality');
  return requested !== null && hasQuality(requested) ? requested : null;
}
