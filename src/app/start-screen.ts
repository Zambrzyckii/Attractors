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
      <figure [style.--i]="index">
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
      --size: 17vw;
      --dx: calc(20vw * var(--i) - 30vw);
      --dy: 12vh;
      position: absolute;
      top: 62%;
      left: calc(20% + 20% * var(--i));
      width: var(--size);
      margin: 0;
      transform: translate(-50%, -50%);
      transition:
        transform 1200ms cubic-bezier(0.33, 1, 0.68, 1),
        opacity 850ms ease-in;
    }
    :host(.leaving) figure {
      opacity: 0;
      transform: translate(calc(-50% + var(--dx) * 1.5), calc(-50% + var(--dy) * 1.5)) scale(2.2);
    }
    :host(.leaving) :is(h1, figcaption, p) {
      opacity: 0;
      animation: none;
      transition: opacity 300ms ease;
    }
    canvas {
      display: block;
      width: var(--size);
      height: var(--size);
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
    @media (max-width: 899px), (orientation: portrait) {
      h1 {
        font-size: clamp(48px, 12vw, 132px);
      }
    }
    @media (orientation: portrait) {
      figure {
        --size: min(38vw, 22vh);
        --column: mod(var(--i), 2);
        --row: round(down, var(--i) / 2, 1);
        --dx: calc(44vw * var(--column) - 22vw);
        --dy: calc(26vh * var(--row) - 10vh);
        top: calc(40% + 26% * var(--row));
        left: calc(28% + 44% * var(--column));
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .prompt {
        animation: none;
      }
      :host(.leaving) {
        opacity: 0;
        transition: opacity 400ms ease;
      }
      :host(.leaving) figure {
        transform: translate(-50%, -50%);
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
