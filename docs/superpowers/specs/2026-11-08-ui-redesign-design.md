# UI redesign

Design for branch `ui-redesign`, agreed with the owner on 2026-11-08. The chosen mockups live next to this file in
`2026-11-08-ui-redesign-mockups/` and open directly in a browser.

## Intent

The viewer works, but its controls look like default browser widgets. The panels are dark boxes, the sliders are native
`<input type="range">` with `accent-color` (`src/app/param-slider.ts:59-63`), and the text uses `ui-monospace` and
`system-ui` (`src/styles.css:16`). The owner wants three things. First, a visual identity of its own, built from the
subject. Second, a start sequence that introduces the four systems before the viewer opens. Third, a separate page with
deeper live statistics about the figure. A pixel art favicon completes it.

## Goals

- Replace every control with custom controls in one visual system.
- Add a start screen, a zoom transition and a selection ring for the four systems.
- Add a Statistics page reached from a top navigation, showing live data while the simulation keeps running.
- Add a favicon drawn from the real Lorenz equations.

## Non-goals

- No change to the simulation, the render passes or the colour modes, except the additions under Engine changes.
- No new attractors, no light theme.
- No tests unless the owner asks for them.

## Anti-goals

These would make the work a failure even if it runs.

- Controls that cover the figure. The owner rejected the first slide rule mockup for exactly that reason.
- UI that resets the long exposure as a side effect, for example by resizing the canvas.
- Losing keyboard access to anything that works by keyboard today.
- New npm packages added without asking.

## Constraints from the codebase

- `src/engine` never imports Angular (`README.md:74`). Engine additions stay plain TypeScript and WebGL2 and are reached
  through the `AttractorEngine` facade.
- Components are standalone with inline `template` and `styles` (`src/app/control-panel.ts:7-125`). App state lives in
  signals in the root `ViewerStore` (`src/app/viewer-store.ts:6-29`). New code follows both patterns.
- Any change of the canvas size disposes and recreates the long exposure history (`src/engine/engine.ts:319-327`). The UI
  must never animate or change the size of the main canvas box.
- `Viewer` disposes the engine when it is destroyed (`src/app/viewer.ts:83`). After this redesign the engine must outlive
  route changes.
- One engine renders one attractor (`src/engine/engine.ts:65`). `setAttractor` restarts the Lyapunov estimate and
  reseeds every particle (`src/engine/engine.ts:155-164`).
- Keys are ignored while Ctrl, Alt or Meta is held (`src/app/viewer.ts:96`). R and N do nothing while the benchmark runs
  (`src/app/viewer.ts:99-116`). Both rules stay.

## Visual system

Direction B from `visual-style.html`, with its top area kept and its two bottom panels replaced.

### Colour tokens

They replace the tokens in `src/styles.css:1-8`. The background and the warning colour stay as they are.

| Token     | Value                       | Use                                                          |
| --------- | --------------------------- | ------------------------------------------------------------ |
| `--bg`    | `#0c100f`                   | Page background, unchanged                                   |
| `--ink`   | `#ece6d6`                   | Titles, values, active items                                 |
| `--mute`  | `#a49f92`                   | Secondary text, navigation                                   |
| `--dim`   | `#8d897e`                   | Labels, hints, inactive items                                |
| `--gold`  | `#e8c88a`                   | The only accent. Active name, slide rule cursor, λ₁, focus   |
| `--hair`  | `rgb(236 230 214 / 0.14)`   | Hairlines and dividers                                       |
| `--order` | `rgb(90 150 255)`           | Negative exponents, from `DIVERGING_COLORS` in `palette.glsl` |
| `--chaos` | `rgb(225 130 50)`           | Positive exponents, from the same constant                   |
| `--warn`  | `#e09aa2`                   | Errors, unchanged                                            |

The two exponent colours come from `src/engine/shaders/palette.glsl:10-14`, so the histogram matches the Lyapunov colour
mode.

### Type

- Newsreader italic, weights 200, 300 and 400. Titles, system names, the symbols σ ρ β, large numbers and captions.
- Spline Sans Mono, weights 400 and 500. Values, labels, navigation and hints.
- No text smaller than 12px.

How the fonts load is an open question for the owner, see Open questions.

## Flow

```
Start  -- any key, click or tap -->  Zoom (about 1.2 s)  -->  Select (ring)
Select -- Enter or click on the front name -->  Viewer
Viewer <-- top navigation -->  Statistics
Viewer -- "Attractors" mark -->  Select
```

