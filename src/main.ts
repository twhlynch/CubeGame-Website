import './style.css';
import { createScene } from './scene';
import { UI } from './ui';

function main() {
	const container = document.getElementById('container')!;
	const { scene, camera, controls, renderer } = createScene(container);
	const ui = new UI();

	function loop() {
		controls.update();
		renderer.render(scene, camera);
		requestAnimationFrame(loop);
	}

	requestAnimationFrame(loop);
}

main();
