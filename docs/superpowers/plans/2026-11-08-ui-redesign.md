# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the default-looking controls with the agreed visual system and add the start screen, the selection
ring and a live Statistics page, without touching the simulation.

**Architecture:** The root `App` becomes a shell that owns the main canvas and engine through a root `EngineHost`
service, so the engine outlives route changes. Start, Select and the viewer are phases in `ViewerStore`, and
`/statistics` is a router route. Engine additions stay in `src/engine` behind the `AttractorEngine` facade.

**Tech Stack:** Angular 22 standalone components with signals, Angular Router, TypeScript 6, WebGL2 and GLSL ES 3.00.

**Spec:** `docs/superpowers/specs/2026-11-08-ui-redesign-design.md`. Mockups in
`docs/superpowers/specs/2026-11-08-ui-redesign-mockups/`. Read both before any task.

## Global Constraints

- No test files. The owner did not ask for tests, so no `*.spec.ts` is written. Each task is verified by a build and
  by a check in the browser.
- No npm packages. Fonts are `woff2` files in `public/fonts`.
- `src/engine` never imports Angular. Every engine change is reached through `AttractorEngine`.
- Feature components are standalone with inline `template` and `styles`. `App` keeps `templateUrl` and `styleUrl`.
- Each component's styles stay under 4 kB, the warning budget in `angular.json:66-69`. Shared rules go in
  `src/styles.css`.
- The main canvas box never changes size because of UI. The only resize stays the window's own.
- Colours only through the tokens from the spec. Serif stack `'Newsreader', 'STIX Two Text', serif`, mono stack
  `'Spline Sans Mono', ui-monospace, monospace`. Greek letters always in the serif stack. λ₁ is `λ<sub>1</sub>` in
  HTML and a `<tspan>` with `baseline-shift` in SVG. No text under 12px.
- `prefers-reduced-motion: reduce` turns off every animation listed in the spec section Accessibility and motion.
- Code, names and comments in English. No comments on obvious code.
- Commit messages are one imperative English sentence of 3 to 8 words, no prefix, no body, no attribution. Each
  task names its message.
- One task is at most a few dozen lines of logic. The owner reads the code file by file, so after each file the
  implementer says which step is done and what comes next.
- Code from earlier tasks is named by symbol, not by line number, because line numbers move.

**Verification used by every task.**

1. `npx ng build` exits with code 0 and prints no new warning.
2. With `npx ng serve` running, a headless self-check
   `firefox --headless --no-remote --profile "$CLAUDE_JOB_DIR/tmp/ffprof" --window-size=1600,900 --screenshot "$CLAUDE_JOB_DIR/tmp/shot.png" "http://localhost:4200/?quality=tiny"`
   for layout. Add `&start=skip` once task 20 exists. The screenshot may be taken before WebGL draws, so it proves
   layout only.
3. The task's own owner check in a real browser at `http://localhost:4200/`.

## Review Focus

Manual checks, each owned by the task named in brackets.

- Switching to Aizawa while a slide rule is open closes the rule, and six chips appear with Aizawa's values (task 7).
- During a benchmark nothing that changes the engine state reacts. That covers chips, names, colour and quality
  buttons, the mark, R and N (task 16).
- Resizing the window while on Statistics keeps the figure on the right and fully visible (task 12).
- Holding Right or turning the ring fast calls `setAttractor` only once the ring rests for 300 ms (task 21).
- With reduced motion turned on in the OS, nothing breathes, glides or slides (task 26).

---

## Phase 1. Foundations

### Task 1: Fonts and colour tokens

**Files:**
- Create: `public/fonts/` with the `woff2` files and `public/fonts/OFL.txt`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: CSS custom properties `--bg`, `--ink`, `--mute`, `--dim`, `--gold`, `--hair`, `--order`, `--chaos`,
  `--warn`, `--serif`, `--mono`, and the class `.kbd` for key caps used by later tasks.

- [ ] **Step 1: Download the font files.** Ask the Google Fonts CSS2 API with a Firefox user agent and save the
  `woff2` files it lists.
  - `family=Newsreader:ital,opsz,wght@1,6..72,200..400`, subsets `latin` and `latin-ext`.
  - `family=Spline+Sans+Mono:wght@400..500`, subsets `latin` and `latin-ext`.
  - `family=STIX+Two+Text:ital,wght@1,400`, subset `greek` only.
  Name them `newsreader-italic-latin.woff2`, `newsreader-italic-latin-ext.woff2`, `spline-sans-mono-latin.woff2`,
  `spline-sans-mono-latin-ext.woff2` and `stix-two-text-italic-greek.woff2`. Add the SIL Open Font License text as
  `OFL.txt`.
- [ ] **Step 2: Write the `@font-face` rules in `src/styles.css`.** One rule per file, copying `font-weight`,
  `font-style` and `unicode-range` from the CSS the API returned, with `src: url('/fonts/<file>') format('woff2')` and
  `font-display: swap`.
- [ ] **Step 3: Replace the tokens in `:root`** with the values from the spec table Colour tokens, plus
  `--serif` and `--mono` from Global Constraints. Set `body` to `font: 14px/1.5 var(--mono)`. Add `.kbd`, an inline
  key cap in `--ink` with a 1px `rgb(236 230 214 / 0.25)` border, 4px radius and `0 6px` padding. Add a global
  `:focus-visible` rule with a 2px `--gold` outline at a 3px offset.
- [ ] **Step 4: Verify.** Build passes. Owner check: open the app, the network tab shows the fonts loading from
  `/fonts/` and nothing from `fonts.googleapis.com`.
