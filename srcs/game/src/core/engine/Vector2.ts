// ============================================================================
// Vector2 — Immutable 2D vector
// All operations return a NEW Vector2 instance. No mutation.
// ============================================================================

export class Vector2 {
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  sub(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  mult(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  div(scalar: number): Vector2 {
    if (scalar === 0) return new Vector2(0, 0);
    return new Vector2(this.x / scalar, this.y / scalar);
  }

  length(): number {
    return Math.hypot(this.x, this.y);
  }

  normalize(): Vector2 {
    const len = this.length();
    if (len === 0) return new Vector2(0, 0);
    return new Vector2(this.x / len, this.y / len);
  }

  limit(max: number): Vector2 {
    const len = this.length();
    if (len > max) {
      return this.normalize().mult(max);
    }
    return new Vector2(this.x, this.y);
  }

  withX(x: number): Vector2 {
    return new Vector2(x, this.y);
  }

  withY(y: number): Vector2 {
    return new Vector2(this.x, y);
  }

  static zero(): Vector2 {
    return new Vector2(0, 0);
  }
}
