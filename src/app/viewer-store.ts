import { Injectable, signal } from '@angular/core';
import { ATTRACTORS } from '../engine/attractors/registry';

@Injectable({ providedIn: 'root' })
export class ViewerStore {
  readonly attractorId = signal(ATTRACTORS[0].id);
}
