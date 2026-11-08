import { Injectable, linkedSignal, signal } from '@angular/core';
import { ATTRACTORS, findAttractor } from '../engine/attractors/registry';
import { BenchmarkReport, EngineStats } from '../engine/engine';
import { ColorMode, DEFAULT_QUALITY, hasQuality } from '../engine/settings';

export type Phase = 'start' | 'select' | 'view';

@Injectable({ providedIn: 'root' })
export class ViewerStore {
  readonly phase = signal<Phase>(initialPhase());
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
  readonly uiHidden = signal(false);

  resetParams(): void {
    this.params.set(findAttractor(this.attractorId()).params.map(({ value }) => value));
  }

  nextAttractor(): void {
    const index = ATTRACTORS.findIndex(({ id }) => id === this.attractorId());
    this.attractorId.set(ATTRACTORS[(index + 1) % ATTRACTORS.length].id);
  }
}

function initialPhase(): Phase {
  const { pathname, search } = window.location;
  const skip = new URLSearchParams(search).get('start') === 'skip';
  return skip || pathname.startsWith('/statistics') ? 'view' : 'select';
}

function requestedQuality(): string | null {
  const requested = new URLSearchParams(window.location.search).get('quality');
  return requested !== null && hasQuality(requested) ? requested : null;
}
