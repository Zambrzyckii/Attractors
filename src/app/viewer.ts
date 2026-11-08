import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { EngineHost } from './engine-host';
import { Hud } from './hud';
import { ParamLine } from './param-line';
import { Seismograph } from './seismograph';
import { Shortcuts } from './shortcuts';
import { ViewerHeader } from './viewer-header';
import { ViewerStore } from './viewer-store';

@Component({
  selector: 'app-viewer',
  imports: [Hud, ParamLine, Seismograph, ViewerHeader],
  host: { '(window:keydown)': 'shortcuts.handle($event)' },
  template: `
    <canvas #canvas></canvas>
    @if (!store.uiHidden()) {
      <app-viewer-header />
      <app-param-line />
      <app-seismograph />
      @if (host.caps(); as caps) {
        <app-hud [renderer]="caps.renderer" (benchmark)="host.runBenchmark()" />
      }
    }
    @if (host.error(); as message) {
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
  protected readonly store = inject(ViewerStore);
  protected readonly host = inject(EngineHost);

  protected readonly shortcuts = inject(Shortcuts);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.host.dispose());
    afterNextRender(() => this.host.start(this.canvas().nativeElement));
  }
}