- [ ] **Step 5: Commit** `Add self-hosted fonts and colour tokens`.

### Task 2: Favicon

**Files:**
- Create: `scripts/favicon.mjs`, `public/favicon.svg`, `public/favicon.png`
- Modify: `src/index.html:8`
- Delete: `public/favicon.ico`

- [ ] **Step 1: Write `scripts/favicon.mjs`.** Plain Node, imports only `node:fs` and `node:zlib`. It reproduces the
  favicon card "Lorenz, speed colours, tuned" from `favicon.html` in the mockups, with these values.
  - RK4 on Lorenz σ 10, ρ 28, β 8/3, `dt = 0.004`, start (1, 1, 1), skip 3000 steps, keep 1500.
  - Project each point to (x, −z) and record the speed `|f(p)|`.
  - Fit into the grid with padding `max(2, size / 8)`, keeping the aspect, centred.
  - A pixel is lit when at least one sample falls in it. Its colour is the speed palette from
    `src/engine/shaders/palette.glsl` at `t = 0.35 + 0.65 * s`, where `s` is the pixel's mean speed scaled between
    the 5th and 95th percentile of all lit pixels and clamped to 0..1.
  - Unlit pixels are the tile `#0b0d0c`, except the four corner pixels, which are transparent.
- [ ] **Step 2: Write the outputs.** `public/favicon.svg` is the 16 grid as one `<rect>` per pixel with
  `shape-rendering="crispEdges"` and `viewBox="0 0 16 16"`. `public/favicon.png` is the 32 grid as RGBA PNG, built
  from signature, `IHDR`, one `IDAT` holding `zlib.deflateSync` of rows prefixed with filter byte 0, and `IEND`, each
  chunk with `zlib.crc32`.
- [ ] **Step 3: Run** `node scripts/favicon.mjs` and open both files. They must match the tuned card in the mockup.
- [ ] **Step 4: Replace the icon link** on `src/index.html:8` with
  `<link rel="icon" type="image/svg+xml" href="favicon.svg">` and
  `<link rel="icon" type="image/png" sizes="32x32" href="favicon.png">`. Delete `public/favicon.ico`.
- [ ] **Step 5: Verify.** Build passes. Owner check: the browser tab shows the butterfly.
- [ ] **Step 6: Commit** `Add favicon drawn from Lorenz trajectory`.

## Phase 2. Viewer restyle

The router does not exist yet, so this phase builds only the title, names, toggles, parameter line and seismograph.

### Task 3: Viewer header

**Files:**
- Create: `src/app/viewer-header.ts`
- Modify: `src/app/control-panel.ts` (remove the attractor, quality and colour `<nav>`s and their styles),
  `src/app/viewer.ts` (render `<app-viewer-header />`), `src/app/hud.ts` (move `.hud` to `top: 140px; right: 16px;
  left: auto` so it no longer covers the title, a temporary change until task 16)

**Interfaces:**
- Produces: component `ViewerHeader`, selector `app-viewer-header`, no inputs. It reads `ViewerStore`.

- [ ] **Step 1: Write `ViewerHeader`.** Left block at `left: 30px; top: 18px` with the current name in serif italic
  300 at 54px and the four names in serif italic 20px as `<button>`s, active `--gold`, others `--dim`. Right block at
  `right: 26px; top: 70px` with two rows of text buttons, `speed / lyapunov` from `COLOR_MODES` and
  `low / medium / high / ultra` from `QUALITIES`, mono 14px, active `--ink`, others `--dim`, slashes as plain text.
  Every button has `aria-pressed` and `[disabled]="store.benchmarkRunning()"`, as in today's `ControlPanel`.
- [ ] **Step 2: Remove the three navs** from `ControlPanel` and render the header from `Viewer`. Move the `.hud`.
- [ ] **Step 3: Verify.** Build passes. Owner check: clicking Aizawa changes the title and the figure, clicking
  lyapunov recolours the figure, the HUD sits on the right below the toggles.
- [ ] **Step 4: Commit** `Add viewer header with system names`.

### Task 4: Parameter scale math

**Files:**
- Create: `src/app/param-scale.ts`

**Interfaces:**
- Consumes: `AttractorParam` from `src/engine/attractors/attractor.ts`.
- Produces:
  ```ts
  export const STEPS = 1000;
  export const SNAP_STEPS = 10;
  export const SCALE_SPAN_PX = 1100;
  export function toPosition(param: AttractorParam, value: number): number;
  export function fromPosition(param: AttractorParam, position: number): number; // clamps position to 0..STEPS
  export function snapTargets(param: AttractorParam): number[]; // default and mark values, ascending
  export function snapDrag(param: AttractorParam, position: number): number; // value
  export function keyStep(param: AttractorParam, value: number, key: string, shift: boolean): number | null;
  export function formatValue(value: number): string;
  export function niceStep(span: number, count: number): number;
  export interface ScaleTicks { major: { value: number; label: string }[]; minor: number[] }
  export function scaleTicks(param: AttractorParam): ScaleTicks;
  ```

- [ ] **Step 1: Move the mapping.** `toPosition`, `fromPosition` and `formatValue` take their bodies from the private
  methods and `format` of `ParamSlider`, unchanged in behaviour.
- [ ] **Step 2: Write `snapDrag`.** Among `snapTargets(param)`, pick the one whose position is nearest to `position`.
  If it is within `SNAP_STEPS`, return its exact value, otherwise `fromPosition(param, position)`.
