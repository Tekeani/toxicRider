export class Entity {
    constructor(x, y, width, height) {
        this.direction = 'right';
        this.isAlive = true;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    getPosition() {
        return { x: this.x, y: this.y };
    }
    setPosition(position) {
        this.x = position.x;
        this.y = position.y;
    }
    getSize() {
        return { width: this.width, height: this.height };
    }
    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }
}
//# sourceMappingURL=Entity.js.map