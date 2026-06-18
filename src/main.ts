import './style.css';
import { createScene } from './scene';
import { ShapeRenderer } from './renderer';
import type { ShapeDatum } from './renderer';
import { UI } from './ui';
import { Interpolator } from './smooth';
import { Player } from './player';
import { Hands } from './hands';
import type { HandDatum } from './hands';

interface ServerMessage {
	p?: [number, number, number];
	r?: [number, number, number, number];
	s?: ShapeDatum[];
	h?: [HandDatum, HandDatum];
}

function main() {
	const container = document.getElementById('container')!;
	const { scene, camera, controls, renderer } = createScene(container);
	const shapes = new ShapeRenderer(scene);
	const ui = new UI();
	const player = new Player(scene);
	const hands = new Hands(scene);
	const interp = new Interpolator(10);

	let ws: WebSocket | null = null;
	let connected = false;
	let disconnectTimer = 0;

	let firstPerson = false;
	const origCamPos = camera.position.clone();
	const origTarget = controls.target.clone();

	const isRemote =
		window.location.hostname !== 'localhost' &&
		window.location.hostname !== '127.0.0.1';

	ui.onFpvToggle(() => {
		firstPerson = !firstPerson;
		if (firstPerson) {
			controls.enabled = false;
			player.marker.visible = false;
		} else {
			controls.enabled = true;
			camera.position.copy(origCamPos);
			controls.target.copy(origTarget);
			player.marker.visible = true;
		}
		ui.setFpvActive(firstPerson);
	});

	function connect(ip: string, port: number, auto?: boolean) {
		disconnectTimer = 0;
		shapes.clear();
		player.reset();
		hands.reset();

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
					player.setPosition(msg.p[0], msg.p[1], msg.p[2]);
				}

				if (msg.r) {
					player.setQuat(msg.r[0], msg.r[1], msg.r[2], msg.r[3]);
				}

				if (msg.s) {
					shapes.update(msg.s);
				}

				if (msg.h) {
					for (let h = 0; h < 2; h++) {
						if (msg.h[h]) hands.setHand(h, msg.h[h]);
					}
				}
			} catch {
				// ignore parse errors
			}
		});
	}

	function disconnect() {
		if (disconnectTimer) return;
		shapes.disconnect();
		disconnectTimer = performance.now() + 1000;
		player.reset();
		hands.reset();

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

		player.update(alpha);
		hands.update(alpha);

		if (firstPerson) {
			camera.position.copy(player.marker.position);
			if (player.hasRotation) {
				camera.quaternion.copy(player.marker.quaternion);
				camera.updateMatrix();
			}
		}
		if (!firstPerson) controls.update();
		renderer.render(scene, camera);
		requestAnimationFrame(loop);
	}

	requestAnimationFrame(loop);
}

main();
