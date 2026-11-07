export type TargetFormat = 'rgba32f' | 'rgba16f';

export class RenderTarget {
  private readonly framebuffer: WebGLFramebuffer;
  private readonly textures: WebGLTexture[] = [];

  constructor(
    private readonly gl: WebGL2RenderingContext,
    readonly width: number,
    readonly height: number,
    format: TargetFormat,
    attachments = 1,
  ) {
    const float32 = format === 'rgba32f';
    const filter = float32 ? gl.NEAREST : gl.LINEAR;
    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    for (let index = 0; index < attachments; index++) {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texStorage2D(gl.TEXTURE_2D, 1, float32 ? gl.RGBA32F : gl.RGBA16F, width, height);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0 + index,
        gl.TEXTURE_2D,
        texture,
        0,
      );
      this.textures.push(texture);
    }
    gl.drawBuffers(this.textures.map((_, index) => gl.COLOR_ATTACHMENT0 + index));
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      this.dispose();
      throw new Error(
        `Render target ${width}x${height} ${format} is incomplete (status 0x${status.toString(16)}).`,
      );
    }
  }

  bind(): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    this.gl.viewport(0, 0, this.width, this.height);
  }

  clear(color: [number, number, number, number]): void {
    this.bind();
    this.gl.clearBufferfv(this.gl.COLOR, 0, color);
  }

  bindTexture(unit: number, attachment = 0): void {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[attachment]);
  }

  dispose(): void {
    this.gl.deleteFramebuffer(this.framebuffer);
    this.textures.forEach((texture) => this.gl.deleteTexture(texture));
  }
}
