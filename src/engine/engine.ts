import { AttractorPreset } from './attractors/attractor';
import { LiveAttractor } from './attractors/live-attractor';
import { ATTRACTORS, findAttractor } from './attractors/registry';
import { FrameClock, smoothing } from './frame-clock';
import { createGlContext, GlCaps } from './gl/context';
import { PingPong } from './gl/ping-pong';
import { OrbitControls } from './input/orbit-controls';
import { LyapunovEstimate, LyapunovReading } from './lyapunov-estimate';
import { OrbitCamera } from './math/orbit-camera';
import { AccumulatePass } from './passes/accumulate';
import { BloomPass } from './passes/bloom';
import { BlowUpPass } from './passes/blow-up';
import { CompositePass } from './passes/composite';
import { ExposureMeter, METER_LEVEL } from './passes/exposure-meter';
import { PresetPrograms } from './passes/preset-programs';
import { SeedPass } from './passes/seed';
import { SimulatePass } from './passes/simulate';
import { SplatPass, SplatView } from './passes/splat';
import { FtleHistogram, FtleHistogramPass } from './passes/ftle-histogram';
import { ParticleStats, StatsPass } from './passes/stats';
import { ColorMode, findQuality, QUALITIES, QualityPreset } from './settings';

export interface EngineStats {
  fps: number;
  particles: number;
  exposure: number;
  lyapunov: LyapunovReading;
  cloud: ParticleStats | null;
  timeStep: number;
  substeps: number;
  gliding: boolean;
  ftle: FtleHistogram | null;
}

export interface BenchmarkRow {
  quality: string;
  particles: number;
  frameMs: number;
  passMs: number[];
}

export interface BenchmarkReport {
  intervalMs: number;
  passes: string[];
  rows: BenchmarkRow[];
}

interface PipelineStep {
  name: string;
  run: (dt: number, exposure: number) => void;
}

const STATS_INTERVAL_SECONDS = 0.25;
const HISTOGRAM_INTERVAL_SECONDS = 1;
const ANCHOR_WARMUP_STEPS = 3000;
const STATE_ATTACHMENTS = 2;
const INITIAL_AZIMUTH = 0.4 - Math.PI / 2;
const ELEVATION = -0.38;
const CAMERA_DISTANCE = 3.4;
const FOCAL_LENGTH = 2.72;
const APERTURE = 0.022;
const TRAIL_SECONDS = 0.11;
const BENCHMARK_FRAMES = 120;
const BENCHMARK_WARMUP_FRAMES = 10;

const nextTask = () => new Promise<void>((resolve) => setTimeout(resolve));

