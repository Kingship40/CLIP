/**
 * 7-State Kalman Filter for 2D Bounding Box Tracking.
 * State vector: [center_x, center_y, scale (area), aspect_ratio, vel_x, vel_y, vel_scale]
 */

import { NormalizedRect } from './types';

export class KalmanBoxTracker {
  // State vector [cx, cy, s, r, vx, vy, vs]
  private x: Float64Array;
  // Covariance matrix 7x7
  private P: Float64Array;

  // Process noise covariance constants
  private stdPos: number = 0.05;
  private stdVel: number = 0.00625;

  // Measurement noise covariance constants
  private stdMeasPos: number = 0.06;

  constructor(initialBox: NormalizedRect) {
    this.x = new Float64Array(7);
    this.P = new Float64Array(49);

    const cx = initialBox.x + initialBox.width / 2;
    const cy = initialBox.y + initialBox.height / 2;
    const s = Math.max(0.0001, initialBox.width * initialBox.height);
    const r = Math.max(0.1, initialBox.width / Math.max(0.0001, initialBox.height));

    this.x[0] = cx;
    this.x[1] = cy;
    this.x[2] = s;
    this.x[3] = r;
    this.x[4] = 0; // vx
    this.x[5] = 0; // vy
    this.x[6] = 0; // vs

    // Initialize diagonal covariance
    for (let i = 0; i < 7; i++) {
      if (i < 4) {
        this.P[i * 7 + i] = 1.0;
      } else {
        this.P[i * 7 + i] = 10.0; // Higher initial uncertainty for velocity
      }
    }
  }

  /**
   * Predicts the state ahead by 1 time step dt.
   */
  public predict(dt: number = 1.0): NormalizedRect {
    // x = F * x
    this.x[0] += this.x[4] * dt;
    this.x[1] += this.x[5] * dt;
    this.x[2] = Math.max(0.0001, this.x[2] + this.x[6] * dt);
    // r (aspect ratio) remains relatively constant

    // Damping on velocities to prevent wild extrapolation
    this.x[4] *= 0.92;
    this.x[5] *= 0.92;
    this.x[6] *= 0.92;

    // Process noise Q addition to P
    const qPos = Math.pow(this.stdPos, 2);
    const qVel = Math.pow(this.stdVel, 2);

    this.P[0] += qPos;
    this.P[8] += qPos;
    this.P[16] += qPos;
    this.P[24] += qPos;
    this.P[32] += qVel;
    this.P[40] += qVel;
    this.P[48] += qVel;

    return this.getStateBox();
  }

  /**
   * Updates the state with a new bounding box measurement.
   */
  public update(box: NormalizedRect): void {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const s = Math.max(0.0001, box.width * box.height);
    const r = Math.max(0.1, box.width / Math.max(0.0001, box.height));

    const z = [cx, cy, s, r];

    // Kalman gain approximation for 4-element measurement [cx, cy, s, r]
    const rNoise = Math.pow(this.stdMeasPos, 2);

    for (let i = 0; i < 4; i++) {
      const pIdx = i * 7 + i;
      const error = z[i] - this.x[i];
      const k = this.P[pIdx] / (this.P[pIdx] + rNoise);

      // State update
      this.x[i] += k * error;
      if (i < 3) {
        // Velocity update proportional to residual
        this.x[i + 4] += (k * 0.5) * error;
      }

      // Covariance update
      this.P[pIdx] *= 1 - k;
    }

    // Clamp values to valid ranges
    this.x[0] = Math.max(0, Math.min(1, this.x[0]));
    this.x[1] = Math.max(0, Math.min(1, this.x[1]));
    this.x[2] = Math.max(0.0001, Math.min(1.0, this.x[2]));
    this.x[3] = Math.max(0.3, Math.min(2.5, this.x[3]));
  }

  /**
   * Converts internal [cx, cy, s, r] state back to a normalized bounding box.
   */
  public getStateBox(): NormalizedRect {
    const s = Math.max(0.0001, this.x[2]);
    const r = Math.max(0.1, this.x[3]);

    const w = Math.sqrt(s * r);
    const h = s / Math.max(0.0001, w);

    const x = this.x[0] - w / 2;
    const y = this.x[1] - h / 2;

    return {
      x: Math.max(0, Math.min(1 - w, x)),
      y: Math.max(0, Math.min(1 - h, y)),
      width: Math.max(0.01, Math.min(1.0, w)),
      height: Math.max(0.01, Math.min(1.0, h)),
    };
  }

  /**
   * Returns estimated velocities [vx, vy, vw, vh].
   */
  public getVelocities(): { vx: number; vy: number; vw: number; vh: number } {
    return {
      vx: this.x[4],
      vy: this.x[5],
      vw: this.x[6] * 0.5,
      vh: this.x[6] * 0.5,
    };
  }
}
