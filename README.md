# Attractors

Strange attractors drawn as a glowing fog of up to four million particles. The particles are simulated and rendered
on the GPU with hand-written WebGL2 shaders inside an Angular app.

![Lorenz attractor coloured by speed](docs/lorenz-speed.jpg)

| ![Lorenz attractor coloured by finite-time Lyapunov exponent](docs/lorenz-lyapunov.jpg) | ![Halvorsen attractor](docs/halvorsen-speed.jpg) |
| --------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Lorenz in Lyapunov mode                                                                 | Halvorsen in speed mode                          |

The Lorenz shots are taken six seconds after the start, while the seed cube is still stretching into thin sheets.

## Features

- A start screen with the four systems spinning live, a camera flight into the figure and a tilted ring to pick the
  system.
- Four attractors (Lorenz, Aizawa, Halvorsen and Burke-Shaw) with live parameters. Each value opens a slide rule whose
  scale moves under a fixed cursor. A parameter change glides over 2 seconds and the particles keep flying, so you can
  watch the attractor morph.
- The Lorenz ρ scale is logarithmic and has marks at five bifurcation points, from the origin losing stability at
  ρ = 1 to the periodic window at ρ = 99.65. Dragging snaps to a mark, and `[` and `]` jump between them.
- RK4 integration on the GPU, with the time step adapted to the live mean speed.
- HDR long exposure, a six-level bloom, automatic exposure, AgX tone mapping, dithering and depth of field.
- Two colour modes. Speed colours each particle by how fast it moves. Lyapunov colours it by its finite-time Lyapunov
  exponent, blue where nearby paths converge and orange where they diverge.
- A live estimate of the largest Lyapunov exponent λ₁, traced along the bottom edge like a seismograph.
- A Statistics page next to the running figure, with the λ₁ history of the last 60 seconds, a histogram of the
  finite-time exponents, the shape and motion of the particle cloud, device facts and the benchmark.
- Four quality levels and a built-in GPU benchmark.

## Running

You need Node.js with npm and a browser with WebGL2 and the `EXT_color_buffer_float` extension. Development used
Firefox 158 on Linux with an NVIDIA RTX 2060.

```bash
npm install
npm start       # dev server at http://localhost:4200/
npm run build   # production build in dist/attractors/browser
```

Without a URL parameter the viewer measures the display refresh rate and picks Medium at 100 Hz or more and High
below that. `?quality=low`, `medium`, `high` or `ultra` pins a level. `?quality=tiny` (16 384 particles) exists for
software-rendered screenshots. `?start=skip` skips the start screen and the ring and opens the viewer with the first
system, which helps automated screenshots and benchmarks. Both parameters combine, and opening `/statistics` directly
skips the start screen too.

## Controls

| Where            | Input                                   | Action                                                           |
| ---------------- | --------------------------------------- | ---------------------------------------------------------------- |
| Start screen     | Any key, click or tap                   | Fly into the figure and open the ring. F also toggles fullscreen |
| Ring             | ← and →, or N                           | Turn the ring one step                                           |
| Ring             | Enter or Space, click on the front name | Open that system                                                 |
| Ring             | Click or Tab on another name            | Turn the ring to it                                              |
| Ring             | Horizontal swipe on a touch screen      | Turn the ring one step                                           |
| Viewer           | "Attractors" mark                       | Back to the ring                                                 |
| Figure           | Drag                                    | Orbit the camera                                                 |
| Figure           | Mouse wheel                             | Zoom in and out                                                  |
| Figure           | No input for 3 s                        | Auto-rotate                                                      |
| Viewer           | Drag a parameter value                  | Change it, snapping to the default and to the marks              |
| Focused value    | ← and →                                 | 1/1000 of the scale, 10/1000 with Shift                          |
| Focused value    | Page Up and Page Down, Home and End     | 100/1000 of the scale, or its ends                               |
| Focused value    | `[` and `]`                             | Previous or next mark, the default counting as a mark            |
| Focused value    | Esc                                     | Close the slide rule                                             |
| Viewer           | Double click a parameter value          | Reset that parameter                                             |
| Viewer           | H                                       | Hide or show the interface                                       |
| Viewer and Stats | R                                       | Reset the parameters of the current attractor                    |
| Viewer and Stats | N                                       | Next attractor                                                   |
| Everywhere       | F                                       | Toggle fullscreen                                                |
| Viewer and Stats | B                                       | Scatter the particles to watch them fall back onto the attractor |

