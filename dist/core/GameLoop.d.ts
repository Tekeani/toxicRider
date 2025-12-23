export declare class GameLoop {
    private updateCallback;
    private renderCallback;
    private running;
    private animationFrameId;
    private lastTime;
    private maxFPS;
    private frameTime;
    constructor(updateCallback: (deltaTime: number) => void, renderCallback: () => void);
    start(): void;
    stop(): void;
    private loop;
    isRunning(): boolean;
}
//# sourceMappingURL=GameLoop.d.ts.map