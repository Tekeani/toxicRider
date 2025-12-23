export class SpriteSheet {
    public readonly image: HTMLImageElement;
    public readonly frameWidth: number;
    public readonly frameHeight: number;
    public framesPerRow: number;

    constructor(image: HTMLImageElement, frameWidth: number, frameHeight: number) {
        this.image = image;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.framesPerRow = Math.floor(image.width / frameWidth);
    }

    drawFrame(ctx: CanvasRenderingContext2D, frameIndex: number, x: number, y: number, scale: number = 1, flipX: boolean = false): void {
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

