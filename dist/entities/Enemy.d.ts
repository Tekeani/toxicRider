import { Entity } from './Entity';
import type { SpriteSheet } from '../utils/SpriteSheet';
import type { RenderableEnemy } from '../systems/RenderingSystem';
import type { Game } from '../core/Game';
export declare class Enemy extends Entity implements RenderableEnemy {
    private static spriteSheetImage;
    private game;
    private config;
    private spriteSheet;
    private spriteIndex;
    private spriteWidth;
    private spriteHeight;
    speed: number;
    hp: number;
    maxHp: number;
    damage: number;
    constructor(x: number, y: number, type: string, game: Game);
    private _getValidSpriteIndex;
    static loadSharedSprite(): Promise<void>;
    loadSprite(): Promise<void>;
    update(deltaTime: number): void;
    overlapsWith(other: Enemy): boolean;
    attack(player: any): void;
    takeDamage(amount: number): void;
    getSpriteSheet(): SpriteSheet | null;
    getSpriteIndex(): number;
    getSpriteWidth(): number;
    getSpriteHeight(): number;
    shouldFlipX(): boolean;
}
//# sourceMappingURL=Enemy.d.ts.map