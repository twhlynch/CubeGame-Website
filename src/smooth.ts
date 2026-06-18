import * as THREE from 'three';

export class Interpolator {
	private prevTime = 0;
	readonly convergence: number;

	constructor(convergence = 10) {
		this.convergence = convergence;
	}

	tick(time: DOMHighResTimeStamp): number {
		if (this.prevTime === 0) {
			this.prevTime = time;
			return 0;
		}
		const dt = (time - this.prevTime) / 1000;
		this.prevTime = time;
		return 1 - Math.exp(-dt * this.convergence);
	}
}

export class SmoothVec3 {
	cur = new THREE.Vector3();
	tgt = new THREE.Vector3();

	set(x: number, y: number, z: number): void {
		this.tgt.set(x, y, z);
	}

	update(alpha: number): void {
		this.cur.lerp(this.tgt, alpha);
		if (this.cur.distanceToSquared(this.tgt) < 1e-12) {
			this.cur.copy(this.tgt);
		}
	}

	snap(): void {
		this.cur.copy(this.tgt);
	}

	apply(v: THREE.Vector3): void {
		v.copy(this.cur);
	}

	reset(): void {
		this.cur.set(0, 0, 0);
		this.tgt.set(0, 0, 0);
	}
}

export class SmoothQuat {
	cur = new THREE.Quaternion();
	tgt = new THREE.Quaternion();

	set(x: number, y: number, z: number, w: number): void {
		this.tgt.set(x, y, z, w);
	}

	update(alpha: number): void {
		this.cur.slerp(this.tgt, alpha);
		if (this.cur.angleTo(this.tgt) < 1e-6) {
			this.cur.copy(this.tgt);
		}
	}

	snap(): void {
		this.cur.copy(this.tgt);
	}

	apply(q: THREE.Quaternion): void {
		q.copy(this.cur);
	}

	reset(): void {
		this.cur.identity();
		this.tgt.identity();
	}
}
