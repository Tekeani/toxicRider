import { Entity } from './Entity';
import { ENEMY_TYPES } from '../config/constants';
export class Enemy extends Entity {
    constructor(x, y, type, game) {
        super(x, y, 48, 48);
        this.spriteSheet = null;
        this.spriteWidth = 16;
        this.spriteHeight = 16;
        this.game = game;
        this.config = ENEMY_TYPES[type] || ENEMY_TYPES.WEAK;
        this.speed = this.config.speed;
        this.hp = this.config.hp;
        this.maxHp = this.config.hp;
        this.damage = this.config.damage;
        this.direction = 'left';
        this.spriteIndex = this._getValidSpriteIndex();
        this.loadSprite();
    }
    _getValidSpriteIndex() {
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
    static async loadSharedSprite() {
        if (Enemy.spriteSheetImage)
            return Promise.resolve();
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
    async loadSprite() {
        await Enemy.loadSharedSprite();
        if (Enemy.spriteSheetImage) {
            const { SpriteSheet: SpriteSheetClass } = await import('../utils/SpriteSheet');
            this.spriteSheet = new SpriteSheetClass(Enemy.spriteSheetImage, 16, 16);
        }
    }
    update(deltaTime) {
        if (!this.isAlive)
            return;
        const currentScene = this.game.getCurrentScene?.();
        const player = currentScene?.player;
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
    overlapsWith(other) {
        return this.x < other.x + other.width &&
            this.x + this.width > other.x &&
            this.y < other.y + other.height &&
            this.y + this.height > other.y;
    }
    attack(player) {
        if (player && player.isAlive && !player.isBlocking) {
            player.takeDamage(this.damage);
        }
    }
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.isAlive = false;
        }
    }
    getSpriteSheet() {
        return this.spriteSheet;
    }
    getSpriteIndex() {
        return this.spriteIndex;
    }
    getSpriteWidth() {
        return this.spriteWidth;
    }
    getSpriteHeight() {
        return this.spriteHeight;
    }
    shouldFlipX() {
        return this.direction === 'left';
    }
}
Enemy.spriteSheetImage = null;
//# sourceMappingURL=Enemy.js.map