import { Component, computed, input } from '@angular/core';
import { FtleHistogram } from '../engine/passes/ftle-histogram';
import { elementSize } from './element-size';
import { formatValue, niceStep } from './param-scale';

const WIDTH = 470;
const HEIGHT = 92;
const BASE = HEIGHT - 16;
const BAR_SPACE = HEIGHT - 22;
const LABEL_Y = HEIGHT - 2;
const BREAK_Y = BASE - BAR_SPACE + 8;
const TICK_COUNT = 5;
const EDGE = 12;
const MEAN_LABEL_SPACE = 84;
const RANGE_TOLERANCE = 1e-9;

type Anchor = 'start' | 'middle' | 'end';

@Component({
  selector: 'app-ftle-histogram',
  template: `
    <figure>
      <svg [attr.width]="width()" [attr.height]="height" aria-hidden="true">
        @for (bar of chart().bars; track $index) {
          <rect
            [class.chaos]="bar.chaos"
            [class.overflow]="bar.overflow"
            [attr.x]="bar.x"
            [attr.y]="bar.y"
            [attr.width]="bar.width"
            [attr.height]="bar.height"
          />
          @if (bar.overflow) {
            <line
              class="break"
              [attr.x1]="bar.x"
              [attr.x2]="bar.x + bar.width"
              [attr.y1]="breakY"
              [attr.y2]="breakY"
            />
          }
        }
        @if (chart().zero; as zero) {
          <line class="zero" [attr.x1]="zero" [attr.x2]="zero" y1="0" [attr.y2]="base" />
        }
        <line class="mean" [attr.x1]="chart().mean.x" [attr.x2]="chart().mean.x" y1="0" [attr.y2]="base" />
        <text class="mean" [attr.x]="chart().mean.labelX" y="10" [attr.text-anchor]="chart().mean.anchor">
          mean {{ chart().mean.text }}
        </text>
        @for (tick of chart().ticks; track tick.label) {
          <text [attr.x]="tick.x" [attr.y]="labelY" [attr.text-anchor]="tick.anchor">{{ tick.label }}</text>
        }
      </svg>
      <figcaption>
        Finite-time exponent of every particle, blue converging, orange diverging.
      </figcaption>
    </figure>
  `,
  styles: `
    :host {
      display: block;
    }
    figure {
      margin: 0;
    }
    svg {
      display: block;
    }
    rect {
      fill: var(--order);
      opacity: 0.75;
    }
    rect.chaos {
      fill: var(--chaos);
    }
    .break {
      stroke: var(--bg);
      stroke-width: 2;
    }
    .zero {
      stroke: var(--hair);
    }
    line.mean {
      stroke: var(--gold);
      stroke-dasharray: 3 3;
    }
    text {
      fill: var(--dim);
      font: 12px var(--mono);
    }
    text.mean {
      fill: var(--gold);
    }
    figcaption {
      margin-top: 6px;
      color: var(--dim);
      font: italic 14px var(--serif);
    }
  `,
})
export class FtleHistogramChart {
  readonly histogram = input.required<FtleHistogram>();
  private readonly size = elementSize({ width: WIDTH, height: 0 });
  protected readonly width = computed(() => this.size().width);
  protected readonly height = HEIGHT;
  protected readonly base = BASE;
  protected readonly labelY = LABEL_Y;
  protected readonly breakY = BREAK_Y;
  protected readonly chart = computed(() => {
    const { range, counts, mean } = this.histogram();
    const width = this.width();
    const [min, max] = range;
    const x = (value: number) => ((value - min) / (max - min)) * width;
    const binWidth = width / counts.length;
    const tallest = Math.max(...counts.slice(1, -1)) || 1;
    const bars = counts.map((count, index) => {
      const height = Math.min(count / tallest, 1) * BAR_SPACE;
      const centre = min + (index + 0.5) * ((max - min) / counts.length);
      return {
        x: index * binWidth + 0.5,
        y: BASE - height,
        width: binWidth - 1,
        height,
        chaos: centre > 0,
        overflow: count > tallest,
      };
    });
    const meanX = Math.min(Math.max(x(mean), 0), width);
    const flip = meanX > width - MEAN_LABEL_SPACE;
    return {
      bars,
      zero: min < 0 && max > 0 ? x(0) : null,
      mean: {
        x: meanX,
        labelX: flip ? meanX - 5 : meanX + 5,
        anchor: (flip ? 'end' : 'start') as Anchor,
        text: mean.toFixed(3),
      },
      ticks: axisTicks(min, max).map((value) => ({
        x: x(value),
        label: formatValue(value),
        anchor: edgeAnchor(x(value), width),
      })),
    };
  });
}

function axisTicks(min: number, max: number): number[] {
  const step = niceStep(max - min, TICK_COUNT);
  const first = Math.ceil(min / step - RANGE_TOLERANCE);
  const last = Math.floor(max / step + RANGE_TOLERANCE);
  return Array.from({ length: last - first + 1 }, (_, index) => (first + index) * step);
}

function edgeAnchor(position: number, width: number): Anchor {
  if (position < EDGE) {
    return 'start';
  }
  return position > width - EDGE ? 'end' : 'middle';
}
