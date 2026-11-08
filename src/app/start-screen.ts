import {
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  untracked,
  viewChildren,
} from '@angular/core';
import { ATTRACTORS } from '../engine/attractors/registry';
import { AttractorEngine } from '../engine/engine';
import { EngineHost } from './engine-host';
import { Intro } from './intro';

const FIGURE_QUALITY = 'tiny';

@Component({
  selector: 'app-start-screen',
  host: { '(click)': 'intro.begin()', '[class.leaving]': 'leaving()' },
  template: `
    <h1>Attractors</h1>
    @for (attractor of attractors; track attractor.id; let index = $index) {
      <figure [style.left.%]="20 * (index + 1)">
        <canvas #figure></canvas>
        <figcaption>{{ attractor.name }}</figcaption>
      </figure>
    }
    @if (host.error(); as message) {
      <p class="error">{{ message }}</p>
    } @else {
      <p class="prompt">{{ prompt }}</p>
    }
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      cursor: pointer;
    }
    h1 {
      position: absolute;
      top: 16%;
      right: 0;
      left: 0;
      margin: 0;
      font: italic 200 132px/1 var(--serif);
      text-align: center;
      transform: translateY(-50%);
    }
    figure {
      position: absolute;
      top: 62%;
      width: 17vw;
      margin: 0;
      transform: translate(-50%, -50%);
    }
    canvas {
      display: block;
      width: 17vw;
      height: 17vw;
      pointer-events: none;
      mask-image: radial-gradient(closest-side, #000 62%, transparent);
    }
    figcaption {
      color: var(--dim);
      font: italic 15px var(--serif);
      text-align: center;
    }
    p {
      position: absolute;
      right: 0;
      left: 0;
      margin: 0 auto;
      font: 15px var(--mono);
      text-align: center;
    }
    .prompt {
      top: 89%;
      color: var(--mute);
      animation: breathe 2.6s ease-in-out infinite;
    }
    .error {
      top: 28%;
      max-width: 60ch;
      color: var(--warn);
      white-space: pre-wrap;
    }
    @keyframes breathe {
      50% {
        opacity: 0.35;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .prompt {
        animation: none;
      }
    }
  `,
})
export class StartScreen {
  readonly leaving = input(false);
  protected readonly intro = inject(Intro);
  protected readonly host = inject(EngineHost);
  protected readonly attractors = ATTRACTORS;
  protected readonly prompt = matchMedia('(pointer: coarse)').matches
    ? 'Tap to begin'
    : 'Press any key to begin';
  private readonly canvases = viewChildren<ElementRef<HTMLCanvasElement>>('figure');
  private engines: AttractorEngine[] = [];
  private started = false;

  constructor() {
    effect(() => {
      const canvases = this.canvases();
      if (this.started || !this.host.refreshMeasured() || canvases.length === 0) {
        return;
      }
      this.started = true;
      this.engines = untracked(() => canvases.flatMap((ref, index) => startFigure(ref, index)));
    });
    inject(DestroyRef).onDestroy(() => this.engines.forEach((engine) => engine.dispose()));
  }
}

function startFigure(ref: ElementRef<HTMLCanvasElement>, index: number): AttractorEngine[] {
  try {
    const engine = new AttractorEngine(ref.nativeElement, FIGURE_QUALITY);
    engine.setAttractor(ATTRACTORS[index].id);
    engine.start();
    return [engine];
  } catch {
    return [];
  }
}
