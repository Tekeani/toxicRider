export declare class SpriteSheet {
    readonly image: HTMLImageElement;
    readonly frameWidth: number;
    readonly frameHeight: number;
    framesPerRow: number;
    constructor(image: HTMLImageElement, frameWidth: number, frameHeight: number);
    drawFrame(ctx: CanvasRenderingContext2D, frameIndex: number, x: number, y: number, scale?: number, flipX?: boolean): void;
}
//# sourceMappingURL=SpriteSheet.d.ts.map