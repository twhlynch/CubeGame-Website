const DEFAULT_PORT = 8081;

function expandIP(input: string): { ip: string; port: number } {
	const trimmed = input.trim();

	// '' -> hostname
	if (!trimmed) return { ip: window.location.hostname, port: DEFAULT_PORT };

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
	private bar: HTMLElement;
	private fpvBtn: HTMLElement;
	private connectHandler: ((ip: string, port: number) => void) | null = null;
	private fpvHandler: (() => void) | null = null;

	constructor() {
		this.ip = document.getElementById('ip-input') as HTMLInputElement;
		this.connect = document.getElementById('connect-btn') as HTMLElement;
		this.bar = document.getElementById('connect-bar') as HTMLElement;
		this.fpvBtn = document.getElementById('fpv-toggle') as HTMLElement;

		this.connect.addEventListener('click', () => this.handleConnect());
		this.ip.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') this.handleConnect();
		});
		this.fpvBtn.addEventListener('click', () => this.fpvHandler?.());
	}

	onConnect(fn: (ip: string, port: number) => void): void {
		this.connectHandler = fn;
	}

	onFpvToggle(fn: () => void): void {
		this.fpvHandler = fn;
	}

	setIp(ip: string): void {
		this.ip.value = ip;
	}

	setConnected(connected: boolean): void {
		this.connect.textContent = connected ? 'Disconnect' : 'Connect';
		this.connect.className = connected ? 'connected' : '';
	}

	setFpvActive(active: boolean): void {
		this.fpvBtn.textContent = active ? 'Orbit' : 'FPV';
		this.fpvBtn.classList.toggle('active', active);
	}

	private handleConnect(): void {
		if (!this.connectHandler) return;
		const { ip, port } = expandIP(this.ip.value);
		this.connectHandler(ip, port);
	}
}
