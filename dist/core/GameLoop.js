export class GameLoop {
    constructor(updateCallback, renderCallback) {
        this.updateCallback = updateCallback;
        this.renderCallback = renderCallback;
        this.running = false;
        this.animationFrameId = null;
        this.lastTime = 0;
        this.maxFPS = 60;
        this.frameTime = 1000 / this.maxFPS;
        this.loop = (time = 0) => {
            if (!this.running)
                return;
            const deltaTime = Math.min((time - this.lastTime) / 1000, 0.1);
            this.lastTime = time;
            this.updateCallback(deltaTime);
            this.renderCallback();
            this.animationFrameId = requestAnimationFrame(this.loop);
        };
    }
    start() {
        if (this.running)
            return;
        this.running = true;
        this.lastTime = performance.now();
        this.loop();
    }
    stop() {
        this.running = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    isRunning() {
        return this.running;
    }
}
//# sourceMappingURL=GameLoop.js.map