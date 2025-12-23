import { Entity } from './Entity';
import { SpriteSheet } from '../utils/SpriteSheet';
import { Animation } from '../utils/Animation';
import { PLAYER_CONFIG } from '../config/constants';
export class Player extends Entity {
    constructor(x, y, game) {
        super(x, y, 160, 160);
        this.spriteSheet = null;
        this.currentAnimation = null;
        this.animations = {};
        this.spriteLoaded = false;
        this.isMoving = false;
        this.isAttacking = false;
        this.attackTimer = 0;
        this._damageApplied = false;
        this.isBlocking = false;
        this.isTakingDamage = false;
        this.damageTimer = 0;
        this.toxicityCooldown = 0;
        this.toxicityCooldownMax = 60;
        this._attackDirection = 'right';
        this.spriteWidth = 64;
        this.spriteHeight = 64;
        this.game = game;
        this.speed = PLAYER_CONFIG.SPEED;
        this.mana = game.getPlayerData().mana || 30;
        this.maxMana = game.getPlayerData().maxMana || 30;
        this.direction = 'right';
        this.loadSprite();
    }
    async loadSprite() {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                if (img.complete && img.naturalWidth > 0) {
                    this.spriteSheet = new SpriteSheet(img, 64, 64);
                    this.spriteSheet.framesPerRow = 8;
                    this.setupAnimations();
                    this.spriteLoaded = true;
                    resolve();
                }
            };
            img.onerror = () => resolve();
            img.src = 'assets/images/sprites/knight/16x16 knight 3 v3.png';
        });
    }
    setupAnimations() {
        if (!this.spriteSheet)
            return;
        this.animations.idle = new Animation(this.spriteSheet, [0, 1, 2, 3], 0.25, true);
        this.animations.run = new Animation(this.spriteSheet, [8, 9, 10, 11, 12, 13], 0.12, true);
        this.animations.attack = new Animation(this.spriteSheet, [32, 33, 34, 35, 36, 37], 0.12, false);
        this.animations.block = new Animation(this.spriteSheet, [50, 51, 52, 53, 54, 55, 56, 57, 58, 59], 0.12, true);
        this.animations.hurt = new Animation(this.spriteSheet, [40], 0.3, false);
        this.animations.dead = new Animation(this.spriteSheet, [48, 49, 50, 51, 52, 53, 54], 0.15, false);
        this.currentAnimation = this.animations.idle;
        this.currentAnimation.play();
    }
    switchAnimation(newAnimation) {
        if (this.currentAnimation === newAnimation)
            return;
        if (this.currentAnimation && this.currentAnimation.isPlayingAnimation() && this.currentAnimation !== this.animations.attack) {
            const anim = this.currentAnimation;
            if (!anim.loop && anim.isPlaying) {
                return;
            }
        }
        this.currentAnimation = newAnimation;
        this.currentAnimation.play();
    }
    update(deltaTime, keys) {
        if (!keys)
            return;
        if (this.toxicityCooldown > 0)
            this.toxicityCooldown -= deltaTime * 60;
        if (!this.isAlive) {
            if (this.currentAnimation && this.animations.dead) {
                this.currentAnimation.update(deltaTime);
                if (this.currentAnimation !== this.animations.dead) {
                    this.currentAnimation = this.animations.dead;
                    this.animations.dead.play();
                }
            }
            return;
        }
        if (this.isTakingDamage) {
            this.damageTimer += deltaTime;
            if (this.currentAnimation) {
                this.currentAnimation.update(deltaTime);
            }
            const damageDuration = 0.3;
            if (this.damageTimer >= damageDuration) {
                this.damageTimer = 0;
                this.isTakingDamage = false;
            }
            return;
        }
        if (this.isAttacking) {
            this.attackTimer += deltaTime;
            if (this.currentAnimation) {
                this.currentAnimation.update(deltaTime);
            }
            const attackDuration = this.animations.attack.frames.length * this.animations.attack.frameDuration;
            if (this.attackTimer >= attackDuration) {
                this._damageApplied = false;
                this.attackTimer = 0;
                this.isAttacking = false;
            }
            return;
        }
        const speedPerSecond = this.speed * 60;
        this.isMoving = false;
        let newX = this.x;
        let newY = this.y;
        if (keys['ArrowUp'] || keys['z'] || keys['Z']) {
            newY -= speedPerSecond * deltaTime;
            this.direction = 'up';
            this.isMoving = true;
        }
        if (keys['ArrowDown'] || keys['w'] || keys['W']) {
            newY += speedPerSecond * deltaTime;
            this.direction = 'down';
            this.isMoving = true;
        }
        if (keys['ArrowRight'] || keys['s'] || keys['S']) {
            newX += speedPerSecond * deltaTime;
            this.direction = 'right';
            this.isMoving = true;
        }
        if (keys['ArrowLeft'] || keys['q'] || keys['Q']) {
            newX -= speedPerSecond * deltaTime;
            this.direction = 'left';
            this.isMoving = true;
        }
        const canvas = this.game.getRenderer().getCanvas();
        const baseSize = this.game.getRenderer().getBaseSize();
        this.x = Math.max(0, Math.min(baseSize.width - this.width, newX));
        const visibleHeight = Math.floor(baseSize.height * 0.70);
        const maxY = visibleHeight - this.height;
        this.y = Math.max(0, Math.min(maxY, newY));
        if (this.currentAnimation) {
            this.currentAnimation.update(deltaTime);
        }
        if (!this.isTakingDamage) {
            let targetAnimation = null;
            if (this.isBlocking) {
                targetAnimation = this.animations.block;
            }
            else if (this.isMoving) {
                targetAnimation = this.animations.run;
            }
            else {
                targetAnimation = this.animations.idle;
            }
            if (targetAnimation) {
                this.switchAnimation(targetAnimation);
            }
        }
    }
    attack() {
        if (this.isAttacking || !this.isAlive || this.isBlocking)
            return;
        if (!this.animations.attack)
            return;
        this.isAttacking = true;
        this.attackTimer = 0;
        this._damageApplied = false;
        this._attackDirection = this.direction;
        this.currentAnimation = this.animations.attack;
        this.animations.attack.play();
    }
    block(blocking) {
        if (this.isAlive)
            this.isBlocking = blocking;
    }
    useToxicity() {
        const cost = 20;
        if (this.toxicityCooldown <= 0 && this.mana >= cost && this.isAlive && !this.isBlocking) {
            this.mana -= cost;
            const playerData = this.game.getPlayerData();
            this.game.setPlayerData({ mana: this.mana });
            this.toxicityCooldown = this.toxicityCooldownMax;
            return true;
        }
        return false;
    }
    getSpriteSheet() {
        return this.spriteSheet;
    }
    getCurrentAnimation() {
        return this.currentAnimation;
    }
    shouldFlipX() {
        return this.isAttacking ? (this._attackDirection === 'left') : (this.direction === 'left');
    }
    getStats() {
        const playerData = this.game.getPlayerData();
        return {
            hp: playerData.hp,
            maxHp: playerData.maxHp,
            strength: playerData.strength,
            toxicity: playerData.toxicity,
            endurance: playerData.endurance
        };
    }
    takeDamage(amount) {
        if (this.isBlocking)
            return;
        const playerData = this.game.getPlayerData();
        const newHp = Math.max(0, playerData.hp - amount);
        this.game.setPlayerData({ hp: newHp });
        if (newHp <= 0) {
            this.isAlive = false;
            if (this.animations.dead) {
                if (this.isAttacking) {
                    this.isAttacking = false;
                    this.attackTimer = 0;
                    this._damageApplied = false;
                }
                if (this.isTakingDamage) {
                    this.isTakingDamage = false;
                    this.damageTimer = 0;
                }
                this.currentAnimation = this.animations.dead;
                this.animations.dead.reset();
                this.animations.dead.play();
            }
            return;
        }
        if (this.isAlive && this.animations.hurt) {
            if (this.isAttacking) {
                this.isAttacking = false;
                this.attackTimer = 0;
                this._damageApplied = false;
            }
            this.isTakingDamage = true;
            this.damageTimer = 0;
            this.currentAnimation = this.animations.hurt;
            this.animations.hurt.reset();
            this.animations.hurt.play();
        }
    }
    heal(amount) {
        const playerData = this.game.getPlayerData();
        const newHp = Math.min(playerData.maxHp, playerData.hp + amount);
        this.game.setPlayerData({ hp: newHp });
    }
    isDeathAnimationComplete() {
        if (this.isAlive)
            return false;
        if (!this.animations.dead)
            return true;
        return !this.animations.dead.isPlayingAnimation();
    }
    getDamageApplied() {
        return this._damageApplied;
    }
    setDamageApplied(value) {
        this._damageApplied = value;
    }
}
//# sourceMappingURL=Player.js.map