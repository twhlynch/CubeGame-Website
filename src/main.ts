import './style.css';
import { createScene } from './scene';
import { ShapeRenderer } from './renderer';
import type { ShapeDatum } from './renderer';
import { UI } from './ui';
import * as THREE from 'three';

interface ServerMessage {
	p?: [number, number, number];
	r?: [number, number, number, number];
	s?: ShapeDatum[];
}

function main() {
	const container = document.getElementById('container')!;
	const { scene, camera, controls, renderer } = createScene(container);
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
			} catch {
				// ignore parse errors
			}
		});
	}

	function disconnect(): void {
		shapes.clear();

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
