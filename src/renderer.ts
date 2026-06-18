import * as THREE from 'three';
import { createMaterial } from './shader';
import { SmoothVec3, SmoothQuat } from './smooth';

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
	private pos = new Map<number, SmoothVec3>();
	private quat = new Map<number, SmoothQuat>();
	private scl = new Map<number, SmoothVec3>();
	private fresh = true;

	constructor(scene: THREE.Scene) {
		this.scene = scene;
	}

	/** store latest targets from server */
	update(data: ShapeDatum[]) {
		const seen = new Set<number>();

		for (const s of data) {
			const id = s[0];
			seen.add(id);

			if (s.length == 12) {
				try {
					this.setTargets(s);
				} catch {}
			}
		}

		this.dispose(seen);
		this.fresh = false;
	}

	/** lerp all shapes toward their targets */
	interpolate(alpha: number) {
		for (const [id, p] of this.pos) {
			const mesh = this.meshes.get(id);
			if (!mesh) continue;
			p.update(alpha);
			p.apply(mesh.position);
		}

		for (const [id, q] of this.quat) {
			const mesh = this.meshes.get(id);
			if (!mesh) continue;
			q.update(alpha);
			q.apply(mesh.quaternion);
		}

		for (const [id, s] of this.scl) {
			const mesh = this.meshes.get(id);
			if (!mesh) continue;
			s.update(alpha);
			s.apply(mesh.scale);
		}
	}

	/** build or update a mesh from shape data */
	setTargets(data: FullDatum) {
		const id = data[0];
		const idx = data[1];

		let mesh = this.meshes.get(id);
		const isNew = !mesh;
		if (isNew) {
			const shape = Math.floor(idx / COLORS.length);
			const color = COLORS[idx % COLORS.length] ?? 0xffffff;

			const geo = geometries[shape];
			const mat = createMaterial(color);
			mesh = new THREE.Mesh(geo, mat);

			this.scene.add(mesh);
			this.meshes.set(id, mesh);
			this.pos.set(id, new SmoothVec3());
			this.quat.set(id, new SmoothQuat());
			this.scl.set(id, new SmoothVec3());
		}

		this.pos.get(id)!.set(data[2], data[3], data[4]);
		this.quat.get(id)!.set(data[5], data[6], data[7], data[8]);
		this.scl.get(id)!.set(data[9], data[10], data[11]);

		if (isNew && !this.fresh) {
			this.pos.get(id)!.snap();
			this.quat.get(id)!.snap();
			this.scl.get(id)!.snap();
		}
	}

	/** remove unseen meshes */
	dispose(seen: Set<number>) {
		const dead: Array<[number, THREE.Mesh]> = [];

		for (const [id, mesh] of this.meshes) {
			if (!seen.has(id)) dead.push([id, mesh]);
		}

		for (const [id] of dead) {
			this.meshes.delete(id);
			this.pos.delete(id);
			this.quat.delete(id);
			this.scl.delete(id);
		}

		for (const [, mesh] of dead) {
			this.scene.remove(mesh);
			mesh.geometry.dispose();
			(mesh.material as THREE.Material).dispose();
		}
	}

	/** clear all meshes */
	clear() {
		const all = Array.from(this.meshes.values());

		this.meshes.clear();
		this.pos.clear();
		this.quat.clear();
		this.scl.clear();
		this.fresh = true;

		for (const mesh of all) {
			this.scene.remove(mesh);
			mesh.geometry.dispose();
			(mesh.material as THREE.Material).dispose();
		}
	}

	/** set all targets to origin so shapes lerp away on disconnect */
	disconnect() {
		for (const p of this.pos.values()) p.set(0, 0, 0);
		for (const q of this.quat.values()) q.set(0, 0, 0, 1);
		for (const s of this.scl.values()) s.set(0, 0, 0);
	}

	/** clear all meshes */
	get count() {
		return this.meshes.size;
	}
}
