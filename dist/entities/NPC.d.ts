import { Entity } from './Entity';
import type { SpriteSheet } from '../utils/SpriteSheet';
import type { Animation } from '../utils/Animation';
import type { RenderableEntity } from '../systems/RenderingSystem';
import type { Game } from '../core/Game';
export declare class NPC extends Entity implements RenderableEntity {
    private game;
    private spriteSheet;
    private currentAnimation;
    private animations;
    private spriteLoaded;
    private _loading;
    speed: number;
    isMoving: boolean;
    private targetX;
    private targetY;
    hasReachedTarget: boolean;
    constructor(x: number, y: number, game: Game, skipAutoLoad?: boolean);
    loadSprite(): Promise<void>;
    loadSheepmanSprite(): Promise<void>;
    private setupAnimations;
    private setupSheepmanAnimations;
    setTarget(x: number, y: number): void;
    update(deltaTime: number): void;
    getSpriteSheet(): SpriteSheet | null;
    getCurrentAnimation(): Animation | null;
    shouldFlipX(): boolean;
}
//# sourceMappingURL=NPC.d.ts.map