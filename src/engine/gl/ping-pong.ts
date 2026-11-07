import { RenderTarget, TargetFormat } from './target';

export class PingPong {
  private targets: [RenderTarget, RenderTarget];

  constructor(gl: WebGL2RenderingContext, width: number, height: number, format: TargetFormat) {
    this.targets = [
      new RenderTarget(gl, width, height, format),
      new RenderTarget(gl, width, height, format),
    ];
  }

  get read(): RenderTarget {
    return this.targets[0];
  }

  get write(): RenderTarget {
    return this.targets[1];
  }

  swap(): void {
    const [read, write] = this.targets;
    this.targets = [write, read];
  }

  dispose(): void {
    this.targets.forEach((target) => target.dispose());
  }
}