- [ ] **Step 3: Write `keyStep`.** `ArrowLeft` and `ArrowRight` move by 1 position, 10 with Shift. `PageDown` and
  `PageUp` move by 100. `Home` and `End` return `min` and `max`. `[` and `]` return the nearest target strictly below
  or above `value`, or `null` when there is none. Moves are `fromPosition(param, toPosition(param, value) ± n)` with no
  snapping. Any other key returns `null`.
- [ ] **Step 4: Write `niceStep` and `scaleTicks`.** `niceStep` returns the smallest of 1, 2 or 5 times a power of
  ten that is at least `span / count`. For a linear param the major step is `niceStep(max - min, 8)` and the minor step
  a fifth of it. For `scale: 'log'` the majors are 1, 2 and 5 per decade inside `min..max`, the minors 1 to 9 per
  decade. Labels use `formatValue`. Check by hand that σ gives majors 4, 6, … 20 and β gives 0.5, 1, … 4.
- [ ] **Step 5: Verify.** Build passes. No owner check, nothing renders yet.
- [ ] **Step 6: Commit** `Add parameter scale math`.

### Task 5: Slide rule

**Files:**
- Create: `src/app/slide-rule.ts`

**Interfaces:**
- Consumes: task 4.
- Produces: component `SlideRule`, selector `app-slide-rule`, inputs `param: AttractorParam`, `value: number`,
  `marksDimmed: boolean`.

- [ ] **Step 1: Write the static scale.** An SVG `width = 300 + SCALE_SPAN_PX` and `height = 40` inside a 300 by 40
  window with `overflow: hidden`. The scale x of a value is `150 + toPosition(value) / STEPS * SCALE_SPAN_PX`. Baseline
  at `y = 14` in `--hair`, minor ticks 4px, major ticks 8px with labels in serif italic 13px `--mute` at `y = 37`. The
  window has the edge mask `linear-gradient(90deg, transparent, #000 22%, #000 78%, transparent)`.
- [ ] **Step 2: Slide it.** Translate the SVG by `-toPosition(value) / STEPS * SCALE_SPAN_PX` px so the value sits
  under a fixed 2px `--gold` cursor at the window centre with `box-shadow: 0 0 8px rgb(232 200 138 / 0.7)`.
- [ ] **Step 3: Draw the marks.** A `--gold` triangle 8px wide above the baseline for each `param.marks` entry. Only
  the mark nearest the current value shows its `title` in serif italic 12px `--dim`. With `marksDimmed` the triangles
  and title take 35% opacity.
- [ ] **Step 4: Verify.** Build passes. Owner check comes with task 6.
- [ ] **Step 5: Commit** `Add slide rule component`.

### Task 6: Parameter chip

**Files:**
- Create: `src/app/param-chip.ts`

**Interfaces:**
- Consumes: tasks 4 and 5.
- Produces: component `ParamChip`, selector `app-param-chip`, inputs `param: AttractorParam`, `value: number`,
  `disabled: boolean`, `marksDimmed: boolean`, output `valueChange: number`. Local state `open = signal(false)`.

- [ ] **Step 1: Render the chip.** A focusable element with `role="slider"`, `tabindex="0"` unless disabled,
  `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext` and `aria-label` from the param. Symbol in serif
  italic 22px `--dim`, value mono 14px `--ink`, `formatValue`, dashed `--hair` underline. When open, the value and
  underline turn `--gold` and `<app-slide-rule>` renders absolutely 52px above the chip, centred on it.
- [ ] **Step 2: Drag.** `pointerdown` captures the pointer, opens, and remembers the start position. `pointermove`
  emits `snapDrag(param, start + dx * STEPS / SCALE_SPAN_PX)`. `pointerup` and `lostpointercapture` close.
- [ ] **Step 3: Keys.** `focus` opens, `blur` closes. On `keydown`, Escape closes. Otherwise ask
  `keyStep(param, value, event.key, event.shiftKey)` and emit when it is not `null`. Call `preventDefault()` and
  `stopPropagation()` only for keys the chip consumed, so H, R, N and F still reach the global handler.
- [ ] **Step 4: Reset.** `dblclick` emits `param.value`.
- [ ] **Step 5: Verify.** Build passes. The owner check comes with task 7, which renders the chips.
- [ ] **Step 6: Commit** `Add parameter chip with drag and keys`.

### Task 7: Parameter line

**Files:**
- Create: `src/app/param-line.ts`
- Modify: `src/app/viewer.ts`
- Delete: `src/app/control-panel.ts`, `src/app/param-slider.ts`

**Interfaces:**
- Produces: component `ParamLine`, selector `app-param-line`, no inputs.

- [ ] **Step 1: Write `ParamLine`.** Fixed at `left: 32px; bottom: 74px`, a flex row with 22px gaps, one
  `<app-param-chip>` per param of the current preset, tracked by `param.name`. Move `preset`, `othersChanged` and
  `setParam` from `ControlPanel` unchanged. Chips are disabled while `store.benchmarkRunning()`.
- [ ] **Step 2: Swap it in.** `Viewer` renders `<app-param-line />` instead of `<app-control-panel />`. Delete
  `ControlPanel` and `ParamSlider`.
- [ ] **Step 3: Verify.** Build passes. Owner checks: dragging ρ slides the scale and the figure morphs, ρ snaps to
  28 and to 24.74 while dragging, Tab to ρ then `]` jumps to 99.65, double click restores the default, R resets all,
  and the Review Focus check for task 7.
