const DEFAULT_PORT = 8080;

function expandIP(input: string): { ip: string; port: number } {
	const trimmed = input.trim();

	// '' -> 127.0.0.1
	if (!trimmed) return { ip: '127.0.0.1', port: DEFAULT_PORT };

	// '192.168.0.1:8081' -> 192.168.0.1:8081
	// '41:8081' -> 192.168.0.41:8081
	const match = trimmed.match(/^(.+):(\d+)$/);
	if (match) {
		const port = parseInt(match[2], 10);
		const ip = expandIP(match[1]).ip;
		return { ip, port };
	}

	// '41' -> 192.168.0.41:8080
	if (/^\d+$/.test(trimmed)) {
		return { ip: `192.168.0.${trimmed}`, port: DEFAULT_PORT };
	}

	// '192.168.0.1'      -> 192.168.0.1:8080
	return { ip: trimmed, port: DEFAULT_PORT };
}

export class UI {
	private ip: HTMLInputElement;
	private connect: HTMLElement;
	private handler: ((ip: string, port: number) => void) | null = null;

	constructor() {
		this.ip = document.getElementById('ip-input') as HTMLInputElement;
		this.connect = document.getElementById('connect-btn') as HTMLElement;

		this.connect.addEventListener('click', () => this.handleConnect());
		this.ip.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') this.handleConnect();
		});
	}

	onConnect(fn: (ip: string, port: number) => void): void {
		this.handler = fn;
	}

	setConnected(connected: boolean): void {
		this.connect.textContent = connected ? 'Disconnect' : 'Connect';
		this.connect.className = connected ? 'connected' : '';
	}

	private handleConnect(): void {
		if (!this.handler) return;
		const { ip, port } = expandIP(this.ip.value);
		this.handler(ip, port);
	}
}
