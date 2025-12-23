import { Entity } from './Entity';
import type { SpriteSheet } from '../utils/SpriteSheet';
import type { Animation } from '../utils/Animation';
import type { RenderableEntity } from '../systems/RenderingSystem';
import type { Game } from '../core/Game';

export class NPC extends Entity implements RenderableEntity {
    private game: Game;
    private spriteSheet: SpriteSheet | null = null;
    private currentAnimation: Animation | null = null;
    private animations: Record<string, Animation> = {};
    private spriteLoaded: boolean = false;
    private _loading: boolean = false;
    
    public speed: number = 120;
    public isMoving: boolean = false;
    private targetX: number | null = null;
    private targetY: number | null = null;
    public hasReachedTarget: boolean = false;

    constructor(x: number, y: number, game: Game, skipAutoLoad: boolean = false) {
        super(x, y, 48, 48);
        this.game = game;
        this.direction = 'right';
        if (!skipAutoLoad) {
            this.loadSprite();
        } else {
            this._loading = true;
        }
    }

    async loadSprite(): Promise<void> {
        if (this._loading || this.spriteLoaded) return;
        
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

    async loadSheepmanSprite(): Promise<void> {
        if (this._loading) return;
        
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

    private setupAnimations(): void {
        if (!this.spriteSheet) return;
        import('../utils/Animation').then(({ Animation }) => {
            this.animations.idle = new Animation(this.spriteSheet!, [4, 5, 6], 0.25, true);
            this.animations.walk = new Animation(this.spriteSheet!, [0, 1, 2, 3, 4, 5, 6, 7], 0.15, true);
            this.currentAnimation = this.animations.idle;
            this.currentAnimation.play();
        });
    }

    private setupSheepmanAnimations(): void {
        if (!this.spriteSheet) return;
        import('../utils/Animation').then(({ Animation }) => {
            this.animations.idle = new Animation(this.spriteSheet!, [0], 0.25, true);
            this.currentAnimation = this.animations.idle;
            this.currentAnimation.play();
        });
    }

    setTarget(x: number, y: number): void {
        this.targetX = x;
        this.targetY = y;
        this.hasReachedTarget = false;
    }

    update(deltaTime: number): void {
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
            } else {
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

    getSpriteSheet(): SpriteSheet | null {
        return this.spriteSheet;
    }

    getCurrentAnimation(): Animation | null {
        return this.currentAnimation;
    }

    shouldFlipX(): boolean {
        return this.direction === 'left';
    }
}

