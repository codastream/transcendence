// ============================================================================
// Ball — Physics entity with position, velocity, acceleration
// Uses immutable Vector2 — internal state is reassigned, not mutated.
// ============================================================================

import { Vector2 } from './Vector2.js';

export class Ball {
  pos: Vector2;
  vel: Vector2;
  acc: Vector2;
  radius: number;
  speedLimit: number;
  mass: number;

  constructor(pos: Vector2, vel: Vector2, radius: number, maxSpeed: number = 3, mass: number = 10) {
    this.pos = pos;
    this.vel = vel;
    this.acc = Vector2.zero();
    this.radius = radius;
    this.speedLimit = maxSpeed;
    this.mass = mass;
  }

  /** Newton's second law: F = m·a → a += F/m */
  apply(force: Vector2): void {
    const f = force.div(this.mass);
    this.acc = this.acc.add(f);
  }

  /** Euler integration step */
  update(): void {
    this.vel = this.vel.add(this.acc).limit(this.speedLimit);
    this.pos = this.pos.add(this.vel);
    this.acc = Vector2.zero();
  }
}
