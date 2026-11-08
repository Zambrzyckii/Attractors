import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { EngineHost } from './engine-host';
import { Shortcuts } from './shortcuts';
import { TopBar } from './top-bar';
import { ViewerStore } from './viewer-store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopBar],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: { '(window:keydown)': 'shortcuts.handle($event)' },
})
export class App {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly router = inject(Router);
  protected readonly host = inject(EngineHost);
  protected readonly shortcuts = inject(Shortcuts);
  protected readonly store = inject(ViewerStore);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  protected readonly onStatistics = computed(() => this.url().startsWith('/statistics'));

  constructor() {
    inject(DestroyRef).onDestroy(() => this.host.dispose());
    afterNextRender(() => this.host.start(this.canvas().nativeElement));
  }
}
