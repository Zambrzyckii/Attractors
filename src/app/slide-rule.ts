import { Component, computed, input } from '@angular/core';
import { AttractorParam } from '../engine/attractors/attractor';
import { SCALE_SPAN_PX, STEPS, scaleTicks, toPosition } from './param-scale';

const WINDOW_WIDTH = 300;
const WINDOW_HEIGHT = 40;
const BASELINE = 14;
const MINOR_TICK = 4;
const MAJOR_TICK = 8;
const LABEL_Y = 37;
const MARK_HALF = 4;
const MARK_TOP = 9;
const MARK_TIP = 2;
const TITLE_REACH = 84;

@Component({
  selector: 'app-slide-rule',
  template: `
    <div class="window">
      <svg
        [attr.width]="width"
        [attr.height]="height"
        [attr.viewBox]="'0 0 ' + width + ' ' + height"
        [style.transform]="'translateX(' + -offset() + 'px)'"
        aria-hidden="true"
      >
        <line
          class="base"
          [attr.x1]="start"
          [attr.x2]="end"
          [attr.y1]="baseline"
          [attr.y2]="baseline"
        />
        @for (x of scale().minor; track x) {
          <line
            class="minor"
            [attr.x1]="x"
            [attr.x2]="x"
            [attr.y1]="baseline"
            [attr.y2]="minorEnd"
          />
        }
        @for (tick of scale().major; track tick.label) {
          <line
            class="major"
            [attr.x1]="tick.x"
            [attr.x2]="tick.x"
            [attr.y1]="baseline"
            [attr.y2]="majorEnd"
          />
          <text [attr.x]="tick.x" [attr.y]="labelY">{{ tick.label }}</text>
        }
        <g class="marks" [class.dimmed]="marksDimmed()">
          @for (mark of marks(); track mark.x) {
            <path [attr.d]="mark.path" />
          }
        </g>
      </svg>
      <i class="cursor"></i>
    </div>
    @if (title(); as title) {
      <span
        class="title"
        [class.dimmed]="marksDimmed()"
        [style.left]="'calc(50% + ' + title.dx + 'px)'"
        >{{ title.text }}</span
      >
    }
  `,
  styles: `
    .window {
      position: relative;
      width: var(--rule-width, 300px);
      height: 40px;
      overflow: hidden;
      mask: linear-gradient(90deg, transparent, #000 22%, #000 78%, transparent);
    }
    svg {
      position: absolute;
      top: 0;
      left: calc(50% - 150px);
    }
    .base {
      stroke: var(--hair);
    }
    .minor {
      stroke: var(--ink);
      stroke-opacity: 0.35;
    }
    .major {
      stroke: var(--ink);
      stroke-opacity: 0.7;
    }
    text {
      fill: var(--mute);
      font: italic 300 13px var(--serif);
      text-anchor: middle;
    }
    path {
      fill: var(--gold);
    }
    .title {
      position: absolute;
      bottom: 100%;
      margin-bottom: 2px;
      color: var(--dim);
      font: italic 400 12px var(--serif);
      white-space: nowrap;
      transform: translateX(-50%);
    }
    .dimmed {
      opacity: 0.35;
    }
    .cursor {
      position: absolute;
      top: 2px;
      bottom: 2px;
      left: 50%;
      width: 2px;
      margin-left: -1px;
      background: var(--gold);
      box-shadow: 0 0 8px rgb(232 200 138 / 0.7);
    }
  `,
})
export class SlideRule {
  readonly param = input.required<AttractorParam>();
  readonly value = input.required<number>();
  readonly marksDimmed = input(false);
  protected readonly width = WINDOW_WIDTH + SCALE_SPAN_PX;
  protected readonly height = WINDOW_HEIGHT;
  protected readonly start = WINDOW_WIDTH / 2;
  protected readonly end = WINDOW_WIDTH / 2 + SCALE_SPAN_PX;
  protected readonly baseline = BASELINE;
  protected readonly minorEnd = BASELINE + MINOR_TICK;
  protected readonly majorEnd = BASELINE + MAJOR_TICK;
  protected readonly labelY = LABEL_Y;
  protected readonly scale = computed(() => {
    const param = this.param();
    const { major, minor } = scaleTicks(param);
    return {
      minor: minor.map((value) => scaleX(param, value)),
      major: major.map(({ value, label }) => ({ x: scaleX(param, value), label })),
    };
  });
  protected readonly offset = computed(() => scaleX(this.param(), this.value()) - this.start);
  protected readonly marks = computed(() => {
    const param = this.param();
    return (param.marks ?? []).map(({ value, title }) => {
      const x = scaleX(param, value);
      const top = BASELINE - MARK_TOP;
      const path = `M${x - MARK_HALF},${top} L${x + MARK_HALF},${top} L${x},${BASELINE - MARK_TIP} Z`;
      return { x, title, path };
    });
  });
  protected readonly title = computed(() => {
    const cursor = this.start + this.offset();
    const nearest = this.marks()
      .map((mark) => ({ text: mark.title, dx: mark.x - cursor }))
      .sort((a, b) => Math.abs(a.dx) - Math.abs(b.dx))[0];
    return nearest && Math.abs(nearest.dx) <= TITLE_REACH ? nearest : null;
  });
}

function scaleX(param: AttractorParam, value: number): number {
  return WINDOW_WIDTH / 2 + (toPosition(param, value) / STEPS) * SCALE_SPAN_PX;
}
