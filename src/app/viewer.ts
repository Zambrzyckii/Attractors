import { KeyValuePipe } from '@angular/common';
import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { AttractorEngine } from '../engine/engine';
import { GlCaps } from '../engine/gl/context';
import { ControlPanel } from './control-panel';
import { ViewerStore } from './viewer-store';

@Component({
  selector: 'app-viewer',
  imports: [ControlPanel, KeyValuePipe],
  template: `
    <canvas #canvas></canvas>
    <app-control-panel />
    @if (caps(); as caps) {
      <dl class="probe">
        <dt>Frame rate</dt>
        <dd>{{ fps() }} fps</dd>
        <dt>Renderer</dt>
        <dd>{{ caps.renderer }}</dd>
        <dt>Version</dt>
        <dd>{{ caps.version }}</dd>
        <dt>Max texture size</dt>
        <dd>{{ caps.maxTextureSize }}</dd>
        <dt>Max draw buffers</dt>
        <dd>{{ caps.maxDrawBuffers }}</dd>
        <dt>Point size range</dt>
        <dd>{{ caps.pointSizeRange[0] }} to {{ caps.pointSizeRange[1] }}</dd>
        @for (extension of caps.extensions | keyvalue; track extension.key) {
          <dt>{{ extension.key }}</dt>
          <dd [class.missing]="!extension.value">{{ extension.value ? 'yes' : 'no' }}</dd>
        }
      </dl>
    }
    @if (error(); as message) {
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
    .probe {
      position: fixed;
      top: 16px;
      left: 16px;
      margin: 0;
      padding: 12px 16px;
      display: grid;
      grid-template-columns: auto auto;
      gap: 4px 16px;
      background: rgb(12 16 15 / 0.8);
      border: 1px solid var(--line);
      border-radius: 8px;
      font:
        14px/1.4 ui-monospace,
        monospace;
    }
    dt {
      color: var(--muted);
    }
    dd {
      margin: 0;
    }
    .missing,
    .error {
      color: var(--warn);
    }
    .error {
      position: fixed;
      top: 16px;
      left: 16px;
      margin: 0;
      font-size: 17px;
      font-family: ui-monospace, monospace;
      white-space: pre-wrap;
    }
  `,
})
export class Viewer {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  protected readonly caps = signal<GlCaps | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly fps = signal(0);
  private readonly store = inject(ViewerStore);

  constructor() {
    const destroyRef = inject(DestroyRef);
    const injector = inject(Injector);
    afterNextRender(() => {
      try {
        const engine = new AttractorEngine(this.canvas().nativeElement);
        this.caps.set(engine.caps);
        engine.onStats((stats) => this.fps.set(Math.round(stats.fps)));
        engine.start();
        destroyRef.onDestroy(() => engine.dispose());
        effect(() => engine.setAttractor(this.store.attractorId()), { injector });
        const onKeyDown = (event: KeyboardEvent) => {
          if (event.code === 'KeyB') {
            engine.blowUpParticles();
          }
        };
        window.addEventListener('keydown', onKeyDown);
        destroyRef.onDestroy(() => window.removeEventListener('keydown', onKeyDown));
      } catch (cause) {
        this.error.set(cause instanceof Error ? cause.message : String(cause));
      }
    });
  }
}