Keys are ignored while Ctrl, Alt or Meta is held, so browser shortcuts keep working. Holding a shortcut down acts once,
while a held arrow keeps moving a focused value.
While the benchmark runs, R and N do nothing and the parameters, the system and option buttons and the mark are
disabled.

## How it works

Each particle is one texel in a pair of RGBA32F textures. One holds the position and the smoothed Lyapunov exponent,
the other holds the shadow offset used to measure it. Every frame runs these passes, named as in the benchmark table.

| Pass       | What it does                                                                                                                                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Simulate   | Advances every particle with RK4 substeps, at most 64 per frame. A particle that escapes respawns at the position of a random donor.                                                                                                                          |
| Splat      | Draws each particle as an energy-conserving gaussian into an RGBA16F buffer with additive blending. Out-of-focus particles get a larger gaussian and are kept with probability (σ₀/σ)² at weight 1/p, so depth of field costs about as much as a sharp image. |
| Accumulate | Blends the frame into the long-exposure history with weight 1 − exp(−dt/0.11 s), so trails look the same at any frame rate.                                                                                                                                   |
| Bloom down | Downsamples a six-level mip chain, with a Karis average on the first level against fireflies (Jimenez 2014).                                                                                                                                                  |
| Meter      | Measures the log-average brightness on bloom level 3 and reads it back asynchronously. Exposure adapts over about 2 s.                                                                                                                                        |
| Bloom up   | Upsamples the chain with a 3×3 tent filter.                                                                                                                                                                                                                   |
| Stats      | Every fourth frame, reduces all particles on the GPU, alternating between their shape (centroid and spread) and their motion (mean speed and mean Lyapunov exponent). These drive the camera framing, the time step and the λ₁ estimate.                      |
| Composite  | Mixes the bloom into the history, applies the exposure, then AgX tone mapping and dithering.                                                                                                                                                                  |

Once per second, outside this list, a histogram pass gathers the finite-time exponents of a 64 by 64 grid of particles
into 48 bins across the attractor's colour range for the Statistics page. It counts by gathering, without blending, so
it works without `EXT_float_blend`.

The `src/engine` folder is plain TypeScript and WebGL2 and never imports Angular. `src/app` holds the Angular
components and a signal store. It drives the engine through the `AttractorEngine` facade and reads the preset and
quality definitions from the engine modules.

## Lyapunov exponent

The viewer uses Benettin's method. Every particle carries a shadow offset δ of length d₀, which is 10⁻³ of the
attractor's half extent. After each RK4 step the offset becomes δ = rk4(p + δ) − rk4(p). Once per frame the
particle's growth |δ|/d₀ gives a rate ln(growth)/t, where t is the simulated time of that frame, and δ is scaled
back to d₀. The rate, smoothed over one second, is the finite-time exponent used for colour. Its mean over all
particles, averaged over 10 seconds, is the λ₁ shown on the seismograph and on the Statistics page. Both say
"measuring" until 25 seconds after an attractor switch or after a parameter glide ends.

The table lists values measured in this viewer once the estimate settles.

