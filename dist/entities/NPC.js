import { Entity } from './Entity';
export class NPC extends Entity {
    constructor(x, y, game, skipAutoLoad = false) {
        super(x, y, 48, 48);
        this.spriteSheet = null;
        this.currentAnimation = null;
        this.animations = {};
        this.spriteLoaded = false;
        this._loading = false;
        this.speed = 120;
        this.isMoving = false;
        this.targetX = null;
        this.targetY = null;
        this.hasReachedTarget = false;
        this.game = game;
        this.direction = 'right';
        if (!skipAutoLoad) {
            this.loadSprite();
        }
        else {
            this._loading = true;
        }
    }
    async loadSprite() {
        if (this._loading || this.spriteLoaded)
            return;
        this._loading = true;
        const img = new Image();
        img.onload = () => {
            if (img.complete && img.naturalWidth > 0) {
                import('../utils/SpriteSheet').then(({ SpriteSheet }) => {
                    this.spriteSheet = new SpriteSheet(img, 16, 16);
                    this.setupAnimations();
                    this.spriteLoaded = true;
                    this._loading = false;
                });
            }
        };
        img.onerror = () => {
            this._loading = false;
        };
        img.src = 'assets/images/sprites/npc/playersprite.png';
    }
    async loadSheepmanSprite() {
        if (this._loading)
            return;
        this._loading = true;
        const img = new Image();
        img.onload = () => {
            if (img.complete && img.naturalWidth > 0) {
                import('../utils/SpriteSheet').then(({ SpriteSheet }) => {
                    this.spriteSheet = new SpriteSheet(img, 48, 64);
                    this.setupSheepmanAnimations();
                    this.spriteLoaded = true;
                    this._loading = false;
                });
            }
        };
        img.onerror = () => {
            this._loading = false;
        };
        img.src = 'assets/images/sprites/npc/PNG/48x64/sheepman.png';
    }
    setupAnimations() {
        if (!this.spriteSheet)
            return;
        import('../utils/Animation').then(({ Animation }) => {
            this.animations.idle = new Animation(this.spriteSheet, [4, 5, 6], 0.25, true);
            this.animations.walk = new Animation(this.spriteSheet, [0, 1, 2, 3, 4, 5, 6, 7], 0.15, true);
            this.currentAnimation = this.animations.idle;
            this.currentAnimation.play();
        });
    }
    setupSheepmanAnimations() {
        if (!this.spriteSheet)
            return;
        import('../utils/Animation').then(({ Animation }) => {
            this.animations.idle = new Animation(this.spriteSheet, [0], 0.25, true);
            this.currentAnimation = this.animations.idle;
            this.currentAnimation.play();
        });
    }
    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
        this.hasReachedTarget = false;
    }
    update(deltaTime) {
        if (this.currentAnimation) {
            this.currentAnimation.update(deltaTime);
        }
        if (this.targetX !== null && this.targetY !== null && !this.hasReachedTarget) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 5) {
                this.isMoving = true;
                this.x += (dx / distance) * this.speed * deltaTime;
                this.y += (dy / distance) * this.speed * deltaTime;
                this.direction = dx < 0 ? 'left' : 'right';
                if (this.currentAnimation !== this.animations.walk && this.animations.walk) {
                    this.currentAnimation = this.animations.walk;
                    this.currentAnimation.reset();
                    this.currentAnimation.play();
                }
            }
            else {
                this.hasReachedTarget = true;
                this.isMoving = false;
                if (this.currentAnimation !== this.animations.idle && this.animations.idle) {
                    this.currentAnimation = this.animations.idle;
                    this.currentAnimation.reset();
                    this.currentAnimation.play();
                }
            }
        }
    }
    getSpriteSheet() {
        return this.spriteSheet;
    }
    getCurrentAnimation() {
        return this.currentAnimation;
    }
    shouldFlipX() {
        return this.direction === 'left';
    }
}
//# sourceMappingURL=NPC.js.map