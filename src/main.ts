import './style.css';
import { createScene } from './scene';
import { ShapeRenderer } from './renderer';
import type { ShapeDatum } from './renderer';
import { UI } from './ui';
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

	function connect(ip: string, port: number) {
		disconnect();

		const url = `ws://${ip}:${port}/`;

		try {
			ws = new WebSocket(url);
		} catch {
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
			shapes.clear();
		});

		ws.addEventListener('message', (e: MessageEvent) => {
			try {
				const msg: ServerMessage = JSON.parse(e.data);

				if (msg.p) {
					const marker = scene.getObjectByName('player');
					if (marker) {
						marker.position.set(msg.p[0], msg.p[1], msg.p[2]);
					}
				}

				if (msg.s) {
					shapes.update(msg.s);
				}

				if (msg.h) {
					for (let h = 0; h < 2; h++) {
						const hand = msg.h[h];
						if (!hand) continue;
						const group = handGroups[h];
						for (let t = 0; t < 5; t++) {
							const sphere = group.children[t] as THREE.Mesh;
							if (sphere) {
								sphere.position.set(
									hand[t * 3],
									hand[t * 3 + 1],
									hand[t * 3 + 2],
								);
							}
						}
					}
				}
			} catch {
				// ignore parse errors
			}
		});
	}

	function disconnect(): void {
		shapes.clear();

		const marker = scene.getObjectByName('player') as THREE.Mesh;
		if (marker) marker.position.set(0, 0, 0);

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

	ui.onConnect((ip, port) => {
		if (connected) {
			disconnect();
			connected = false;
			ui.setConnected(false);
		} else {
			connect(ip, port);
		}
	});

	function loop() {
		controls.update();
		renderer.render(scene, camera);
		requestAnimationFrame(loop);
	}

	requestAnimationFrame(loop);
}

main();
