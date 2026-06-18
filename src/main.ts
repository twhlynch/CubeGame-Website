import './style.css';
import { createScene } from './scene';
import { ShapeRenderer } from './renderer';
import type { ShapeDatum } from './renderer';
import { UI } from './ui';
import { SmoothVec3, SmoothQuat, Interpolator } from './smooth';
import * as THREE from 'three';

// prettier-ignore
type HandDatum = [
	tx: number, ty: number, tz: number,
	ix: number, iy: number, iz: number,
	mx: number, my: number, mz: number,
	rx: number, ry: number, rz: number,
	lx: number, ly: number, lz: number,
];

interface ServerMessage {
	p?: [number, number, number];
	r?: [number, number, number, number];
	s?: ShapeDatum[];
	h?: [HandDatum, HandDatum];
}

function main() {
	const container = document.getElementById('container')!;
	const { scene, camera, controls, renderer, handGroups } =
		createScene(container);
	const shapes = new ShapeRenderer(scene);
	const ui = new UI();

	let ws: WebSocket | null = null;
	let connected = false;
	let disconnectTimer = 0;

	const interp = new Interpolator(10);
	let firstPerson = false;
	const origCamPos = camera.position.clone();
	const origTarget = controls.target.clone();
	const playerPos = new SmoothVec3();
	const playerQuat = new SmoothQuat();
	const handSmooth = Array.from({ length: 10 }, () => new SmoothVec3());
	let hasPlayer = false;
	let hasRotation = false;

	const isRemote =
		window.location.hostname !== 'localhost' &&
		window.location.hostname !== '127.0.0.1';

	ui.onFpvToggle(() => {
		firstPerson = !firstPerson;
		const marker = scene.getObjectByName('player');

		if (firstPerson) {
			controls.enabled = false;
			if (marker) marker.visible = false;
		} else {
			controls.enabled = true;
			camera.position.copy(origCamPos);
			controls.target.copy(origTarget);
			if (marker) marker.visible = true;
		}
		ui.setFpvActive(firstPerson);
	});

	function connect(ip: string, port: number, auto?: boolean) {
		disconnectTimer = 0;
		shapes.clear();
		hasPlayer = false;
		hasRotation = false;

		const marker = scene.getObjectByName('player') as THREE.Mesh;
		if (marker) marker.position.set(0, 0, 0);
		playerPos.reset();
		playerQuat.reset();

		for (const s of handSmooth) s.reset();
		for (const group of handGroups) {
			for (const child of group.children) {
				(child as THREE.Mesh).position.set(0, 0, 0);
			}
		}

		if (ws) {
			ws.close();
			ws = null;
		}

		const url = `ws://${ip}:${port}/`;

		try {
			ws = new WebSocket(url);
		} catch {
			if (auto) ui.show();
			return;
		}

		ws.addEventListener('open', () => {
			connected = true;
			ui.setConnected(true);
		});

		ws.addEventListener('close', () => {
			connected = false;
			ui.setConnected(false);
			ws = null;
			if (!disconnectTimer) {
				shapes.disconnect();
				disconnectTimer = performance.now() + 1000;
			}
			if (auto) ui.show();
		});

		ws.addEventListener('message', (e: MessageEvent) => {
			try {
				const msg: ServerMessage = JSON.parse(e.data);

				if (msg.p) {
					playerPos.set(msg.p[0], msg.p[1], msg.p[2]);
					hasPlayer = true;
				}

				if (msg.r) {
					playerQuat.set(msg.r[0], msg.r[1], msg.r[2], msg.r[3]);
					hasRotation = true;
				}

				if (msg.s) {
					shapes.update(msg.s);
				}

				if (msg.h) {
					for (let h = 0; h < 2; h++) {
						const hand = msg.h[h];
						if (!hand) continue;
						const base = h * 5;
						for (let t = 0; t < 5; t++) {
							const x = hand[t * 3];
							const y = hand[t * 3 + 1];
							const z = hand[t * 3 + 2];
							if (x === 0 && y === 0 && z === 0) continue;
							handSmooth[base + t].set(x, y, z);
						}
					}
				}
			} catch {
				// ignore parse errors
			}
		});
	}

	function disconnect(): void {
		if (disconnectTimer) return;
		shapes.disconnect();
		disconnectTimer = performance.now() + 1000;
		hasPlayer = false;
		hasRotation = false;

		const marker = scene.getObjectByName('player') as THREE.Mesh;
		if (marker) marker.position.set(0, 0, 0);
		playerPos.reset();
		playerQuat.reset();

		for (const s of handSmooth) s.reset();
		for (const group of handGroups) {
			for (const child of group.children) {
				(child as THREE.Mesh).position.set(0, 0, 0);
			}
		}

		if (ws) {
			ws.close();
			ws = null;
		}
	}

	if (isRemote) {
		ui.hide();
		connect(window.location.hostname, 8081, true);
	}

	ui.onConnect((ip, port) => {
		if (connected) {
			disconnect();
			connected = false;
			ui.setConnected(false);
		} else {
			connect(ip, port);
		}
	});

	function loop(time: number) {
		const alpha = interp.tick(time);

		shapes.interpolate(alpha);

		if (disconnectTimer && time > disconnectTimer) {
			shapes.clear();
			disconnectTimer = 0;
		}

		if (hasPlayer) {
			playerPos.update(alpha);
			const marker = scene.getObjectByName('player');
			if (marker) {
				playerPos.apply(marker.position);
				if (hasRotation) {
					playerQuat.update(alpha);
					playerQuat.apply(marker.quaternion);
				}
			}
		}

		for (let i = 0; i < 10; i++) {
			const s = handSmooth[i];
			s.update(alpha);
			const h = Math.floor(i / 5);
			const t = i % 5;
			s.apply((handGroups[h].children[t] as THREE.Mesh).position);
		}

		if (firstPerson) {
			const marker = scene.getObjectByName('player');
			if (marker) {
				camera.position.copy(marker.position);
				if (hasRotation) {
					camera.quaternion.copy(marker.quaternion);
					camera.updateMatrix();
				}
			}
		}

		if (!firstPerson) controls.update();
		renderer.render(scene, camera);
		requestAnimationFrame(loop);
	}

	requestAnimationFrame(loop);
}

main();
