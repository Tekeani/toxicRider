import type { Position, Size, Direction } from '../types';
export declare abstract class Entity {
    x: number;
    y: number;
    width: number;
    height: number;
    direction: Direction;
    isAlive: boolean;
    constructor(x: number, y: number, width: number, height: number);
    getPosition(): Position;
    setPosition(position: Position): void;
    getSize(): Size;
    getBounds(): {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
    abstract update(deltaTime: number, keys?: Record<string, boolean>): void;
}
//# sourceMappingURL=Entity.d.ts.map