- [ ] **Step 4: Commit** `Replace sliders with parameter chips`.

### Task 8: Seismograph

**Files:**
- Create: `src/app/sparkline.ts`, `src/app/seismograph.ts`
- Modify: `src/app/viewer.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface Sparkline { points: string; zero: number; head: { x: number; y: number } }
  export function buildSparkline(
    history: readonly number[], capacity: number, width: number, height: number, padding: number,
  ): Sparkline | null;
  ```
  and component `Seismograph`, selector `app-seismograph`, no inputs.

- [ ] **Step 1: Write `buildSparkline`.** The same scaling as the `sparkline` computed in `Hud`, right aligned over
  `capacity` slots, auto scaled to include zero, plus the newest point as `head`.
- [ ] **Step 2: Write `Seismograph`.** A fixed strip `left: 0; right: 0; bottom: 0; height: 56px` holding an SVG
  sized from the element's width with a `ResizeObserver`. The trace ends 170px before the right edge. Dashed `--hair`
  zero line, polyline `--gold` 1.1px at 80% opacity, a 3px dot at `head`, then the text "λ₁ 0.905" in serif italic 300
  at 28px with `λ` and a `baseline-shift="sub"` `<tspan>` for the 1, three decimals. While the estimate is `null` the
  text reads "λ₁ measuring" in `--dim` and the trace has 40% opacity. Above the strip on the right,
  "1 048 576 particles · 144 fps" in mono 13px `--dim`, formatted with `DecimalPipe` as `Hud` does.
- [ ] **Step 3: Render it** from `Viewer`.
- [ ] **Step 4: Verify.** Build passes. Owner check: after a system switch the text says measuring for about 25 s,
  then a value near 0.905 for Lorenz, and the trace never covers the figure.
- [ ] **Step 5: Commit** `Add Lyapunov seismograph strip`.

## Phase 3. Shell and router

### Task 9: Engine host

**Files:**
- Create: `src/app/engine-host.ts`
- Modify: `src/app/viewer.ts` (remove the canvas, engine setup, key handler and `runBenchmark`)

**Interfaces:**
- Produces:
  ```ts
  @Injectable({ providedIn: 'root' })
  export class EngineHost {
    readonly engine: Signal<AttractorEngine | null>;
    readonly caps: Signal<GlCaps | null>;
    readonly error: Signal<string | null>;
    readonly refreshMeasured: Signal<boolean>;
    start(canvas: HTMLCanvasElement): Promise<void>;
    runBenchmark(): Promise<void>;
    dispose(): void;
  }
  ```

- [ ] **Step 1: Move the setup.** `start` contains what `Viewer` does in `afterNextRender` today. It measures the
  refresh rate unless the quality is pinned, sets `refreshMeasured`, creates the engine, wires `onStats` and the three
  store effects (with an injector field taken by `inject(Injector)`), and catches errors into `error`. `runBenchmark`
  moves unchanged from `Viewer`. `dispose` disposes the engine.
- [ ] **Step 2: Keep it working.** Until task 11, `Viewer` still owns its canvas and calls `host.start(canvas)` and
  `host.dispose()` on destroy, so the app behaves as before.
- [ ] **Step 3: Verify.** Build passes. Owner check: everything works as after task 8, the benchmark included.
- [ ] **Step 4: Commit** `Move engine lifecycle into engine host`.

### Task 10: Global shortcuts

**Files:**
- Create: `src/app/shortcuts.ts`
- Modify: `src/app/viewer.ts` (drop the last key handling)

**Interfaces:**
- Produces: `@Injectable({ providedIn: 'root' }) class Shortcuts { handle(event: KeyboardEvent): void }`, and the
  exported `toggleFullscreen(): void` moved from `viewer.ts`.

- [ ] **Step 1: Write `handle`.** Return early on `event.repeat` and on Ctrl, Alt or Meta. Then the Viewer column of
  the spec's Keyboard table: B scatters through `host.engine()`, H toggles `uiHidden`, R and N act only when the
  benchmark is idle, F toggles fullscreen. On `/statistics` the same, except that H does nothing. Read the route from
  `Router.url`. Tasks 21 and 25 add the other phases.
- [ ] **Step 2: Wire it** temporarily from `Viewer` with `host: { '(window:keydown)': 'shortcuts.handle($event)' }`
  until the shell takes it in task 11.
- [ ] **Step 3: Verify.** Build passes. Owner check: H, R, N, F and B behave as before, and with a chip focused the
  arrows move the chip while H still hides the UI.
- [ ] **Step 4: Commit** `Move keyboard shortcuts into a service`.

### Task 11: Router and shell

**Files:**
- Create: `src/app/app.routes.ts`, `src/app/statistics-page.ts` (an empty page for now)
- Modify: `src/app/app.config.ts`, `src/app/app.ts`, `src/app/app.html`, `src/app/app.css`, `src/app/viewer.ts`

**Interfaces:**
- Produces: `export const routes: Routes` with `''` to `Viewer`, `'statistics'` to `StatisticsPage` and `'**'`
  redirecting to `''`. `App` exposes `protected readonly onStatistics: Signal<boolean>`.

- [ ] **Step 1: Add the router.** `provideRouter(routes)` in `appConfig`.
- [ ] **Step 2: Make `App` the shell.** `app.html` holds `<canvas #canvas class="main">`, the error text centred on
  the screen in mono 17px `--warn`, and `<router-outlet />`. `App` calls `host.start` in `afterNextRender`, `host.dispose` on destroy, and binds
  `'(window:keydown)': 'shortcuts.handle($event)'`. `onStatistics` comes from `toSignal` over `NavigationEnd` events'
  `urlAfterRedirects`, starting from `router.url`.
