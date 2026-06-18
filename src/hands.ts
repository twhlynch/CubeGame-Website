import { SmoothVec3 } from './smooth';
import * as THREE from 'three';

// prettier-ignore
export type HandDatum = [
	tx: number, ty: number, tz: number,
	ix: number, iy: number, iz: number,
	mx: number, my: number, mz: number,
	rx: number, ry: number, rz: number,
	lx: number, ly: number, lz: number,
];

export class Hands {
	private fingers = Array.from({ length: 10 }, () => new SmoothVec3());
	private groups: [THREE.Group, THREE.Group];

	constructor(scene: THREE.Scene) {
		this.groups = [new THREE.Group(), new THREE.Group()];
		for (let h = 0; h < 2; h++) {
			const group = this.groups[h];
			for (let t = 0; t < 5; t++) {
				const sphere = new THREE.Mesh(
					new THREE.SphereGeometry(0.015, 8, 6),
					new THREE.MeshBasicMaterial({
						color: [0x6e94b2, 0xc48283][h],
					}),
				);
				group.add(sphere);
			}
			scene.add(group);
		}
	}

	setHand(index: number, data: HandDatum) {
		const base = index * 5;
		for (let t = 0; t < 5; t++) {
			const x = data[t * 3];
			const y = data[t * 3 + 1];
			const z = data[t * 3 + 2];
			if (x === 0 && y === 0 && z === 0) continue;
			this.fingers[base + t].set(x, y, z);
		}
	}

	update(alpha: number) {
		for (let i = 0; i < 10; i++) {
			this.fingers[i].update(alpha);
			const h = Math.floor(i / 5);
			const t = i % 5;
			this.fingers[i].apply(
				(this.groups[h].children[t] as THREE.Mesh).position,
			);
		}
	}

	reset() {
		for (const s of this.fingers) s.reset();
		for (const group of this.groups) {
			for (const child of group.children) {
				(child as THREE.Mesh).position.set(0, 0, 0);
			}
		}
	}
}
