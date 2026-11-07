import { Injectable, signal } from '@angular/core';
import { ATTRACTORS } from '../engine/attractors/registry';
import { BenchmarkReport, EngineStats } from '../engine/engine';
import { DEFAULT_QUALITY, hasQuality } from '../engine/settings';

@Injectable({ providedIn: 'root' })
export class ViewerStore {
  readonly attractorId = signal(ATTRACTORS[0].id);
  readonly qualityId = signal(initialQuality());
  readonly stats = signal<EngineStats | null>(null);
  readonly benchmark = signal<BenchmarkReport | null>(null);
  readonly benchmarkRunning = signal(false);
}

function initialQuality(): string {
  const requested = new URLSearchParams(window.location.search).get('quality');
  return requested !== null && hasQuality(requested) ? requested : DEFAULT_QUALITY;
}
