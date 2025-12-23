import type { Size, Rectangle } from '../types';
import { CANVAS_CONFIG } from '../config/constants';

export class Renderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private baseSize: Size;
    private currentSize: Size;
    private _scale: number = 1;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Could not get 2d context');
        }
        this.ctx = context;
        this.baseSize = { width: CANVAS_CONFIG.BASE_WIDTH, height: CANVAS_CONFIG.BASE_HEIGHT };
        this.currentSize = { ...this.baseSize };
        this.updateSize();
        this.setupResize();
    }

    private setupResize(): void {
        window.addEventListener('resize', () => this.updateSize());
    }

    private updateSize(): void {
        const container = this.canvas.parentElement;
        if (!container) return;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const baseAspect = this.baseSize.width / this.baseSize.height;
        const containerAspect = containerWidth / containerHeight;

        let targetWidth: number;
        let targetHeight: number;

        if (containerAspect > baseAspect) {
            targetHeight = Math.max(containerHeight, CANVAS_CONFIG.MIN_HEIGHT);
            targetWidth = targetHeight * baseAspect;
        } else {
            targetWidth = Math.max(containerWidth, CANVAS_CONFIG.MIN_WIDTH);
            targetHeight = targetWidth / baseAspect;
        }

        this.currentSize.width = targetWidth;
        this.currentSize.height = targetHeight;
        this._scale = targetWidth / this.baseSize.width;

        this.canvas.width = this.baseSize.width;
        this.canvas.height = this.baseSize.height;
        this.canvas.style.width = `${targetWidth}px`;
        this.canvas.style.height = `${targetHeight}px`;

        this.ctx.imageSmoothingEnabled = false;
    }

    getContext(): CanvasRenderingContext2D {
        return this.ctx;
    }

    getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    getBaseSize(): Size {
        return { ...this.baseSize };
    }

    getCurrentSize(): Size {
        return { ...this.currentSize };
    }

    getScale(): number {
        return this._scale;
    }

    clear(): void {
        this.ctx.clearRect(0, 0, this.baseSize.width, this.baseSize.height);
    }

    clearRect(rect: Rectangle): void {
        this.ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
    }

    save(): void {
        this.ctx.save();
    }

    restore(): void {
        this.ctx.restore();
    }

    translate(x: number, y: number): void {
        this.ctx.translate(x, y);
    }

    rotate(angle: number): void {
        this.ctx.rotate(angle);
    }

    scale(sx: number, sy: number): void {
        this.ctx.scale(sx, sy);
    }

    drawImage(image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void;
    drawImage(image: CanvasImageSource, dx: number, dy: number, dw?: number, dh?: number): void;
    drawImage(image: CanvasImageSource, ...args: number[]): void {
        if (args.length === 8) {
            this.ctx.drawImage(image, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
        } else if (args.length === 4) {
            this.ctx.drawImage(image, args[0], args[1], args[2], args[3]);
        } else {
            this.ctx.drawImage(image, args[0], args[1]);
        }
    }

    fillRect(x: number, y: number, width: number, height: number): void {
        this.ctx.fillRect(x, y, width, height);
    }

    strokeRect(x: number, y: number, width: number, height: number): void {
        this.ctx.strokeRect(x, y, width, height);
    }

    fillText(text: string, x: number, y: number, maxWidth?: number): void {
        this.ctx.fillText(text, x, y, maxWidth);
    }

    strokeText(text: string, x: number, y: number, maxWidth?: number): void {
        this.ctx.strokeText(text, x, y, maxWidth);
    }

    beginPath(): void {
        this.ctx.beginPath();
    }

    moveTo(x: number, y: number): void {
        this.ctx.moveTo(x, y);
    }

    lineTo(x: number, y: number): void {
        this.ctx.lineTo(x, y);
    }

    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void {
        this.ctx.arc(x, y, radius, startAngle, endAngle, anticlockwise);
    }

    fill(): void {
        this.ctx.fill();
    }

    stroke(): void {
        this.ctx.stroke();
    }

    set fillStyle(style: string | CanvasGradient | CanvasPattern) {
        this.ctx.fillStyle = style;
    }

    get fillStyle(): string | CanvasGradient | CanvasPattern {
        return this.ctx.fillStyle;
    }

    set strokeStyle(style: string | CanvasGradient | CanvasPattern) {
        this.ctx.strokeStyle = style;
    }

    get strokeStyle(): string | CanvasGradient | CanvasPattern {
        return this.ctx.strokeStyle;
    }

    set font(font: string) {
        this.ctx.font = font;
    }

    get font(): string {
        return this.ctx.font;
    }

    set textAlign(align: CanvasTextAlign) {
        this.ctx.textAlign = align;
    }

    get textAlign(): CanvasTextAlign {
        return this.ctx.textAlign;
    }

    set textBaseline(baseline: CanvasTextBaseline) {
        this.ctx.textBaseline = baseline;
    }

    get textBaseline(): CanvasTextBaseline {
        return this.ctx.textBaseline;
    }

    set lineWidth(width: number) {
        this.ctx.lineWidth = width;
    }

    get lineWidth(): number {
        return this.ctx.lineWidth;
    }

    set globalAlpha(alpha: number) {
        this.ctx.globalAlpha = alpha;
    }

    get globalAlpha(): number {
        return this.ctx.globalAlpha;
    }

    set imageSmoothingEnabled(enabled: boolean) {
        this.ctx.imageSmoothingEnabled = enabled;
    }

    setLineDash(segments: number[]): void {
        this.ctx.setLineDash(segments);
    }

    set lineDashOffset(offset: number) {
        this.ctx.lineDashOffset = offset;
    }

    measureText(text: string): TextMetrics {
        return this.ctx.measureText(text);
    }

    closePath(): void {
        this.ctx.closePath();
    }

    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }
}

