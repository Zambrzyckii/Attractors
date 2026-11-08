import { RenderTarget, TargetFormat } from './target';

export class PingPong {
  private targets: [RenderTarget, RenderTarget];

  constructor(
    gl: WebGL2RenderingContext,
    width: number,
    height: number,
    format: TargetFormat,
    attachments = 1,
  ) {
    this.targets = [
      new RenderTarget(gl, width, height, format, attachments),
      new RenderTarget(gl, width, height, format, attachments),
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
