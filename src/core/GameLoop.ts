export class GameLoop {
    private running: boolean = false;
    private animationFrameId: number | null = null;
    private lastTime: number = 0;
    private maxFPS: number = 60;
    private frameTime: number = 1000 / this.maxFPS;

    constructor(
        private updateCallback: (deltaTime: number) => void,
        private renderCallback: () => void
    ) {}

    start(): void {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.loop();
    }

    stop(): void {
        this.running = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    private loop = (time: number = 0): void => {
        if (!this.running) return;

        const deltaTime = Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;

        this.updateCallback(deltaTime);
        this.renderCallback();

        this.animationFrameId = requestAnimationFrame(this.loop);
    };

    isRunning(): boolean {
        return this.running;
    }
}

