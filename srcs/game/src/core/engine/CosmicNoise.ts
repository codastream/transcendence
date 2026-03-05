// ============================================================================
// CosmicNoise — Simplex noise field used for visual background + ball forces
// Extracted from game.noise.ts — no functional changes
// ============================================================================

import { createNoise3D } from 'simplex-noise';
import Alea from 'alea';
import { Vector2 } from './Vector2.js';

interface Coordinate {
  x: number;
  y: number;
}

function map(
  value: number,
  valueMin: number,
  valueMax: number,
  mapMin: number,
  mapMax: number,
): number {
  return mapMin + ((value - valueMin) / (valueMax - valueMin)) * (mapMax - mapMin);
}

export class CosmicNoise {
  private noise3D: ReturnType<typeof createNoise3D>;
  forceField: number[][];
  height: number;
  width: number;
  size: number;

  constructor(w: number, h: number, size: number, seed: number = Date.now()) {
    const prng = Alea(seed);
    this.noise3D = createNoise3D(prng);
    this.width = w;
    this.height = h;
    this.size = size;
    this.forceField = this.getField(w, h, size, 0);
  }

  getCoordAt(pixelX: number, pixelY: number): Coordinate | null {
    const x = Math.floor(pixelX / this.size);
    const y = Math.floor(pixelY / this.size);

    const gridHeight = this.forceField.length;
    const gridWidth = this.forceField[0]?.length || 0;

    if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) {
      return null;
    }
    return { x, y };
  }

  update(time: number): void {
    this.forceField = this.getField(this.width, this.height, this.size, time);
  }

  getNoiseAt(x: number, y: number): number | null {
    const coord = this.getCoordAt(x, y);
    if (!coord) return null;
    return this.forceField[coord.y][coord.x];
  }

  addNoiseTo(coord: Coordinate, delta: number): void {
    const fractionalDelta = ((delta % 1) + 1) % 1;
    this.forceField[coord.y][coord.x] =
      (((this.forceField[coord.y][coord.x] + fractionalDelta) % 1) + 1) % 1;
  }

  affectedFrom(pos: Vector2, spread: number, intensity: number): void {
    const x = pos.x;
    const y = pos.y;
    const spreadingPixels = spread * this.size;
    const spreadingSquared = spreadingPixels * spreadingPixels;

    const coord = this.getCoordAt(x, y);
    if (!coord) return;

    const spreadingCells = Math.ceil(spreadingPixels / this.size);
    const gridHeight = this.forceField.length;
    const gridWidth = this.forceField[0]?.length || 0;

    for (let gridJ = -spreadingCells; gridJ <= spreadingCells; gridJ++) {
      for (let gridI = -spreadingCells; gridI <= spreadingCells; gridI++) {
        const targetX = coord.x + gridI;
        const targetY = coord.y + gridJ;

        if (targetX < 0 || targetX >= gridWidth || targetY < 0 || targetY >= gridHeight) {
          continue;
        }

        const targetPixelX = targetX * this.size + this.size / 2;
        const targetPixelY = targetY * this.size + this.size / 2;

        const dx = targetPixelX - x;
        const dy = targetPixelY - y;
        const distSquared = dx * dx + dy * dy;

        if (distSquared > spreadingSquared) continue;

        const dist = Math.sqrt(distSquared);
        const diff = map(dist, 0, spreadingPixels, intensity, 0);

        this.addNoiseTo({ x: targetX, y: targetY }, diff);
      }
    }
  }

  /** Convert noise at position to a unit direction vector */
  getVectorAt(
    x: number,
    y: number,
    time: number,
    scale: number = 0.05,
    offsetX: number = 0,
    offsetY: number = 0,
  ): Vector2 {
    const value = (this.noise3D((x + offsetX) * scale, (y + offsetY) * scale, time) + 1) / 2;
    const angle = value * Math.PI * 2;
    return new Vector2(Math.cos(angle), Math.sin(angle));
  }

  /** Generate the full noise grid */
  getField(
    width: number,
    height: number,
    pixelSize: number,
    time: number,
    scale: number = 0.005,
    offsetX: number = 0,
    offsetY: number = 0,
    normalize: boolean = true,
  ): number[][] {
    const gridWidth = Math.ceil(width / pixelSize);
    const gridHeight = Math.ceil(height / pixelSize);

    const field: number[][] = [];

    for (let gridY = 0; gridY < gridHeight; gridY++) {
      const row: number[] = [];
      for (let gridX = 0; gridX < gridWidth; gridX++) {
        const worldX = (gridX * pixelSize + offsetX) * scale;
        const worldY = (gridY * pixelSize + offsetY) * scale;

        let value = this.noise3D(worldX, worldY, time);
        if (normalize) {
          value = (value + 1) / 2;
        }
        row.push(value);
      }
      field.push(row);
    }
    return field;
  }
}