- `/` hosts Start, Select and Viewer as phases held in a store signal, for example
  `phase: 'start' | 'select' | 'view'`. `/statistics` is a route.
- Start shows on every fresh load of `/`. Returning from Statistics to Viewer never shows it again.
- A fresh load of `/statistics` skips Start and Select and opens Statistics with the first attractor (designer's call).

## Screens

### Start

Mockup `intro-v2.html`, variant 3.

- The title "Attractors" in Newsreader italic 200, about 132px on a wide screen, in the upper half.
- Under it an even row of four small live figures in `ATTRACTORS` order (`src/engine/attractors/registry.ts:7`), each
  with its name below in Newsreader italic 15px `--dim`.
- At the bottom the prompt "Press any key to begin" in Spline Sans Mono 15px `--mute`. Its opacity breathes on a 2.6 s
  loop. On coarse pointers it reads "Tap to begin" (designer's call).
- Each figure is its own `<canvas>` with its own `AttractorEngine` at quality `tiny`, 16 384 particles
  (`src/engine/settings.ts:8`). They spin through the existing auto-rotate (`src/engine/input/orbit-controls.ts:36-41`)
  and ignore the pointer.
- The main engine is created behind the start screen, so the refresh rate measurement (`src/app/viewer.ts:71-72`) and
  shader compilation are done before the first key press.
- Five WebGL contexts exist at once during Start. The four small engines call `dispose()` after the transition, which
  also loses their contexts (`src/engine/engine.ts:201-206`).
- If WebGL2 is missing, the start screen still shows the title, names and prompt, and the existing error message
  appears as today (`src/app/viewer.ts:124-126`).

### Zoom transition

- The title, names and prompt fade out over about 300 ms.
- The four small canvases move outward and grow through CSS transforms on their own boxes, as if the camera flies
  between them. They are disposed at the end, so their blur while scaled does not matter.
- At the same time the main canvas fades in and its camera glides from far away to normal framing in about 1.2 s with an
  ease out. This needs the zoom API under Engine changes.
- The transition ends in Select with the first system in front of the ring.

### Select

Mockup `selection.html`, variant 2.

- A small "Attractors" mark top left in Newsreader italic 22px `--mute`, nothing else in the corners.
- A thin `--hair` ellipse around the figure, about 75% of the width and 46% of the height, tilted by −8°.
- Four names as `<button>` elements placed by angle on the ellipse, in `ATTRACTORS` order. The front name is 54px in
  `--gold`. The two side names are 30px at 55% `--ink`. The back name is 20px at 30% `--ink`. A small dot sits above
  each name on the ellipse line.
- Left and Right turn the ring one step, animated over about 450 ms. Enter or Space opens the front system.
- Clicking a name that is not in front turns the ring to it. Clicking the front name opens it.
- Focusing a name with Tab turns the ring to it (designer's call).
- The background always shows the front system. `setAttractor` runs only after the ring has rested for about 300 ms, so
  fast browsing does not reseed the particles at every step.
- A hint at the bottom in Spline Sans Mono 13px `--dim` reads "← → turn · Enter open" with the keys drawn as small
  outlined caps.
- Opening a system fades and spreads the ring names, then the viewer UI appears in a short stagger of about 600 ms. A
  plain crossfade is acceptable if the stagger turns out fragile.

### Viewer

Mockups `sliderule-compact.html`, variant 3b, and the top area of `visual-style.html`, variant B.

Top area.

- A top bar shared with Statistics. Left, the "Attractors" mark, which returns to Select. Right, the navigation
  "Viewer" and "Statistics" in Spline Sans Mono 14px. The active entry is `--ink` with a 1px `--gold` underline, the
  other is `--mute`.
- Under the mark, the current system name in Newsreader italic 300 at 54px.
- Under the name, the four system names in Newsreader italic 20px. The active one is `--gold`, the rest `--dim`.
  Clicking one switches the system directly.
- On the right under the navigation, two lines of text buttons. "speed / lyapunov" and "low / medium / high / ultra",
  Spline Sans Mono 14px. The active option is `--ink`, the others `--dim`, the slashes are plain text. They are
  `<button>` elements with `aria-pressed`, as today (`src/app/control-panel.ts:32-39`).

Parameter line, bottom left.

- One line of chips, one per parameter, for example "σ 10.00 ρ 28.00 β 2.667". The symbol is Newsreader italic 22px
  `--dim`, the value is Spline Sans Mono 14px `--ink`, with a dashed `--hair` underline. Aizawa has six parameters
  (`src/engine/attractors/aizawa.ts:7-12`) and the line simply grows.
- Pressing a chip opens its slide rule just above it. The rule is about 300px wide and 40px tall. A fixed `--gold` cursor
  sits in its middle with a soft glow, and the scale slides underneath it as the pointer drags horizontally. The rule
  closes on release and on blur. The open chip turns `--gold`.
- The scale has a baseline hairline, minor ticks, major ticks with labels in Newsreader italic 13px `--mute`, and a fade
  at both edges. Parameters with `scale: 'log'` (`src/engine/attractors/lorenz.ts:14`) get a logarithmic scale
  labelled at 1, 2 and 5 per decade.
- Marks from `param.marks` appear as small `--gold` triangles above the baseline with their `title` beside them in
  Newsreader italic 12px. When another parameter differs from its default the marks dim to 35%, keeping today's meaning
  (`src/app/control-panel.ts:136-141`, `src/app/param-slider.ts:84-86`).
- The value mapping and the snap to the default within 10 of 1000 positions are reused from `ParamSlider`
  (`src/app/param-slider.ts:4-5`, `:110-136`). The full range spans about 1100px of scale.
- Keyboard. Each chip is focusable with `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and
  `aria-valuetext`. Focus opens the rule. Left and Right move by one position of 1000, Shift moves by 10, Page Up and
  Page Down by 100, Home and End jump to the ends. Escape closes the rule.
- Double click on a chip resets that parameter to its default. R still resets all of them. The Reset button
  (`src/app/control-panel.ts:21-28`) goes away.
- All chips are disabled while the benchmark runs, as the sliders are today (`src/app/control-panel.ts:16`).

Seismograph, bottom edge.

- A full width SVG strip about 56px tall along the bottom of the screen.
- It plots `stats.lyapunov.history`, 240 samples (`src/engine/lyapunov-estimate.ts:1`), right aligned and auto scaled to
  include zero, as the sparkline does today (`src/app/hud.ts:165-180`).
- A dashed `--hair` zero line, the trace in `--gold` at 1.1px and 80% opacity, a 3px dot at the newest sample.
- After the dot, "λ₁ 0.905" in Newsreader italic 300 at 28px, three decimals as today (`src/app/hud.ts:29`). While the
  estimate is `null` it reads "λ₁ measuring" in `--dim` and the trace drops to 40% opacity (`src/app/hud.ts:31`,
  `:120-122`).
- Above the strip on the right, "1 048 576 particles · 144 fps" in Spline Sans Mono 13px `--dim`.

H still hides all UI (`src/app/viewer-store.ts:19`). The exposure, renderer, key list and benchmark leave the viewer and
move to Statistics. `ControlPanel`, `Hud` and `ParamSlider` are deleted once their replacements work.

### Statistics

Mockup `statistics.html`, variant 1, with the FTLE histogram from variant 2.

- The same top bar, with "Statistics" active.
- The live figure moves to the right. The main canvas keeps its size and gets `transform: translateX(19vw)` with a 600 ms
  ease, plus a mask that fades its left edge. The figure is framed in the middle of the canvas, so it lands at about 69%
  of the width and stays fully visible. This needs no engine change and never triggers the resize path.
- A left column 470px wide, from below the top bar to the bottom, scrolling on its own when it is taller than the window.
  From top to bottom it holds the following.
  1. The system name in Newsreader italic 46px with the current parameters beside it in Spline Sans Mono 13px `--dim`.
  2. "λ₁ 0.905" in Newsreader italic 300 at 52px `--gold`, with the note "largest Lyapunov exponent, 10 s mean". The
     mean covers 40 samples (`src/engine/lyapunov-estimate.ts:2`) taken every 0.25 s (`src/engine/engine.ts:47`).
  3. A line chart of the full history, 60 s wide, with a dashed zero line, the labels "60 s ago" and "now", and the
     current value at the right end.
  4. The FTLE histogram. 48 bars across the preset's `ftleRange` (`src/engine/attractors/attractor.ts:26`), coloured
     `--order` below zero and `--chaos` above, a hairline at zero, a dashed `--gold` line at the mean with the label
     "mean 0.905", axis labels, and the caption "Finite-time exponent of every particle, blue converging, orange
     diverging." in Newsreader italic 14px.
  5. Four two-column lists with a hairline under every row. Shape lists centroid x, y and z and the rms radius. Motion
     lists mean speed, current time step, substeps per frame and a state of measuring, gliding or settled. Rendering
     lists frame rate, particles and exposure as both factor and EV, as today (`src/app/hud.ts:21-25`). Device lists
     renderer, max texture size, float blending, quality and a "Run" button for the benchmark.
  6. After a benchmark run, the result table under the lists. Quality, particles, frame time and one column per pass
     from `report.passes`, with the row of the current quality in `--gold` and the note "GPU ms per frame, interval
     X ms" as today (`src/app/hud.ts:56`).
- N, R and B keep working here. Going back to Viewer moves the canvas back with the same transition.

### Favicon

Mockup `favicon.html`, card "Lorenz, speed colours, tuned".

- Drawn from 1500 RK4 steps of the Lorenz system with `dt = 0.004`, after skipping 3000 steps from (1, 1, 1). The
  trajectory is projected on x and −z and counted into the grid. A pixel is lit when at least one sample falls in it.
- The colour of a lit pixel is the speed palette from `src/engine/shaders/palette.glsl:1-8` at
  `t = 0.35 + 0.65 × s`, where `s` is the pixel's mean speed normalised between the 5th and 95th percentile. The palette
  starts at teal because the navy stop is invisible on the dark tile at 16px.
- The tile is `#0b0d0c` with its four corner pixels transparent. Padding is 2px at 16px and 4px at 32px.
- A small Node script in `scripts/` generates the files without new packages. It writes `public/favicon.svg` from the
  16px grid as crisp rectangles and `public/favicon.png` at 32px through `node:zlib`. `src/index.html:7` links both and
  `public/favicon.ico` is removed (designer's call).

## Keyboard

Modifier keys and the benchmark rules from Constraints apply on every screen. One window level handler in the shell
dispatches by phase and route, replacing the one in `src/app/viewer.ts:95-123`.

| Key            | Start  | Select           | Viewer                  | Statistics |
| -------------- | ------ | ---------------- | ----------------------- | ---------- |
| Any other key  | Begin  |                  |                         |            |
| Left, Right    | Begin  | Turn the ring    | Move a focused chip     |            |
| Enter, Space   | Begin  | Open front name  |                         |            |
| Escape         | Begin  |                  | Close the open rule     |            |
| H              | Begin  |                  | Hide or show the UI     |            |
| R              | Begin  |                  | Reset parameters        | Same       |
| N              | Begin  | Turn the ring    | Next system             | Same       |
| F              | Begin and toggle fullscreen | Toggle fullscreen | Toggle fullscreen | Same |
| B              | Begin  |                  | Scatter the particles   | Same       |

Keys typed into a focused chip are handled by the chip first and do not reach the global handler.

## Architecture

- `App` becomes the shell. It owns the main canvas and the main engine, moving the setup from
  `src/app/viewer.ts:67-128`, and renders the top bar, the Start and Select phases and a `<router-outlet>`.
- `provideRouter` joins `src/app/app.config.ts:3-7` with two routes. The empty path loads the viewer page and
  `statistics` loads the statistics page.
- A small root injectable holds the engine reference, so both pages can reach `benchmark()` and the shell stays the only
  place that creates and disposes it. This is a new pattern for the repo. The alternative is to route every call through
  `ViewerStore`. The builder may pick either and must say which.
- `ViewerStore` gains the phase signal, the open chip and whatever the new stats need. The new `EngineStats` fields flow
  through the existing `stats` signal (`src/app/viewer-store.ts:16`).
- New components, one per file in `src/app`, for example the top bar, start screen, system ring, viewer page, parameter
  chip with slide rule, seismograph, statistics page and FTLE histogram. Names are the builder's call.

## Engine changes

These cross the engine boundary, so each one is listed for the owner. All stay inside `src/engine` and go through the
facade.

1. **Zoom glide for the intro.** Today `targetZoom` is private (`src/engine/input/orbit-controls.ts:17`), zoom is clamped
   to 0.5 to 3 (`:8-9`) and eased in 0.12 s (`:10`, `:42`). Add a public method that glides the zoom from a given start
   to a given target over a given time, allowed beyond the wheel clamp. The wheel keeps its clamp.
2. **More fields in `EngineStats`** (`src/engine/engine.ts:22-27`). Add `centroid`, `rmsRadius` and `meanSpeed` from
   `ParticleStats` (`src/engine/passes/stats.ts:11-16`), the current time step and substep count computed in
   `src/engine/passes/simulate.ts:19-24`, and `gliding` from `src/engine/attractors/live-attractor.ts:52-54`.
3. **FTLE histogram pass.** Each particle's finite-time exponent is the `w` component of the state texture
   (`src/engine/shaders/simulate.frag.glsl:30`, `:42`). A new pass bins it into 48 buckets over the preset's
   `ftleRange` about once per second and reads the result back asynchronously like the stats pass
   (`src/engine/gl/readback.ts`). It must work without `EXT_float_blend`, as `SplatPass` does
   (`src/engine/passes/splat.ts:111`), for example by gathering over a subsample of particles. Reported as an optional
   field in `EngineStats` with the range, the counts and the mean.
4. **Device facts.** `engine.caps` already holds renderer, max texture size and extensions
   (`src/engine/gl/context.ts:1-8`). No engine change is needed, only exposure to the statistics page.

## Responsive

Designer's calls. Below 900px wide or in portrait.

- Start. The title scales with `clamp(48px, 12vw, 132px)` and the four figures form a 2 by 2 grid.
- Select. The ellipse becomes narrower and taller at about 90% of the width. A horizontal swipe turns the ring.
- Viewer. The name drops to 36px, the colour and quality buttons move under the names list, the chip line wraps, the rule
  opens at the full width minus a 16px gutter on each side, and the seismograph shrinks to about 44px.
- Statistics. The figure stays full screen behind a dimmed backdrop, the column takes the full width and scrolls. The
  canvas still never changes size.

## Accessibility and motion

- Every control is a `<button>` or a `role="slider"` element reachable by keyboard.
- Focus shows as a 2px `--gold` outline with a 3px offset.
- With `prefers-reduced-motion`, the prompt does not breathe, the zoom becomes a 400 ms crossfade without the camera
  glide, the ring turns instantly and the Statistics canvas moves without easing.

## Phases

Each phase ends with a build and a check in the browser, and each verified step is one commit. Plan steps stay at a few
dozen lines of logic, as the owner works through them one file at a time.

1. Tokens, fonts and the favicon.
2. Viewer restyle inside today's `Viewer`. Top area, text buttons, chips with the slide rule, the seismograph. Remove
   `ControlPanel`, `Hud` and `ParamSlider`.
3. Shell and router. Move the engine into the shell, add the top bar and the `/statistics` route with the data that
   exists today, add the canvas move.
4. Engine change 2 and the Statistics lists and benchmark table.
5. Engine change 3 and the histogram.
6. The Select ring and the phase signal.
7. The Start screen, engine change 1 and the zoom transition.
8. The responsive pass and the README update. The Controls table (`README.md:42-56`) gains the new screens, double
   click reset and the ring keys, and the sentence about the heads-up display (`README.md:24`) changes to the
   seismograph and the Statistics page.

## Decided by the owner

- Direction B for colour and type, with its top area kept.
- Variant 3b for parameters and the thin seismograph for λ₁.
- The ring for selection, the row of four live figures for Start and several small engines to draw them.
- Statistics variant 1 plus the FTLE histogram from variant 2.
- The Lorenz favicon in speed colours.
- Everything marked as an assumption in the chat playbacks, which the owner confirmed.

## Designer's calls

The owner should check these while reading.

- The palette of the favicon starts at teal instead of navy.
- A fresh load of `/statistics` skips Start and Select.
- "Tap to begin" on coarse pointers.
- Focusing a ring name with Tab turns the ring to it.
- The figure on Statistics moves by CSS transform, not by a camera offset.
- The favicon ships as SVG plus a 32px PNG, and `favicon.ico` goes away.
- On Start, every key begins, and F also toggles fullscreen.
- Every responsive rule above.

## Left to the builder

- Component and file names, and whether the engine reference lives in a new injectable or behind `ViewerStore`.
- The exact easing curves and durations within the ranges given.
- How the histogram pass gathers its data, within the constraints of engine change 3.

## Open questions

1. How the two fonts load. A `<link>` to Google Fonts in `src/index.html` is the simplest but makes a request to a
   third party on every visit and needs a network connection during development. Self-hosting the `woff2` files in
   `public/fonts` adds about 200 KB of assets and no npm package. Both fonts are under the SIL Open Font License.
