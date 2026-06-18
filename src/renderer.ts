import * as THREE from 'three';
import { createMaterial } from './shader';

const COLORS = [
	new THREE.Color(1.0, 0.0, 0.0), // red
	new THREE.Color(0.0, 1.0, 0.0), // green
	new THREE.Color(0.0, 0.0, 1.0), // blue
	new THREE.Color(1.0, 1.0, 0.0), // yellow
	new THREE.Color(1.0, 0.2, 0.0), // orange
	new THREE.Color(0.5, 0.0, 1.0), // purple
	new THREE.Color(1.0, 1.0, 1.0), // white
	new THREE.Color(0.2, 0.2, 0.2), // gray
	new THREE.Color(0.0, 0.0, 0.0), // black
].map((c) => c.convertLinearToSRGB());

const geometries = [
	new THREE.BoxGeometry(2, 2, 2),
	new THREE.SphereGeometry(1, 12, 12),
	(() => {
		const geometry = new THREE.ConeGeometry(Math.sqrt(2), 2, 4, 1, false);
		geometry.rotateY(Math.PI / 4); // cone is rotated by default
		return geometry;
	})(),
	new THREE.BoxGeometry(1, 2, 1),
	new THREE.CylinderGeometry(1, 1, 1, 12),
	new THREE.BoxGeometry(2, 2, 2),
].map((geometry: THREE.BufferGeometry, i) => {
	if (i === 1) return geometry; // sphere

	// dont smooth shade
	geometry = geometry.toNonIndexed();
	geometry.computeVertexNormals();
	return geometry;
});

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

			const geo = geometries[shape];
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
