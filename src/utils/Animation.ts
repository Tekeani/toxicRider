import type { SpriteSheet } from './SpriteSheet';

export class Animation {
    private spriteSheet: SpriteSheet;
    public readonly frames: number[];
    public readonly frameDuration: number;
    private loop: boolean;
    private currentFrame: number = 0;
    private timer: number = 0;
    private isPlaying: boolean = false;

    constructor(spriteSheet: SpriteSheet, frames: number[], frameDuration: number, loop: boolean = true) {
        this.spriteSheet = spriteSheet;
        this.frames = frames;
        this.frameDuration = frameDuration;
        this.loop = loop;
    }

    play(): void {
        this.isPlaying = true;
        this.timer = 0;
        this.currentFrame = 0;
    }

    stop(): void {
        this.isPlaying = false;
    }

    reset(): void {
        this.currentFrame = 0;
        this.timer = 0;
    }

    update(deltaTime: number): void {
        if (!this.isPlaying) return;

        this.timer += deltaTime;

        if (this.timer >= this.frameDuration) {
            this.timer -= this.frameDuration;
            this.currentFrame++;

            if (this.currentFrame >= this.frames.length) {
                if (this.loop) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = this.frames.length - 1;
                    this.isPlaying = false;
                }
            }
        }
    }

    getCurrentFrameIndex(): number {
        return this.frames[this.currentFrame];
    }

    getSpriteSheet(): SpriteSheet {
        return this.spriteSheet;
    }

    isPlayingAnimation(): boolean {
        return this.isPlaying;
    }

    isFinished(): boolean {
        return !this.isPlaying && this.currentFrame >= this.frames.length - 1;
    }
}
