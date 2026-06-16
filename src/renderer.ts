import * as THREE from 'three';

const COLORS = [
	0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff3300, 0x7f00ff, 0xffffff,
	0x333333, 0x000000,
];

function makeGeometry(type: number) {
	// prettier-ignore
	switch (type) {
		case 0: return new THREE.BoxGeometry(2, 2, 2);
		case 1: return new THREE.SphereGeometry(1, 12, 12);
		case 2: return new THREE.ConeGeometry(1, 2, 4);
		case 3: return new THREE.CylinderGeometry(1, 1, 1, 12);
		case 4: return new THREE.BoxGeometry(1, 2, 1);
		default: return new THREE.BoxGeometry(1, 1, 1);
	}
}

// prettier-ignore
type FullDatum = [
	id: number, idx: number,
	px: number, py: number, pz: number,
	rx: number, ry: number, rz: number, rw: number,
	sx: number, sy: number, sz: number,
]
export type ShapeDatum = [id: number] | FullDatum;

export class ShapeRenderer {
	private scene: THREE.Scene;
	private meshes = new Map<number, THREE.Mesh>();

	constructor(scene: THREE.Scene) {
		this.scene = scene;
	}

	/** update with new shape data */
	update(data: ShapeDatum[]) {
		const seen = new Set<number>();

		for (const s of data) {
			const id = s[0];
			seen.add(id);

			if (s.length == 12) {
				this.updateMesh(s);
			}
		}

		this.dispose(seen);
	}

	/** build or update a mesh from shape data */
	updateMesh(data: FullDatum) {
		const id = data[0];
		const idx = data[1];

		let mesh = this.meshes.get(id);
		if (!mesh) {
			const shape = Math.floor(idx / COLORS.length);
			const color = COLORS[idx % COLORS.length] ?? 0xffffff;

			const geo = makeGeometry(shape);
			const mat = new THREE.MeshBasicMaterial({ color }); // TODO:
			mesh = new THREE.Mesh(geo, mat);

			this.scene.add(mesh);
			this.meshes.set(id, mesh);
		}

		mesh.position.set(data[2], data[3], data[4]);
		mesh.quaternion.set(data[5], data[6], data[7], data[8]);
		mesh.scale.set(data[9], data[10], data[11]);
	}

	/** remove unseen meshes */
	dispose(seen: Set<number>) {
		for (const [index, mesh] of this.meshes) {
			if (!seen.has(index)) {
				this.scene.remove(mesh);
				mesh.geometry.dispose();
				(mesh.material as THREE.Material).dispose();
				this.meshes.delete(index);
			}
		}
	}

	/** clear all meshes */
	clear() {
		for (const [, mesh] of this.meshes) {
			this.scene.remove(mesh);
			mesh.geometry.dispose();
			(mesh.material as THREE.Material).dispose();
		}
		this.meshes.clear();
	}

	/** clear all meshes */
	get count() {
		return this.meshes.size;
	}
}
