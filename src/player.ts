import { SmoothVec3, SmoothQuat } from './smooth';
import * as THREE from 'three';

export class Player {
	private pos = new SmoothVec3();
	private quat = new SmoothQuat();
	readonly marker: THREE.Mesh;
	hasPosition = false;
	hasRotation = false;

	constructor(scene: THREE.Scene) {
		this.marker = new THREE.Mesh(
			new THREE.SphereGeometry(0.05, 12, 8),
			new THREE.MeshBasicMaterial({ color: 0xe0a363 }),
		);
		scene.add(this.marker);
	}

	setPosition(x: number, y: number, z: number) {
		this.pos.set(x, y, z);
		this.hasPosition = true;
	}

	setQuat(x: number, y: number, z: number, w: number) {
		this.quat.set(x, y, z, w);
		this.hasRotation = true;
	}

	update(alpha: number) {
		if (!this.hasPosition) return;
		this.pos.update(alpha);
		this.pos.apply(this.marker.position);
		if (this.hasRotation) {
			this.quat.update(alpha);
			this.quat.apply(this.marker.quaternion);
		}
	}

	reset() {
		this.hasPosition = false;
		this.hasRotation = false;
		this.marker.position.set(0, 0, 0);
		this.pos.reset();
		this.quat.reset();
	}
}
