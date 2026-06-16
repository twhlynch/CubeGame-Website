import './style.css';
import { UI } from './ui';

function main() {
	const container = document.getElementById('container')!;
	const ui = new UI();

	ui.onConnect((ip, port) => {
		// TODO:
	});
}

main();
