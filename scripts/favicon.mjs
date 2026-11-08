import { writeFileSync } from 'node:fs';
import { crc32, deflateSync } from 'node:zlib';

const PALETTE = [
  [0, [30, 46, 120]],
  [0.35, [48, 140, 172]],
  [0.62, [120, 204, 196]],
  [0.84, [240, 196, 112]],
  [1, [255, 246, 228]],
];
const PALETTE_FLOOR = 0.35;
const TILE = [11, 13, 12, 255];
const CLEAR = [0, 0, 0, 0];
const DT = 0.004;
const SKIP_STEPS = 3000;
const KEEP_STEPS = 1500;

const lorenz = ([x, y, z]) => [10 * (y - x), x * (28 - z) - y, x * y - (8 / 3) * z];

function trace() {
  const along = (p, k, s) => p.map((v, i) => v + k[i] * s);
  const points = [];
  let p = [1, 1, 1];
  for (let i = 0; i < SKIP_STEPS + KEEP_STEPS; i++) {
    const k1 = lorenz(p);
    const k2 = lorenz(along(p, k1, DT / 2));
    const k3 = lorenz(along(p, k2, DT / 2));
    const k4 = lorenz(along(p, k3, DT));
    p = p.map((v, j) => v + (DT / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
    if (i >= SKIP_STEPS) {
      points.push({ u: p[0], v: -p[2], speed: Math.hypot(...k1) });
    }
  }
  return points;
}

function palette(t) {
  for (let i = 1; i < PALETTE.length; i++) {
    const [start, from] = PALETTE[i - 1];
    const [end, to] = PALETTE[i];
    if (t <= end) {
      const along = (t - start) / (end - start);
      return [...from.map((c, k) => Math.round(c + (to[k] - c) * along)), 255];
    }
  }
  return [...PALETTE.at(-1)[1], 255];
}

function rasterize(points, size) {
  const pad = Math.max(2, size / 8);
  const inner = size - 2 * pad;
  const us = points.map(({ u }) => u);
  const vs = points.map(({ v }) => v);
  const [u0, u1, v0, v1] = [Math.min(...us), Math.max(...us), Math.min(...vs), Math.max(...vs)];
  const span = Math.max(u1 - u0, v1 - v0);
  const offsetU = pad + (inner - ((u1 - u0) / span) * inner) / 2;
  const offsetV = pad + (inner - ((v1 - v0) / span) * inner) / 2;
  const count = new Array(size * size).fill(0);
  const speed = new Array(size * size).fill(0);
  for (const point of points) {
    const x = Math.min(size - 1, Math.floor(offsetU + ((point.u - u0) / span) * inner));
    const y = Math.min(size - 1, Math.floor(offsetV + ((point.v - v0) / span) * inner));
    count[y * size + x]++;
    speed[y * size + x] += point.speed;
  }
  const mean = count.map((n, k) => (n > 0 ? speed[k] / n : null));
  const sorted = mean.filter((m) => m !== null).sort((a, b) => a - b);
  const percentile = (f) => sorted[Math.floor(f * (sorted.length - 1))];
  const [low, high] = [percentile(0.05), percentile(0.95)];
  return mean.map((m, k) => {
    const x = k % size;
    const y = Math.floor(k / size);
    if ((x === 0 || x === size - 1) && (y === 0 || y === size - 1)) {
      return CLEAR;
    }
    if (m === null) {
      return TILE;
    }
    const s = Math.min(1, Math.max(0, (m - low) / (high - low)));
    return palette(PALETTE_FLOOR + (1 - PALETTE_FLOOR) * s);
  });
}

function toSvg(pixels, size) {
  const rects = pixels
    .map(([r, g, b, a], k) =>
      a === 0 ? '' : `<rect x="${k % size}" y="${Math.floor(k / size)}" width="1" height="1" fill="rgb(${r},${g},${b})"/>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">${rects}</svg>\n`;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function toPng(pixels, size) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 6, 0, 0, 0], 8);
  const rows = [];
  for (let y = 0; y < size; y++) {
    rows.push(Buffer.from([0, ...pixels.slice(y * size, (y + 1) * size).flat()]));
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const points = trace();
writeFileSync('public/favicon.svg', toSvg(rasterize(points, 16), 16));
writeFileSync('public/favicon.png', toPng(rasterize(points, 32), 32));