export class AttractorEngine {
  readonly caps: GlCaps;
  private readonly gl: WebGL2RenderingContext;
  private readonly clock = new FrameClock();
  private attractor = new LiveAttractor(ATTRACTORS[0]);
  private quality: QualityPreset;
  private colorMode: ColorMode = 'speed';
  private state: PingPong;
  private readonly anchor: PingPong;
  private readonly programs: PresetPrograms;
  private readonly seed: SeedPass;
  private readonly simulate: SimulatePass;
  private readonly splat: SplatPass;
  private readonly accumulate: AccumulatePass;
  private readonly bloom: BloomPass;
  private readonly meter: ExposureMeter;
  private readonly stats: StatsPass;
  private readonly histogram: FtleHistogramPass;
  private readonly lyapunov = new LyapunovEstimate();
  private readonly composite: CompositePass;
  private readonly blowUp: BlowUpPass;
  private history: PingPong;
  private readonly pipeline: PipelineStep[];
  private readonly pixel = new Uint8Array(4);
  private readonly resizeObserver: ResizeObserver;
  private pendingSize: [number, number] | null = null;
  private readonly camera = new OrbitCamera();
  private readonly controls: OrbitControls;
  private statsListener: ((stats: EngineStats) => void) | null = null;
  private frameSeconds = 1 / 60;
  private sinceStats = 0;
  private cloud: ParticleStats | null = null;
  private ftleCounts: number[] | null = null;
  private sinceHistogram = HISTOGRAM_INTERVAL_SECONDS;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    qualityId: string,
  ) {
    const { gl, caps } = createGlContext(canvas);
    this.gl = gl;
    this.caps = caps;
    this.quality = findQuality(qualityId);
    this.state = this.createState(this.quality);
    this.anchor = new PingPong(gl, 1, 1, 'rgba32f', STATE_ATTACHMENTS);
    this.seed = new SeedPass(gl);
    this.programs = new PresetPrograms(gl);
    this.simulate = new SimulatePass(gl, this.programs);
    this.splat = new SplatPass(
      gl,
      this.programs,
      caps.extensions['EXT_float_blend'],
      caps.pointSizeRange[1],
      ...this.screenSize(),
    );
    this.accumulate = new AccumulatePass(gl);
    this.bloom = new BloomPass(gl);
    this.meter = new ExposureMeter(gl);
    this.resizeBloom();
    this.stats = new StatsPass(gl, this.programs);
    this.histogram = new FtleHistogramPass(gl);
    this.composite = new CompositePass(gl);
    this.blowUp = new BlowUpPass(gl);
    this.history = this.createHistory();
    this.pipeline = this.createPipeline();
    this.camera.azimuth = INITIAL_AZIMUTH;
    this.camera.elevation = ELEVATION;
    this.camera.focalLength = FOCAL_LENGTH;
    this.controls = new OrbitControls(canvas, this.camera);
    this.reseed();
    this.resizeObserver = new ResizeObserver(([entry]) => {
      const box = entry.devicePixelContentBoxSize?.[0];
      const ratio = window.devicePixelRatio;
      this.pendingSize = box
        ? [box.inlineSize, box.blockSize]
        : [
            Math.round(entry.contentRect.width * ratio),
            Math.round(entry.contentRect.height * ratio),
          ];
    });
    try {
      this.resizeObserver.observe(canvas, { box: 'device-pixel-content-box' });
    } catch {
      this.resizeObserver.observe(canvas);
    }
  }

  start(): void {
    this.clock.start((dt) => this.frame(dt));
  }

  onStats(listener: (stats: EngineStats) => void): void {
    this.statsListener = listener;
  }

  blowUpParticles(): void {
    this.blowUp.run(this.state, this.preset);
  }

  setAttractor(id: string): void {
    const preset = findAttractor(id);
    if (preset === this.preset) {
      return;
    }
    this.attractor = new LiveAttractor(preset);
    this.stats.invalidate();
    this.cloud = null;
    this.histogram.invalidate();
    this.ftleCounts = null;
    this.lyapunov.restart();
    this.reseed();
  }

  setParam(name: string, value: number): void {
    this.attractor.setParam(name, value);
  }

  setQuality(id: string): void {
    const quality = findQuality(id);
    if (quality === this.quality) {
      return;
    }
    this.quality = quality;
    const previous = this.state;
    this.state = this.createState(quality);
    this.seed.resample(this.state.read, previous.read, this.preset);
    previous.dispose();
  }

  setColorMode(mode: ColorMode): void {
    this.colorMode = mode;
  }

  async benchmark(): Promise<BenchmarkReport> {
    const dt = this.frameSeconds;
    const original = this.state;
    const rows: BenchmarkRow[] = [];
    for (const quality of QUALITIES) {
      const temporary = this.createState(quality);
      this.seed.resample(temporary.read, original.read, this.preset);
      this.state = temporary;
      rows.push(await this.benchmarkQuality(quality, dt));
      this.state = original;
      temporary.dispose();
    }
    return { intervalMs: dt * 1000, passes: this.pipeline.map((step) => step.name), rows };
  }

  dispose(): void {
    this.clock.stop();
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  private frameCamera(): void {
    this.camera.target = this.attractor.center;
    this.camera.distance = this.framingDistance() * this.controls.zoom;
  }

  private reseed(): void {
    this.anchor.read.clear([...this.preset.start, 0]);
    this.anchor.read.clear([this.attractor.shadowDistance, 0, 0, 0], 1);
    this.simulate.runSteps(this.anchor, this.attractor, ANCHOR_WARMUP_STEPS);
    this.seed.run(this.state.read, this.anchor.read, this.preset);
  }

  private frame(dt: number): void {
    this.applyPendingSize();
    this.controls.update(dt);
    const exposure = this.meter.update(dt);
    const particleStats = this.stats.poll();
    if (particleStats) {
      this.cloud = particleStats;
      this.lyapunov.observe(particleStats.meanFtle);
    }
    this.attractor.follow(particleStats, dt);
    this.frameCamera();
    this.render(dt, exposure);
    this.measureHistogram(dt);
    this.reportStats(dt, exposure);
  }

  private measureHistogram(dt: number): void {
    this.sinceHistogram += dt;
    if (this.sinceHistogram >= HISTOGRAM_INTERVAL_SECONDS) {
      this.sinceHistogram = 0;
      this.histogram.measure(this.state.read, this.preset.ftleRange);
    }
    this.ftleCounts = this.histogram.poll() ?? this.ftleCounts;
  }

  private render(dt: number, exposure: number): void {
    for (const step of this.pipeline) {
      step.run(dt, exposure);
    }
  }

  private createPipeline(): PipelineStep[] {
    return [
      {
        name: 'Simulate',
        run: (dt) => this.simulate.run(this.state, this.attractor, dt * this.attractor.timeScale),
      },
      {
        name: 'Splat',
        run: () =>
          this.splat.run(this.state.read, this.attractor, this.splatView(), this.colorMode),
      },
      {
        name: 'Accumulate',
        run: (dt) =>
          this.accumulate.run(this.history, this.splat.output, smoothing(dt, TRAIL_SECONDS)),
      },
      {
        name: 'Bloom down',
        run: (_, exposure) => this.bloom.downsample(this.history.read, exposure),
      },
      { name: 'Meter', run: () => this.meter.measure(this.bloom.level(METER_LEVEL)) },
      { name: 'Bloom up', run: () => this.bloom.upsample() },
      { name: 'Stats', run: () => this.stats.measure(this.state.read, this.attractor) },
      {
        name: 'Composite',
        run: (_, exposure) => this.composite.run(this.history.read, this.bloom.output, exposure),
      },
    ];
  }

  private get preset(): AttractorPreset {
    return this.attractor.preset;
  }

  private framingDistance(): number {
    return CAMERA_DISTANCE * this.attractor.halfExtent;
  }

  private splatView(): SplatView {
    const [width, height] = this.screenSize();
    const focalPixels = (this.camera.focalLength * Math.min(width, height)) / 2;
    return {
      viewProjection: this.camera.viewProjection(width, height),
      referenceDepth: this.framingDistance(),
      focusDistance: this.camera.distance,
      blurScale: APERTURE * this.attractor.halfExtent * focalPixels,
    };
  }

  private async benchmarkQuality(quality: QualityPreset, dt: number): Promise<BenchmarkRow> {
    const exposure = this.meter.update(0);
    for (let frame = 0; frame < BENCHMARK_WARMUP_FRAMES; frame++) {
      this.render(dt, exposure);
    }
    const frameMs = this.timeFrames(() => this.render(dt, exposure));
    const passMs: number[] = [];
    for (const step of this.pipeline) {
      await nextTask();
      passMs.push(this.timeFrames(() => step.run(dt, exposure)));
    }
    return { quality: quality.name, particles: quality.width * quality.height, frameMs, passMs };
  }

  private timeFrames(run: () => void): number {
    this.waitForGpu();
    const start = performance.now();
    for (let frame = 0; frame < BENCHMARK_FRAMES; frame++) {
      run();
    }
    this.waitForGpu();
    return (performance.now() - start) / BENCHMARK_FRAMES;
  }

  private waitForGpu(): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.pixel);
  }

  private applyPendingSize(): void {
    if (this.pendingSize) {
      [this.canvas.width, this.canvas.height] = this.pendingSize;
      this.pendingSize = null;
      this.splat.resize(...this.screenSize());
      this.history.dispose();
      this.history = this.createHistory();
      this.resizeBloom();
    }
  }

  private resizeBloom(): void {
    this.bloom.resize(...this.screenSize());
    const level = this.bloom.level(METER_LEVEL);
    this.meter.resize(level.width, level.height);
  }

  private createState(quality: QualityPreset): PingPong {
    return new PingPong(this.gl, quality.width, quality.height, 'rgba32f', STATE_ATTACHMENTS);
  }

  private createHistory(): PingPong {
    return new PingPong(this.gl, ...this.screenSize(), 'rgba16f');
  }

  private screenSize(): [number, number] {
    return [Math.max(1, this.canvas.width), Math.max(1, this.canvas.height)];
  }

  private reportStats(dt: number, exposure: number): void {
    if (dt <= 0) {
      return;
    }
    this.frameSeconds += (dt - this.frameSeconds) * smoothing(dt, 0.5);
    this.sinceStats += dt;
    if (this.sinceStats >= STATS_INTERVAL_SECONDS) {
      const lyapunov = this.lyapunov.sample(this.sinceStats, this.attractor.gliding);
      this.sinceStats = 0;
      this.statsListener?.({
        fps: 1 / this.frameSeconds,
        particles: this.quality.width * this.quality.height,
        exposure,
        lyapunov,
        cloud: this.cloud,
        timeStep: this.simulate.step,
        substeps: this.simulate.substeps,
        gliding: this.attractor.gliding,
        ftle:
          this.ftleCounts && this.cloud
            ? { range: this.preset.ftleRange, counts: this.ftleCounts, mean: this.cloud.meanFtle }
            : null,
      });
    }
  }
}
