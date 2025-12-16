class SpriteSheet {
    constructor(image, frameWidth, frameHeight) {
        this.image = image;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.framesPerRow = Math.floor(image.width / frameWidth);
    }

    // CORRECTION : drawFrame corrigé pour éviter les problèmes de flipX et scaling
    drawFrame(ctx, frameIndex, x, y, scale = 1, flipX = false) {
        const row = Math.floor(frameIndex / this.framesPerRow);
        const col = frameIndex % this.framesPerRow;
        const sx = col * this.frameWidth;
        const sy = row * this.frameHeight;

        ctx.save();
        ctx.translate(x, y);
        if (flipX) {
            ctx.scale(-1, 1);
            ctx.translate(-this.frameWidth * scale, 0);
        }
        ctx.drawImage(
            this.image,
            sx, sy, this.frameWidth, this.frameHeight,
            0, 0, this.frameWidth * scale, this.frameHeight * scale
        );
        ctx.restore();
    }
}


