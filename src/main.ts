import './style.css';
import { createScene } from './scene';
import { UI } from './ui';
import * as THREE from 'three';

type FullDatum = [
	id: number, idx: number,
	px: number, py: number, pz: number,
	rx: number, ry: number, rz: number, rw: number,
	sx: number, sy: number, sz: number,
];
export type ShapeDatum = [id: number] | FullDatum;

interface ServerMessage {
	p?: [number, number, number];
	r?: [number, number, number, number];
	s?: ShapeDatum[];
}

function main() {
	const container = document.getElementById('container')!;
	const { scene, camera, controls, renderer } = createScene(container);
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
			// TODO: clear shapes
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
					// TODO: create shapes
				}
			} catch {
				// ignore parse errors
			}
		});
	}

	function disconnect(): void {
		// TODO: clear shapes

		const marker = scene.getObjectByName('player') as THREE.Mesh;
		if (marker) marker.position.set(0, 0, 0);

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
