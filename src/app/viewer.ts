import { Component, inject } from '@angular/core';
import { ParamLine } from './param-line';
import { Seismograph } from './seismograph';
import { ViewerHeader } from './viewer-header';
import { ViewerStore } from './viewer-store';

@Component({
  selector: 'app-viewer',
  imports: [ParamLine, Seismograph, ViewerHeader],
  template: `
    @if (!store.uiHidden()) {
      <app-viewer-header />
      <app-param-line />
      <app-seismograph />
    }
  `,
})
export class Viewer {
  protected readonly store = inject(ViewerStore);
}
