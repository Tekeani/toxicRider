import type { Position, Size, Direction } from '../types';

export abstract class Entity {
    public x: number;
    public y: number;
    public width: number;
    public height: number;
    public direction: Direction = 'right';
    public isAlive: boolean = true;

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    getPosition(): Position {
        return { x: this.x, y: this.y };
    }

    setPosition(position: Position): void {
        this.x = position.x;
        this.y = position.y;
    }

    getSize(): Size {
        return { width: this.width, height: this.height };
    }

    getBounds(): { left: number; right: number; top: number; bottom: number } {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }

    abstract update(deltaTime: number, keys?: Record<string, boolean>): void;
}