- [ ] **Step 3: Slim `Viewer`.** It keeps only the header, parameter line, seismograph, `Hud` and the `uiHidden`
  condition. It no longer has a canvas.
- [ ] **Step 4: Move the canvas.** In `app.css`, `.main` keeps today's fixed full-screen rules and gets
  `transition: transform 600ms ease`. `.main.shifted` adds `transform: translateX(19vw)` and
  `mask-image: linear-gradient(90deg, transparent, #000 30%)`. Under reduced motion there is no transition. Bind
  `[class.shifted]="onStatistics()"`.
- [ ] **Step 5: Verify.** Build passes. Owner check: typing `/statistics` in the address bar slides the figure right
  without the trails resetting, `/` slides it back, and going back and forth never restarts the simulation.
- [ ] **Step 6: Commit** `Add router shell around persistent engine`.

### Task 12: Top bar and first Statistics content

**Files:**
- Create: `src/app/top-bar.ts`, `src/app/lyapunov-panel.ts`
- Modify: `src/app/app.html`, `src/app/statistics-page.ts`

**Interfaces:**
- Consumes: `buildSparkline` from task 8.
- Produces: component `TopBar`, selector `app-top-bar`. Component `LyapunovPanel`, selector `app-lyapunov-panel`.

- [ ] **Step 1: Write `TopBar`.** The "Attractors" mark at `left: 30px; top: 22px` in serif italic 22px `--mute`
  (plain text until task 20), and the navigation at `right: 26px; top: 24px` with `routerLink` and
  `routerLinkActive`, mono 14px, active `--ink` with a 1px `--gold` bottom border, other `--mute`. Render it in
  `app.html` above the outlet, hidden while `store.uiHidden()`. Move `ViewerHeader` down by 40px so it sits under the
  mark.
- [ ] **Step 2: Write `LyapunovPanel`.** "λ₁ 0.905" in serif italic 300 at 52px `--gold`, the note
  "largest Lyapunov exponent, 10 s mean" in mono 13px `--dim`, then a 470 by 86 chart from `buildSparkline` with a
  dashed zero line, "60 s ago" and "now" in mono 12px `--dim`, and the current value at the right end.
- [ ] **Step 3: Lay out `StatisticsPage`.** A column at `left: 30px; top: 70px; bottom: 24px; width: 470px` with
  `overflow-y: auto`, holding the system name in serif italic 46px with the parameters beside it (symbols in the serif
  stack, values mono 13px `--dim`) and `<app-lyapunov-panel>`.
- [ ] **Step 4: Verify.** Build passes, headless self-check of `/statistics`. Owner check: the navigation switches
  pages with the active underline, the Review Focus check for task 12.
- [ ] **Step 5: Commit** `Add top bar and Lyapunov panel`.

## Phase 4. Engine statistics and lists

### Task 13: More engine statistics

**Files:**
- Modify: `src/engine/passes/simulate.ts`, `src/engine/engine.ts`

**Interfaces:**
- Produces: `SimulatePass` getters `substeps: number` and `step: number`, set in `run`. `EngineStats` gains
  `cloud: ParticleStats | null`, `timeStep: number`, `substeps: number` and `gliding: boolean`.

- [ ] **Step 1: Record the step.** `SimulatePass.run` stores `steps` and the step it passes to `draw`.
- [ ] **Step 2: Keep the latest cloud.** `AttractorEngine` stores the last non-null result of `stats.poll()` in
  `frame`, clears it in `setAttractor`, and `reportStats` adds the four fields, `gliding` from
  `this.attractor.gliding`.
- [ ] **Step 3: Verify.** Build passes. Log one `EngineStats` in the browser console and remove the log.
- [ ] **Step 4: Commit** `Report particle cloud and step in stats`.

### Task 14: Statistics lists

**Files:**
- Create: `src/app/stat-lists.ts`
- Modify: `src/app/statistics-page.ts`

**Interfaces:**
- Produces: component `StatLists`, selector `app-stat-lists`, output `run` for the benchmark button.

- [ ] **Step 1: Write the lists.** A two-column grid with the headings Shape, Motion, Rendering, Device and Keys in
  serif italic 19px, rows in mono 13px with `--dim` labels, `--ink` values and a `--hair` rule under each row.
  - Shape: centroid x, y, z and rms radius, two decimals.
  - Motion: mean speed, time step, substeps per frame, and state, which is "measuring" while the estimate is `null`,
    "gliding" while `gliding`, else "settled".
  - Rendering: frame rate, particles, exposure as `1.84× EV 0.88`.
  - Device: renderer, max texture size, float blending yes or no from `caps.extensions['EXT_float_blend']`, quality
    name, and a "Run" text button in `--gold` that emits `run` and reads "Measuring…" while running.
  - Keys: every row of the spec's Keyboard table for the Viewer, as `.kbd` caps with their action.
- [ ] **Step 2: Render it** under `LyapunovPanel`.
- [ ] **Step 3: Verify.** Build passes. Owner check: the values change while ρ glides, and Motion reads gliding
  during the glide.
- [ ] **Step 4: Commit** `Add statistics lists`.

### Task 15: Benchmark table

**Files:**
- Create: `src/app/benchmark-table.ts`
- Modify: `src/app/statistics-page.ts`

**Interfaces:**
- Produces: component `BenchmarkTable`, selector `app-benchmark-table`, input `report: BenchmarkReport`.

