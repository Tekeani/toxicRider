export class Animation {
    constructor(spriteSheet, frames, frameDuration, loop = true) {
        this.currentFrame = 0;
        this.timer = 0;
        this.isPlaying = false;
        this.spriteSheet = spriteSheet;
        this.frames = frames;
        this.frameDuration = frameDuration;
        this.loop = loop;
    }
    play() {
        this.isPlaying = true;
        this.timer = 0;
        this.currentFrame = 0;
    }
    stop() {
        this.isPlaying = false;
    }
    reset() {
        this.currentFrame = 0;
        this.timer = 0;
    }
    update(deltaTime) {
        if (!this.isPlaying)
            return;
        this.timer += deltaTime;
        if (this.timer >= this.frameDuration) {
            this.timer -= this.frameDuration;
            this.currentFrame++;
            if (this.currentFrame >= this.frames.length) {
                if (this.loop) {
                    this.currentFrame = 0;
                }
                else {
                    this.currentFrame = this.frames.length - 1;
                    this.isPlaying = false;
                }
            }
        }
    }
    getCurrentFrameIndex() {
        return this.frames[this.currentFrame];
    }
    getSpriteSheet() {
        return this.spriteSheet;
    }
    isPlayingAnimation() {
        return this.isPlaying;
    }
    isFinished() {
        return !this.isPlaying && this.currentFrame >= this.frames.length - 1;
    }
}
//# sourceMappingURL=Animation.js.map