| System                   | λ₁ in the viewer                         | Expected                                                                      |
| ------------------------ | ---------------------------------------- | ----------------------------------------------------------------------------- |
| Lorenz σ 10, ρ 28, β 8/3 | 0.905                                    | 0.9056, the published value                                                   |
| Lorenz ρ 20              | −0.155                                   | −0.155, the real part of the leading eigenvalue at the stable fixed points C± |
| Lorenz ρ 99.65           | −0.03 to +0.01 after 3 to 4 minutes      | 0, a periodic orbit                                                           |
| Halvorsen a 1.4          | 0.679                                    |                                                                               |
| Burke-Shaw s 10, v 4.272 | 0.696                                    |                                                                               |
| Aizawa defaults          | about 0.07, drifting by a few hundredths |                                                                               |

Halving the time step, multiplying d₀ by 10 and switching from Low to Ultra each moved the Lorenz value by less than
0.001.

## Performance

The Run button under Device on the Statistics page renders 120 frames back to back for each quality and waits for the
GPU with a 1×1 pixel read,
because Firefox offers no GPU timer queries for WebGL2. Then it times each pass alone in the same way, so the pass
columns do not add up to the frame time.

The numbers below come from headless Firefox 157 on an NVIDIA RTX 2060 with Linux, showing the Lorenz attractor at a
16.7 ms frame interval. Times are milliseconds per frame.

### Frame times

| Quality | Particles | Frame at 1920×1080 | Frame at 1920×1200 |
| ------- | --------- | ------------------ | ------------------ |
| Low     | 262 144   | 1.38               | 1.39               |
| Medium  | 1 048 576 | 4.22               | 4.23               |
| High    | 2 097 152 | 8.21               | 8.38               |
| Ultra   | 4 194 304 | 16.21              | 16.23              |

A 144 Hz display leaves 6.9 ms per frame, which fits Medium but not High. A 60 Hz display leaves 16.7 ms, which fits
High comfortably and Ultra only just. That is why the default picks Medium at 100 Hz or more and High below.

### Pass times at 1920×1080

| Quality | Simulate | Splat | Accumulate | Bloom down | Meter | Bloom up | Stats | Composite |
| ------- | -------- | ----- | ---------- | ---------- | ----- | -------- | ----- | --------- |
| Low     | 0.08     | 0.92  | 0.07       | 0.11       | 0.01  | 0.08     | 0.03  | 0.12      |
| Medium  | 0.27     | 3.43  | 0.09       | 0.12       | 0.01  | 0.08     | 0.11  | 0.13      |
| High    | 0.55     | 8.37  | 0.09       | 0.12       | 0.01  | 0.08     | 0.18  | 0.13      |
| Ultra   | 1.13     | 16.57 | 0.08       | 0.11       | 0.02  | 0.07     | 0.32  | 0.13      |

Splatting millions of overlapping points dominates. The image passes stay near 0.1 ms each because they work on the
screen, not on the particles.

### WebGL2 capabilities

These values come from the same setup.

| Property                          | Value                                                               |
| --------------------------------- | ------------------------------------------------------------------- |
| Renderer                          | NVIDIA GeForce GTX 980, or similar (Firefox reports a generic name) |
| Version                           | WebGL 2.0                                                           |
| Max texture size                  | 32768                                                               |
| Max draw buffers                  | 8                                                                   |
| Point size range                  | 1 to 2047                                                           |
| `EXT_color_buffer_float`          | yes, required                                                       |
| `EXT_float_blend`                 | yes                                                                 |
| `OES_texture_float_linear`        | yes                                                                 |
| `EXT_disjoint_timer_query_webgl2` | no                                                                  |
| `KHR_parallel_shader_compile`     | no                                                                  |

## Credits

- AgX constants from the minimal AgX implementation by Benjamin Wrensch (MIT licence).
- Bloom filters after Jorge Jimenez, "Next Generation Post Processing in Call of Duty: Advanced Warfare", SIGGRAPH 2014.
- Newsreader, Spline Sans Mono and STIX Two Text fonts under the SIL Open Font License 1.1, see
  [public/fonts/OFL.txt](public/fonts/OFL.txt).

## Licence

MIT, see [LICENSE](LICENSE).
