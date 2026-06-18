import * as THREE from 'three';
import { createMaterial } from './shader';

function linearToSRGB(c: number): number {
	return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1.0 / 2.4) - 0.055;
}

function createLinearColor(r: number, g: number, b: number): THREE.Color {
	return new THREE.Color(linearToSRGB(r), linearToSRGB(g), linearToSRGB(b));
}

const COLORS = [
	createLinearColor(1.0, 0.0, 0.0),
	createLinearColor(0.0, 1.0, 0.0),
	createLinearColor(0.0, 0.0, 1.0),
	createLinearColor(1.0, 1.0, 0.0),
	createLinearColor(1.0, 0.2, 0.0),
	createLinearColor(0.5, 0.0, 1.0),
	createLinearColor(1.0, 1.0, 1.0), 
	createLinearColor(0.2, 0.2, 0.2),
	createLinearColor(0.0, 0.0, 0.0),
];

function makeGeometry(type: number) {
	// prettier-ignore
	switch (type) {
		case 0: return new THREE.BoxGeometry(2, 2, 2).toNonIndexed();
		case 1: return new THREE.SphereGeometry(1, 12, 12).toNonIndexed();
		case 2: return createPyramidGeometry();
		case 3: return new THREE.BoxGeometry(1, 2, 1).toNonIndexed();
		case 4: return new THREE.CylinderGeometry(1, 1, 1, 12).toNonIndexed();
		default: return new THREE.BoxGeometry(2, 2, 2).toNonIndexed();
	}
}

function createPyramidGeometry(): THREE.BufferGeometry {
	const size = 1.0;
	const geometry = new THREE.BufferGeometry();

	const vertices = new Float32Array([
		0, size, 0, -size, -size, size, size, -size, size,
		0, size, 0, size, -size, size, size, -size, -size,
		0, size, 0, size, -size, -size, -size, -size, -size,
		0, size, 0, -size, -size, -size, -size, -size, size,
		-size, -size, size, -size, -size, -size, size, -size, -size,
		size, -size, -size, size, -size, size, -size, -size, size,
	]);

	const normals = new Float32Array([
		0, 0.707, 0.707, 0, 0.707, 0.707, 0, 0.707, 0.707,
		0.707, 0.707, 0, 0.707, 0.707, 0, 0.707, 0.707, 0,
		0, 0.707, -0.707, 0, 0.707, -0.707, 0, 0.707, -0.707,
		-0.707, 0.707, 0, -0.707, 0.707, 0, -0.707, 0.707, 0,
		0, -1, 0, 0, -1, 0, 0, -1, 0,
		0, -1, 0, 0, -1, 0, 0, -1, 0,
	]);

	geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
	geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));

	return geometry;
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
			const mat = createMaterial(color);
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
