// import { Vector2 } from './game.vector.ts'
import { Vector2 } from './game.vector.js'

class PerlinNoise {
  private permutation: number[];
  private p: number[];

  constructor(seed: number = 0) {
    this.permutation = this.generatePermutation(seed);
    this.p = [...this.permutation, ...this.permutation];
  }

  private generatePermutation(seed: number): number[] {
    const p: number[] = Array.from({ length: 256 }, (_, i) => i);
    
    // Shuffle using seed - see standard LCG formula: next = (a × current + c) mod m
    let random = seed;
    for (let i = 255; i > 0; i--) {
      random = (random * 9301 + 49297) % 233280;
      const j = Math.floor((random / 233280) * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    
    return p;
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  // Main noise function - returns value between -1 and 1
  public noise(x: number, y: number, z: number): number {
    // Find unit cube that contains point
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    // Find relative x, y, z of point in cube
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    // Compute fade curves for each of x, y, z
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    // Hash coordinates of 8 cube corners
    const A = this.p[X] + Y;
    const AA = this.p[A] + Z;
    const AB = this.p[A + 1] + Z;
    const B = this.p[X + 1] + Y;
    const BA = this.p[B] + Z;
    const BB = this.p[B + 1] + Z;

    // Blend results from 8 corners of cube
    return this.lerp(
      w,
      this.lerp(
        v,
        this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x - 1, y, z)),
        this.lerp(u, this.grad(this.p[AB], x, y - 1, z), this.grad(this.p[BB], x - 1, y - 1, z))
      ),
      this.lerp(
        v,
        this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1), this.grad(this.p[BA + 1], x - 1, y, z - 1)),
        this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1), this.grad(this.p[BB + 1], x - 1, y - 1, z - 1))
      )
    );
  }

  // Normalized noise - returns value between 0 and 1
  public noise01(x: number, y: number, z: number): number {
    return (this.noise(x, y, z) + 1) / 2;
  }

  // Octave noise for more detailed results
  public octaveNoise(
    x: number, 
    y: number, 
    z: number, 
    octaves: number = 4, 
    persistence: number = 0.5
  ): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }
}

// Create instance and export functions
const perlin = new PerlinNoise(12345);

// Simple function that returns Perlin noise value from x, y, z
export function getPerlinNoise(x: number, y: number, z: number): number {
  return perlin.noise(x, y, z); // Returns value between -1 and 1
}

// Normalized version (0 to 1)
export function getPerlinNoise01(x: number, y: number, z: number): number {
  return perlin.noise01(x, y, z);
}

// Multi-octave version for more detail
export function getPerlinNoiseOctave(
  x: number, 
  y: number, 
  z: number, 
  octaves: number = 4
): number {
  return perlin.octaveNoise(x, y, z, octaves);
}

// Generate a 2D force field grid
export function generateForceField2D(
  width: number,
  height: number,
  resolution: number = 20,
  scale: number = 0.05,
  strength: number = 1,
  time: number = 0
): Vector2[] {
  const vectors: Vector2[] = [];
  
  for (let y = 0; y < height; y += resolution) {
    for (let x = 0; x < width; x += resolution) {
      // Use Perlin noise to generate force direction
      const angle = perlin.octaveNoise(
        x * scale, 
        y * scale, 
        time, 
        3
      ) * Math.PI * 2; // Convert noise to angle (0 to 2π)
      
      vectors.push(new Vector2(
          Math.cos(angle) * strength,
          Math.sin(angle) * strength
        )
      );
      time += 0.1;
    }
  }
  
  return vectors;
}

// Get force at a specific 2D point
export function getForceAt2D(
  x: number, 
  y: number, 
  scale: number = 0.05, 
  strength: number = 1,
  time: number = 0
): Vector2 {
  const angle = perlin.noise(x * scale, y * scale, time) * Math.PI * 2;
  //const angle = perlin.octaveNoise(x * scale, y * scale, time, 4) * Math.PI * 2;
  
  const vec = new Vector2( Math.cos(angle) * strength, Math.sin(angle) * strength);
  return vec;
}
