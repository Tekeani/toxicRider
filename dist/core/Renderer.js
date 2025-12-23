import { CANVAS_CONFIG } from '../config/constants';
export class Renderer {
    constructor(canvas) {
        this._scale = 1;
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
    setupResize() {
        window.addEventListener('resize', () => this.updateSize());
    }
    updateSize() {
        const container = this.canvas.parentElement;
        if (!container)
            return;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const baseAspect = this.baseSize.width / this.baseSize.height;
        const containerAspect = containerWidth / containerHeight;
        let targetWidth;
        let targetHeight;
        if (containerAspect > baseAspect) {
            targetHeight = Math.max(containerHeight, CANVAS_CONFIG.MIN_HEIGHT);
            targetWidth = targetHeight * baseAspect;
        }
        else {
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
    getContext() {
        return this.ctx;
    }
    getCanvas() {
        return this.canvas;
    }
    getBaseSize() {
        return { ...this.baseSize };
    }
    getCurrentSize() {
        return { ...this.currentSize };
    }
    getScale() {
        return this._scale;
    }
    clear() {
        this.ctx.clearRect(0, 0, this.baseSize.width, this.baseSize.height);
    }
    clearRect(rect) {
        this.ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
    }
    save() {
        this.ctx.save();
    }
    restore() {
        this.ctx.restore();
    }
    translate(x, y) {
        this.ctx.translate(x, y);
    }
    rotate(angle) {
        this.ctx.rotate(angle);
    }
    scale(sx, sy) {
        this.ctx.scale(sx, sy);
    }
    drawImage(image, ...args) {
        if (args.length === 8) {
            this.ctx.drawImage(image, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
        }
        else if (args.length === 4) {
            this.ctx.drawImage(image, args[0], args[1], args[2], args[3]);
        }
        else {
            this.ctx.drawImage(image, args[0], args[1]);
        }
    }
    fillRect(x, y, width, height) {
        this.ctx.fillRect(x, y, width, height);
    }
    strokeRect(x, y, width, height) {
        this.ctx.strokeRect(x, y, width, height);
    }
    fillText(text, x, y, maxWidth) {
        this.ctx.fillText(text, x, y, maxWidth);
    }
    strokeText(text, x, y, maxWidth) {
        this.ctx.strokeText(text, x, y, maxWidth);
    }
    beginPath() {
        this.ctx.beginPath();
    }
    moveTo(x, y) {
        this.ctx.moveTo(x, y);
    }
    lineTo(x, y) {
        this.ctx.lineTo(x, y);
    }
    arc(x, y, radius, startAngle, endAngle, anticlockwise) {
        this.ctx.arc(x, y, radius, startAngle, endAngle, anticlockwise);
    }
    fill() {
        this.ctx.fill();
    }
    stroke() {
        this.ctx.stroke();
    }
    set fillStyle(style) {
        this.ctx.fillStyle = style;
    }
    get fillStyle() {
        return this.ctx.fillStyle;
    }
    set strokeStyle(style) {
        this.ctx.strokeStyle = style;
    }
    get strokeStyle() {
        return this.ctx.strokeStyle;
    }
    set font(font) {
        this.ctx.font = font;
    }
    get font() {
        return this.ctx.font;
    }
    set textAlign(align) {
        this.ctx.textAlign = align;
    }
    get textAlign() {
        return this.ctx.textAlign;
    }
    set textBaseline(baseline) {
        this.ctx.textBaseline = baseline;
    }
    get textBaseline() {
        return this.ctx.textBaseline;
    }
    set lineWidth(width) {
        this.ctx.lineWidth = width;
    }
    get lineWidth() {
        return this.ctx.lineWidth;
    }
    set globalAlpha(alpha) {
        this.ctx.globalAlpha = alpha;
    }
    get globalAlpha() {
        return this.ctx.globalAlpha;
    }
    set imageSmoothingEnabled(enabled) {
        this.ctx.imageSmoothingEnabled = enabled;
    }
    setLineDash(segments) {
        this.ctx.setLineDash(segments);
    }
    set lineDashOffset(offset) {
        this.ctx.lineDashOffset = offset;
    }
    measureText(text) {
        return this.ctx.measureText(text);
    }
    closePath() {
        this.ctx.closePath();
    }
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
        this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }
}
//# sourceMappingURL=Renderer.js.map