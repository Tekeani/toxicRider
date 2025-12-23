import { Entity } from './Entity';
import type { SpriteSheet } from '../utils/SpriteSheet';
import type { RenderableEnemy } from '../systems/RenderingSystem';
import type { Game } from '../core/Game';
import { ENEMY_TYPES } from '../config/constants';

export class Enemy extends Entity implements RenderableEnemy {
    private static spriteSheetImage: HTMLImageElement | null = null;
    private game: Game;
    private config: { hp: number; speed: number; damage: number; };
    private spriteSheet: SpriteSheet | null = null;
    private spriteIndex: number;
    private spriteWidth: number = 16;
    private spriteHeight: number = 16;
    public speed: number;
    public hp: number;
    public maxHp: number;
    public damage: number;

    constructor(x: number, y: number, type: string, game: Game) {
        super(x, y, 48, 48);
        this.game = game;
        this.config = ENEMY_TYPES[type as keyof typeof ENEMY_TYPES] || ENEMY_TYPES.WEAK;
        this.speed = this.config.speed;
        this.hp = this.config.hp;
        this.maxHp = this.config.hp;
        this.damage = this.config.damage;
        this.direction = 'left';
        this.spriteIndex = this._getValidSpriteIndex();
        this.loadSprite();
    }

    private _getValidSpriteIndex(): number {
        const validSpriteIndices = [
            0, 1, 2, 3, 4, 5, 6,
            8, 9, 10, 11, 12, 13,
            16, 17, 18, 19, 20, 21,
            24, 25, 26,
            32, 33, 34, 35, 36, 37, 38, 39,
            40, 41, 42, 43, 44, 45, 46, 47,
            48, 49, 50, 51, 52, 53, 54,
            56, 57, 58, 59, 60, 61, 62, 63,
            64, 65, 66, 67, 68, 69, 70
        ];
        return validSpriteIndices[Math.floor(Math.random() * validSpriteIndices.length)];
    }

    static async loadSharedSprite(): Promise<void> {
        if (Enemy.spriteSheetImage) return Promise.resolve();
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                Enemy.spriteSheetImage = img;
                resolve();
            };
            img.onerror = () => {
                reject();
            };
            img.src = 'assets/images/sprites/enemies/roguelikecreatures.png';
        });
    }

    async loadSprite(): Promise<void> {
        await Enemy.loadSharedSprite();
        if (Enemy.spriteSheetImage) {
            const { SpriteSheet: SpriteSheetClass } = await import('../utils/SpriteSheet');
            this.spriteSheet = new SpriteSheetClass(Enemy.spriteSheetImage as HTMLImageElement, 16, 16);
        }
    }

    update(deltaTime: number): void {
        if (!this.isAlive) return;

        const currentScene = (this.game as any).getCurrentScene?.();
        const player = (currentScene as any)?.player;
        
        if (player && player.isAlive) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                const speedPerSecond = this.speed * 60;
                const moveX = (dx / distance) * speedPerSecond * deltaTime;
                const moveY = (dy / distance) * speedPerSecond * deltaTime;
                
                let newX = this.x + moveX;
                let newY = this.y + moveY;
                
                const baseSize = this.game.getRenderer().getBaseSize();
                newX = Math.max(0, Math.min(baseSize.width - this.width, newX));
                const visibleHeight = Math.floor(baseSize.height * 0.70);
                const maxY = visibleHeight - this.height;
                newY = Math.max(0, Math.min(maxY, newY));
                
                this.x = newX;
                this.y = newY;
                this.direction = dx < 0 ? 'left' : 'right';
            }
        }
    }

    overlapsWith(other: Enemy): boolean {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }

    attack(player: any): void {
        if (player && player.isAlive && !player.isBlocking) {
            player.takeDamage(this.damage);
        }
    }

    takeDamage(amount: number): void {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.isAlive = false;
        }
    }

    getSpriteSheet(): SpriteSheet | null {
        return this.spriteSheet;
    }

    getSpriteIndex(): number {
        return this.spriteIndex;
    }

    getSpriteWidth(): number {
        return this.spriteWidth;
    }

    getSpriteHeight(): number {
        return this.spriteHeight;
    }

    shouldFlipX(): boolean {
        return this.direction === 'left';
    }
}