- [ ] **Step 1: Write the transposed table.** The note "GPU ms per frame, interval X ms" above it. Header row of
  quality names, the current quality's column in `--gold`. Rows for particles, frame, then one per
  `report.passes` entry. Numbers right aligned, mono 12px, two decimals.
- [ ] **Step 2: Render it** under the lists when `store.benchmark()` is set, and connect `StatLists.run` to
  `host.runBenchmark()`.
- [ ] **Step 3: Verify.** Build passes. Owner check: Run fills the table and the column width stays inside 470px.
- [ ] **Step 4: Commit** `Add transposed benchmark table`.

### Task 16: Remove the HUD

**Files:**
- Delete: `src/app/hud.ts`
- Modify: `src/app/viewer.ts`

- [ ] **Step 1: Delete `Hud`** and its use in `Viewer`.
- [ ] **Step 2: Lock state changes during a benchmark.** Confirm that chips, names, colour and quality buttons are
  disabled and that R and N do nothing while `benchmarkRunning()`.
- [ ] **Step 3: Verify.** Build passes. Owner check: the Review Focus check for task 16.
- [ ] **Step 4: Commit** `Remove heads-up display`.

## Phase 5. FTLE histogram

### Task 17: Multi-texel readback

**Files:**
- Modify: `src/engine/gl/readback.ts`

**Interfaces:**
- Produces: `new Readback(gl, texels = 1)`. `poll()` returns a `Float32Array` of `4 * texels` floats.

- [ ] **Step 1: Size by texels.** `result` holds `4 * texels` floats, the buffers are sized from it, and
  `readPixels` reads `texels` by 1. `StatsPass` keeps calling `new Readback(gl)` and sees no change.
- [ ] **Step 2: Verify.** Build passes. Owner check: the Statistics values still update.
- [ ] **Step 3: Commit** `Let readback read several texels`.

### Task 18: Histogram pass

**Files:**
- Create: `src/engine/passes/ftle-histogram.ts`, `src/engine/shaders/ftle-histogram.frag.glsl`
- Modify: `src/engine/engine.ts`

**Interfaces:**
- Consumes: task 17.
- Produces:
  ```ts
  export const FTLE_BINS = 48;
  export interface FtleHistogram { range: [number, number]; counts: number[]; mean: number }
  export class FtleHistogramPass {
    constructor(gl: WebGL2RenderingContext);
    measure(state: RenderTarget, range: [number, number]): void;
    poll(): number[] | null; // FTLE_BINS fractions summing to about 1
    invalidate(): void;
    dispose(): void;
  }
  ```
  and `EngineStats.ftle: FtleHistogram | null`.

- [ ] **Step 1: Write the shader.** It renders into a 12 by 1 RGBA32F target, one texel per four bins, by gathering a
  64 by 64 grid of particles. No blending, so it works without `EXT_float_blend`.
  ```glsl
  uniform sampler2D uState;
  uniform vec2 uRange;
  uniform ivec2 uStride;
  out vec4 outBins;
  const int SAMPLES = 64;
  const int BINS = 48;
  void main() {
    int first = int(gl_FragCoord.x) * 4;
    vec4 bins = vec4(0.0);
    for (int y = 0; y < SAMPLES; y++) {
      for (int x = 0; x < SAMPLES; x++) {
        float ftle = texelFetch(uState, ivec2(x, y) * uStride, 0).w;
        int bin = clamp(int(floor((ftle - uRange.x) / (uRange.y - uRange.x) * float(BINS))), 0, BINS - 1) - first;
        if (bin >= 0 && bin < 4) {
          bins[bin] += 1.0;
        }
      }
    }
    outBins = bins / float(SAMPLES * SAMPLES);
  }
  ```
- [ ] **Step 2: Write the pass.** Mirror `StatsPass`. A `Program` with `fullscreenVert`, a 12 by 1 `RenderTarget`,
  `Readback(gl, 12)`. `measure` sets `uStride` to `max(1, floor(width / 64))` and the same for height. `poll` unpacks
  the 48 floats into an array.
- [ ] **Step 3: Wire it in the engine outside `pipeline`.** In `frame`, after `render`, measure once per second of
  frame time, poll every frame and keep the newest counts. `setAttractor` calls `invalidate` and drops the counts.
  `reportStats` adds `ftle` with `preset.ftleRange`, the counts and `cloud.meanFtle`, or `null`. `dispose` disposes the
  pass.
- [ ] **Step 4: Verify.** Build passes. Log one `ftle` in the console, the counts sum to about 1, then remove the log.
- [ ] **Step 5: Commit** `Add FTLE histogram pass`.

### Task 19: Histogram chart

**Files:**
- Create: `src/app/ftle-histogram.ts`
- Modify: `src/app/statistics-page.ts`

**Interfaces:**
- Consumes: `FtleHistogram` from task 18, `niceStep` from task 4.
- Produces: component `FtleHistogramChart`, selector `app-ftle-histogram`, input `histogram: FtleHistogram`.

- [ ] **Step 1: Draw it.** SVG 470 by 92. 48 bars scaled to the tallest, 1px gaps, `--order` when the bin centre is
  below zero and `--chaos` above, at 75% opacity. A `--hair` line at zero when zero is in range. A dashed `--gold` line
  at `mean` labelled "mean 0.905" in mono 12px. Axis labels every `niceStep(range span, 5)`. Under it the caption from
  the spec in serif italic 14px `--dim`.
