import { Component, inject } from '@angular/core';
import { EngineHost } from './engine-host';
import { Hud } from './hud';
import { ParamLine } from './param-line';
import { Seismograph } from './seismograph';
import { ViewerHeader } from './viewer-header';
import { ViewerStore } from './viewer-store';

@Component({
  selector: 'app-viewer',
  imports: [Hud, ParamLine, Seismograph, ViewerHeader],
  template: `
    @if (!store.uiHidden()) {
      <app-viewer-header />
      <app-param-line />
      <app-seismograph />
      @if (host.caps(); as caps) {
        <app-hud [renderer]="caps.renderer" (benchmark)="host.runBenchmark()" />
      }
    }
  `,
})
export class Viewer {
  protected readonly store = inject(ViewerStore);
  protected readonly host = inject(EngineHost);
}
