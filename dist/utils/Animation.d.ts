import type { SpriteSheet } from './SpriteSheet';
export declare class Animation {
    private spriteSheet;
    readonly frames: number[];
    readonly frameDuration: number;
    private loop;
    private currentFrame;
    private timer;
    private isPlaying;
    constructor(spriteSheet: SpriteSheet, frames: number[], frameDuration: number, loop?: boolean);
    play(): void;
    stop(): void;
    reset(): void;
    update(deltaTime: number): void;
    getCurrentFrameIndex(): number;
    getSpriteSheet(): SpriteSheet;
    isPlayingAnimation(): boolean;
    isFinished(): boolean;
}
//# sourceMappingURL=Animation.d.ts.map