- [ ] **Step 2: Render it** between `LyapunovPanel` and `StatLists` when `stats.ftle` is set.
- [ ] **Step 3: Verify.** Build passes. Owner check: for Lorenz most bars are orange, for Aizawa the bars cluster
  around zero, and switching systems redraws within about a second.
- [ ] **Step 4: Commit** `Add FTLE histogram chart`.

## Phase 6. Selection ring

### Task 20: Phase signal

**Files:**
- Modify: `src/app/viewer-store.ts`, `src/app/app.html`, `src/app/top-bar.ts`

**Interfaces:**
- Produces: `export type Phase = 'start' | 'select' | 'view'` and `ViewerStore.phase: WritableSignal<Phase>`.

- [ ] **Step 1: Add the phase.** `initialPhase()` returns `'view'` when the path starts with `/statistics` or the
  query has `start=skip`, otherwise `'select'`. Task 24 changes the default to `'start'`.
- [ ] **Step 2: Render by phase.** `app.html` shows the top bar and outlet only in `'view'`.
- [ ] **Step 3: Make the mark a button.** It sets `phase` to `'select'` and navigates to `/`. Disabled while the
  benchmark runs.
- [ ] **Step 4: Verify.** Build passes. Owner check: `/?start=skip` opens the viewer, `/statistics` opens Statistics.
- [ ] **Step 5: Commit** `Add app phase to the store`.

### Task 21: System ring

**Files:**
- Create: `src/app/system-ring.ts`
- Modify: `src/app/app.html`, `src/app/shortcuts.ts`

**Interfaces:**
- Produces: component `SystemRing`, selector `app-system-ring`, no inputs. Local `turns = signal(0)`. The front
  index is `turns` modulo the number of systems.

- [ ] **Step 1: Place the names with CSS trigonometry.** Register `@property --a { syntax: '<angle>'; inherits: false;
  initial-value: 0deg }` in `src/styles.css`. Each name is a `<button>` with
  `--a: calc(90deg + (index - turns) * 360deg / count)`, `left: calc(50% + cos(var(--a)) * 37.5vw)`,
  `top: calc(52% + sin(var(--a)) * 23vh)`, `font-size: calc(20px + 34px * pow((1 + sin(var(--a))) / 2, 1.6))`, and
  opacity `calc(0.3 + 0.7 * pow((1 + sin(var(--a))) / 2, 1.6))`, with `transition: --a 450ms ease`. The front name is
  `--gold`. A 5px dot in the name's colour sits 12px above it, on the ellipse line. The ring container rotates by
  −8deg and each name counter-rotates by 8deg. The ellipse is a 75vw by 46vh `--hair` outline. Add the "Attractors"
  mark and the hint `← → turn · Enter open` with `.kbd` caps. Under reduced motion the transition is off.
- [ ] **Step 2: Debounce the background.** An `effect` reads the front index and, after 300 ms without change, sets
  `store.attractorId`. The previous timer is cleared through `onCleanup`.
- [ ] **Step 3: Own the ring keys.** A `(document:keydown)` host listener, skipping repeats and modifiers. Left turns
  back, Right and N turn forward. Enter and Space open the front system, unless the event target is a ring button,
  where the native click does it. A click on a button turns the ring to it, or opens it when it is in front. `focus`
  on a button turns the ring to it.
- [ ] **Step 4: Open.** Set `store.attractorId` to the front system at once, then `phase` to `'view'`.
- [ ] **Step 5: Hand the keys over.** `Shortcuts.handle` does nothing in `'select'` except F.
- [ ] **Step 6: Verify.** Build passes. Owner check: names slide along the ellipse and grow toward the front, Enter
  opens the viewer on that system, the mark returns to the ring, and the Review Focus check for task 21.
- [ ] **Step 7: Commit** `Add system selection ring`.

### Task 22: Entering the viewer

**Files:**
- Modify: `src/styles.css`, `src/app/system-ring.ts`, `src/app/viewer.ts`

- [ ] **Step 1: Leave the ring.** On open, the ring gets a `leaving` class for 300 ms that fades the names and pushes
  them 6% outward, then the phase changes.
- [ ] **Step 2: Enter the viewer.** A shared `@keyframes enter` in `src/styles.css` from opacity 0 and 8px down to
  rest over 400 ms, applied to the header, parameter line and seismograph with `animation-delay` of 0, 100 and 200 ms.
  Both steps are skipped under reduced motion.
- [ ] **Step 3: Verify.** Build passes. Owner check: opening a system feels like one movement, not a cut.
- [ ] **Step 4: Commit** `Animate opening a system`.

## Phase 7. Start screen

### Task 23: Zoom glide in the engine

**Files:**
- Modify: `src/engine/input/orbit-controls.ts`, `src/engine/engine.ts`

**Interfaces:**
- Produces: `OrbitControls.glideZoom(from: number, to: number, seconds: number): void` and the facade method
  `AttractorEngine.glideZoom(from: number, to: number, seconds: number): void`.

- [ ] **Step 1: Add the glide.** A private glide state with `from`, `to`, `elapsed` and `seconds`. While it is set,
  `update` advances it and sets `zoom` and `targetZoom` to `from * (to / from) ** (1 - (1 - t) ** 3)`, with
  `t = seconds > 0 ? min(1, elapsed / seconds) : 1`, and clears it at `t = 1`. The glide ignores `MIN_ZOOM` and
  `MAX_ZOOM`. A wheel event cancels it.
- [ ] **Step 2: Expose it** on the facade.
- [ ] **Step 3: Verify.** Build passes. Owner check: calling `glideZoom(6, 1, 1.2)` from the console through a
  temporary `window` reference flies in, then remove the reference.
