import type { Renderer } from '../core/Renderer';
import type { Entity } from '../entities/Entity';
import { SpriteSheet } from '../utils/SpriteSheet';
import { Animation } from '../utils/Animation';
export interface RenderableEntity extends Entity {
    getSpriteSheet(): SpriteSheet | null;
    getCurrentAnimation(): Animation | null;
    shouldFlipX(): boolean;
}
export interface RenderableEnemy extends Entity {
    getSpriteSheet(): SpriteSheet | null;
    getSpriteIndex(): number;
    getSpriteWidth(): number;
    getSpriteHeight(): number;
    shouldFlipX(): boolean;
}
export declare class RenderingSystem {
    private renderer;
    constructor(renderer: Renderer);
    renderEntity(entity: RenderableEntity): void;
    renderEnemy(enemy: RenderableEnemy): void;
    renderImage(image: HTMLImageElement, x: number, y: number, width: number, height: number): void;
    renderRect(x: number, y: number, width: number, height: number, color: string): void;
    renderText(text: string, x: number, y: number, font: string, color: string, align?: CanvasTextAlign): void;
}
//# sourceMappingURL=RenderingSystem.d.ts.map