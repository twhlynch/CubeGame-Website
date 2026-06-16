import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface SceneResources {
	scene: THREE.Scene;
	camera: THREE.PerspectiveCamera;
	controls: OrbitControls;
	renderer: THREE.WebGLRenderer;
}

export function createScene(container: HTMLElement): SceneResources {
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x1e1e1e);

	const camera = new THREE.PerspectiveCamera(
		60,
		container.clientWidth / container.clientHeight,
		0.1,
		100,
	);
	camera.position.set(2, 2, 4);

	const renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(container.clientWidth, container.clientHeight);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	container.appendChild(renderer.domElement);

	const controls = new OrbitControls(camera, renderer.domElement);
	controls.target.set(0, 0.25, 0);
	controls.enableDamping = true;
	controls.dampingFactor = 0.1;

	const grid = new THREE.GridHelper(20, 20, 0x777777, 0x555555);
	scene.add(grid);

	const playerMarker = new THREE.Mesh(
		new THREE.SphereGeometry(0.05, 12, 8),
		new THREE.MeshBasicMaterial({ color: 0xe0a363 }),
	);
	playerMarker.name = 'player';
	scene.add(playerMarker);

	window.addEventListener('resize', () => {
		const w = container.clientWidth;
		const h = container.clientHeight;
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		renderer.setSize(w, h);
	});

	return { scene, camera, controls, renderer };
}
