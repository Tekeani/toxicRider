class Animation {
    constructor(spriteSheet, frames, frameDuration, loop = true) {
        this.spriteSheet = spriteSheet;
        this.frames = frames; // Array d'indices de frames
        this.frameDuration = frameDuration; // Durée de chaque frame en secondes
        this.loop = loop;
        this.currentFrame = 0;
        this.timer = 0;
        this.isPlaying = false;
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
        if (!this.isPlaying) return;

        this.timer += deltaTime;

        if (this.timer >= this.frameDuration) {
            this.timer = 0;
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

    getCurrentFrameIndex() {
        // CORRECTION : Garantir que le frame index est toujours valide
        if (!this.frames || this.frames.length === 0) return 0;
        if (this.currentFrame === undefined || this.currentFrame < 0 || this.currentFrame >= this.frames.length) {
            this.currentFrame = 0;
        }
        const index = this.frames[this.currentFrame];
        return (index !== undefined && !isNaN(index)) ? index : this.frames[0];
    }

    isFinished() {
        return !this.loop && this.currentFrame >= this.frames.length - 1 && !this.isPlaying;
    }
}