- [ ] **Step 4: Commit** `Add zoom glide to orbit controls`.

### Task 24: Start screen

**Files:**
- Create: `src/app/start-screen.ts`, `src/app/intro.ts`
- Modify: `src/app/viewer-store.ts`, `src/app/app.html`, `src/app/app.css`, `src/app/engine-host.ts`

**Interfaces:**
- Produces: component `StartScreen`, selector `app-start-screen`, input `leaving: boolean`.
  `@Injectable({ providedIn: 'root' }) class Intro { readonly leaving: Signal<boolean>; begin(): void }` with
  `INTRO_ZOOM = 6`.

- [ ] **Step 1: Default to Start.** `initialPhase()` returns `'start'` instead of `'select'`. During `'start'` the main
  canvas has opacity 0, and `EngineHost.start` calls `glideZoom(INTRO_ZOOM, INTRO_ZOOM, 0)` after creating the engine.
- [ ] **Step 2: Lay out `StartScreen`.** The title "Attractors" in serif italic 200 at 132px, centred at 16% from the
  top. A row of four square canvases 17vw wide centred at 62% and spaced at 20%, 40%, 60% and 80% of the width, each
  with its name below in serif italic 15px `--dim`. The prompt at 89% in mono 15px `--mute`, breathing on a 2.6 s
  opacity loop that stops under reduced motion, "Tap to begin" when `matchMedia('(pointer: coarse)')` matches, else "Press any key to begin". When
  `host.error()` is set, the prompt is replaced by the error in `--warn`.
- [ ] **Step 3: Start the small engines** only after `host.refreshMeasured()` is true, so the refresh measurement is not
  disturbed. Each is `new AttractorEngine(canvas, 'tiny')` with `setAttractor(id)` and `start()`, in `ATTRACTORS`
  order. Canvases have `pointer-events: none`. A failing small engine is skipped. All are disposed on destroy.
- [ ] **Step 4: Write `Intro.begin`.** It does nothing when `host.error()` is set or it already runs. It sets
  `leaving`, calls `glideZoom(INTRO_ZOOM, 1, 1.2)`, removes the canvas opacity, and after 1200 ms sets `phase` to
  `'select'` and clears `leaving`. Under reduced motion it calls `glideZoom(1, 1, 0)` and waits 400 ms instead.
  A click or tap on the start screen calls it.
- [ ] **Step 5: Verify.** Build passes. Owner check: the four figures spin, the title stays clear, and after starting
  the Statistics Device list shows the same quality as before this task, so the refresh measurement was not disturbed.
- [ ] **Step 6: Commit** `Add start screen with live figures`.

### Task 25: Zoom transition

**Files:**
- Modify: `src/app/start-screen.ts`, `src/app/app.css`, `src/app/shortcuts.ts`

- [ ] **Step 1: Animate leaving.** With `leaving`, the title, names and prompt fade out over 300 ms, and each canvas
  moves away from the screen centre by its own offset times 1.5 while scaling to 2.2 over 1200 ms with an ease out.
  The main canvas opacity transition is 1200 ms. Under reduced motion all of it is a 400 ms crossfade.
- [ ] **Step 2: Start keys.** In `'start'`, `Shortcuts.handle` calls `intro.begin()` for any key without modifiers or
  repeat, and F also toggles fullscreen.
- [ ] **Step 3: Verify.** Build passes. Owner check: any key flies into the figure and lands on the ring, F begins and
  goes fullscreen, without WebGL2 the error replaces the prompt and keys do nothing.
- [ ] **Step 4: Commit** `Animate zoom from start screen`.

## Phase 8. Responsive and README

### Task 26: Narrow and portrait screens

**Files:**
- Modify: `src/app/start-screen.ts`, `src/app/system-ring.ts`, `src/app/viewer-header.ts`, `src/app/param-line.ts`,
  `src/app/param-chip.ts`, `src/app/seismograph.ts`, `src/app/statistics-page.ts`, `src/app/app.css`

- [ ] **Step 1: Apply the spec's Responsive rules** under `@media (max-width: 899px), (orientation: portrait)`. The
  start title uses `clamp(48px, 12vw, 132px)` and the figures form a 2 by 2 grid. The ellipse is 90vw wide. The name
  drops to 36px and the toggles move under the names. The chip line wraps and an open rule spans
  `calc(100vw - 32px)`. The seismograph is 44px. On Statistics `.main.shifted` keeps no transform, gets a backdrop of
  `rgb(12 16 15 / 0.82)` over it, and the column spans the full width minus 16px gutters.
- [ ] **Step 2: Swipe on the ring.** A horizontal pointer movement of more than 40px turns the ring one step.
- [ ] **Step 3: Verify.** Build passes, headless self-checks at 390 by 844 and 1600 by 900. Owner check in the
  browser's responsive mode, and the Review Focus check for task 26.
- [ ] **Step 4: Commit** `Adapt screens to narrow and portrait`.

### Task 27: README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the text that the code changed.** The heads-up display in the Features list and in Lyapunov
  exponent becomes the seismograph and the Statistics page. The Benchmark button becomes the Run button on
  Statistics. The Controls table gains the start screen, the ring keys, `[` and `]`, double click reset and
  `?start=skip`, and loses nothing else. Every new sentence must match the code.
- [ ] **Step 2: Verify.** Read every changed sentence against the code it describes.
- [ ] **Step 3: Commit** `Update README for redesigned interface`.
