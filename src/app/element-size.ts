import { DestroyRef, ElementRef, inject, Signal, signal } from '@angular/core';

export interface ElementSize {
  width: number;
  height: number;
}

export function elementSize(initial: ElementSize): Signal<ElementSize> {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const size = signal(initial);
  const observer = new ResizeObserver(([entry]) =>
    size.set({ width: entry.contentRect.width, height: entry.contentRect.height }),
  );
  observer.observe(host);
  inject(DestroyRef).onDestroy(() => observer.disconnect());
  return size.asReadonly();
}
