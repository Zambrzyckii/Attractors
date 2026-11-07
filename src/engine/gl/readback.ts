import { RenderTarget } from './target';

const SLOTS = 4;

interface Pending {
  buffer: WebGLBuffer;
  fence: WebGLSync;
}

export class Readback {
  private readonly free: WebGLBuffer[] = [];
  private readonly pending: Pending[] = [];
  private readonly result = new Float32Array(4);

  constructor(private readonly gl: WebGL2RenderingContext) {
    for (let index = 0; index < SLOTS; index++) {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buffer);
      gl.bufferData(gl.PIXEL_PACK_BUFFER, this.result.byteLength, gl.STREAM_READ);
      this.free.push(buffer);
    }
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
  }

  request(target: RenderTarget): boolean {
    const gl = this.gl;
    const buffer = this.free.pop();
    if (!buffer) {
      return false;
    }
    target.bind();
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buffer);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, 0);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (!fence) {
      this.free.push(buffer);
      return false;
    }
    this.pending.push({ buffer, fence });
    return true;
  }

  // The returned array is reused by the next poll that finds a finished request.
  poll(): Float32Array | null {
    const gl = this.gl;
    let newest: WebGLBuffer | null = null;
    while (
      this.pending.length > 0 &&
      gl.getSyncParameter(this.pending[0].fence, gl.SYNC_STATUS) === gl.SIGNALED
    ) {
      const { buffer, fence } = this.pending.shift()!;
      gl.deleteSync(fence);
      if (newest) {
        this.free.push(newest);
      }
      newest = buffer;
    }
    if (!newest) {
      return null;
    }
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, newest);
    gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, this.result);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    this.free.push(newest);
    return this.result;
  }

  dispose(): void {
    const gl = this.gl;
    for (const { buffer, fence } of this.pending.splice(0)) {
      gl.deleteSync(fence);
      gl.deleteBuffer(buffer);
    }
    this.free.splice(0).forEach((buffer) => gl.deleteBuffer(buffer));
  }
}
