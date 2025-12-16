class Player {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.spriteWidth = 64;
        this.spriteHeight = 64;
        this.width = 160;
        this.height = 160;
        this.speed = PLAYER_CONFIG.SPEED;

        this.direction = 'right';
        this.isMoving = false;

        this.spriteSheet = null;
        this.currentAnimation = null;
        this.animations = {};
        this.spriteLoaded = false;

        this.isAlive = true;
        this.isAttacking = false;
        this.attackTimer = 0;
        this._damageApplied = false;
        this.isBlocking = false;
        // FIX 1 : Verrou d'entrée d'attaque
        this.hasStartedAttack = false;

        this.mana = game.playerData.mana || 30;
        this.maxMana = game.playerData.maxMana || 30;

        this.toxicityCooldown = 0;
        this.toxicityCooldownMax = 60;

        this.loadSprite();
    }

    async loadSprite() {
        const img = new Image();
        img.onload = () => {
            if (img.complete && img.naturalWidth > 0) {
                this.spriteSheet = new SpriteSheet(img, 64, 64);
                this.setupAnimations();
                this.spriteLoaded = true;
            } else {
                console.error('Sprite non chargé correctement');
            }
        };
        img.onerror = () => console.error('Erreur chargement sprite');
        img.src = 'assets/images/sprites/knight/16x16 knight 3 v3.png';
    }

    setupAnimations() {
        if (!this.spriteSheet) return;
        this.animations.idle = new Animation(this.spriteSheet, [0,1,2,3], 0.25, true);
        this.animations.run = new Animation(this.spriteSheet, [10,11,12,13,14,15], 0.12, true);
        this.animations.attack = new Animation(this.spriteSheet, [
            20,21,22,23,24,25,26,27,28,29,
            30,31,32,33,34,35,36,37,38,39
        ], 0.07, false);
        this.animations.block = new Animation(this.spriteSheet, [50,51,52,53,54,55,56,57,58,59], 0.12, true);
        this.animations.dead = new Animation(this.spriteSheet, [40,41,42,43,44,45,46,47,48,49], 0.15, false);

        this.currentAnimation = this.animations.idle;
        this.currentAnimation.play();
    }

    update(keys, deltaTime = 1/60) {
        if (!keys) {
            console.warn('Player.update: keys is undefined or null');
            return;
        }
        
        if (this.toxicityCooldown > 0) this.toxicityCooldown -= deltaTime * 60; // Convertir en frames pour compatibilité

        // Mouvement basé sur deltaTime (vitesse en pixels par seconde)
        const speedPerSecond = this.speed * 60; // Convertir de pixels/frame à pixels/seconde (3 * 60 = 180 px/s)
        this.isMoving = false;
        let newX = this.x, newY = this.y;
        
        // Détection des touches de mouvement
        if (keys['ArrowUp'] || keys['z'] || keys['Z']) { 
            newY -= speedPerSecond * deltaTime; 
            this.direction='up'; 
            this.isMoving=true; 
        }
        if (keys['ArrowDown'] || keys['w'] || keys['W']) { 
            newY += speedPerSecond * deltaTime; 
            this.direction='down'; 
            this.isMoving=true; 
        }
        if (keys['ArrowRight'] || keys['s'] || keys['S']) { 
            newX += speedPerSecond * deltaTime; 
            this.direction='right'; 
            this.isMoving=true; 
        }
        if (keys['ArrowLeft'] || keys['q'] || keys['Q']) { 
            newX -= speedPerSecond * deltaTime; 
            this.direction='left'; 
            this.isMoving=true; 
        }

        this.x = Math.max(0, Math.min(this.game.canvas.width - this.width, newX));
        this.y = Math.max(0, Math.min(this.game.canvas.height - this.height, newY));

        // FIX 3 : Fin d'attaque propre
        if (this.isAttacking) {
            // Si l'attaque vient de commencer, déclencher l'animation
            if (!this.hasStartedAttack) {
                this.currentAnimation = this.animations.attack;
                this.currentAnimation.reset();
                this.currentAnimation.play();
                this.hasStartedAttack = true;
            }
            
            this.attackTimer += deltaTime;
            this.currentAnimation.update(deltaTime);
            const attackDuration = this.animations.attack.frames.length * this.animations.attack.frameDuration;
            if (this.attackTimer >= attackDuration) {
                this.isAttacking = false;
                this.hasStartedAttack = false; // RESET PROPRE
                this.attackTimer = 0;
                this._damageApplied = false;
                this.currentAnimation = this.animations.idle;
                this.currentAnimation.reset();
                this.currentAnimation.play();
            }
            return; // Ne jamais changer d'animation avant la fin
        }

        if (this.currentAnimation) {
            this.currentAnimation.update(deltaTime);
        }

        // Sélectionner l'animation selon l'état
        let targetAnimation = null;
        if (!this.isAlive) {
            targetAnimation = this.animations.dead;
        } else if (this.isBlocking) {
            targetAnimation = this.animations.block;
        } else if (this.isMoving) {
            targetAnimation = this.animations.run;
        } else {
            targetAnimation = this.animations.idle;
        }

        // CRITIQUE : Ne pas changer d'animation si on est déjà sur la bonne animation
        if (!this.isAttacking) {
            if (!this.isMoving && this.currentAnimation === this.animations.idle) {
                targetAnimation = this.animations.idle;
            } else if (this.isMoving && this.currentAnimation === this.animations.run) {
                targetAnimation = this.animations.run;
            }
        }

        // S'assurer qu'on a toujours une animation valide
        if (!targetAnimation) {
            targetAnimation = this.animations.idle;
        }

        // S'assurer que currentAnimation n'est jamais null
        if (!this.currentAnimation) {
            this.currentAnimation = this.animations.idle;
        }

        // Changer d'animation seulement quand c'est NECESSAIRE
        if (targetAnimation && this.currentAnimation !== targetAnimation) {
            // Ne JAMAIS interrompre une animation non-loop en cours
            if (!this.currentAnimation.loop && this.currentAnimation.isPlaying) {
                // On attend la fin
            } else {
                // Changer d'animation de manière atomique
                this.currentAnimation = targetAnimation;
                this.currentAnimation.reset();
                this.currentAnimation.play();
            }
        }
    }

    // FIX 1 : Verrou d'entrée d'attaque
    attack() {
        if (!this.isAttacking && this.isAlive && !this.isBlocking) {
            this.isAttacking = true;
            this.hasStartedAttack = false; // IMPORTANT
            this.attackTimer = 0;
        }
    }

    block(blocking) { 
        if (this.isAlive) this.isBlocking = blocking; 
    }

    useToxicity() {
        const cost = 20;
        if (this.toxicityCooldown <= 0 && this.mana >= cost && this.isAlive && !this.isBlocking) {
            this.mana -= cost;
            this.game.playerData.mana = this.mana;
            this.toxicityCooldown = this.toxicityCooldownMax;
            return true;
        }
        return false;
    }

    render(ctx) {
        if (!this.spriteLoaded || !this.spriteSheet || !this.currentAnimation) {
            ctx.fillStyle = COLORS.PLAYER;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            return;
        }

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset context

        const frameIndex = this.currentAnimation.getCurrentFrameIndex();
        const flipX = this.direction === 'left';

        if (frameIndex === undefined || frameIndex === null || isNaN(frameIndex) || frameIndex < 0) {
            ctx.fillStyle = COLORS.PLAYER;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
            return;
        }

        const row = Math.floor(frameIndex / this.spriteSheet.framesPerRow);
        const col = frameIndex % this.spriteSheet.framesPerRow;

        const sourceX = col * this.spriteSheet.frameWidth;
        const sourceY = row * this.spriteSheet.frameHeight;

        if (sourceX < 0 || sourceY < 0 ||
            sourceX + this.spriteSheet.frameWidth > this.spriteSheet.image.width ||
            sourceY + this.spriteSheet.frameHeight > this.spriteSheet.image.height) {
            ctx.fillStyle = COLORS.PLAYER;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
            return;
        }

        if (flipX) {
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
            ctx.drawImage(
                this.spriteSheet.image,
                sourceX, sourceY, this.spriteSheet.frameWidth, this.spriteSheet.frameHeight,
                0, 0, this.width, this.height
            );
        } else {
            ctx.drawImage(
                this.spriteSheet.image,
                sourceX, sourceY, this.spriteSheet.frameWidth, this.spriteSheet.frameHeight,
                this.x, this.y, this.width, this.height
            );
        }
        ctx.restore();
    }

    getStats() {
        return {
            hp: this.game.playerData.hp,
            maxHp: this.game.playerData.maxHp,
            strength: this.game.playerData.strength,
            toxicity: this.game.playerData.toxicity,
            endurance: this.game.playerData.endurance
        };
    }

    takeDamage(amount) {
        // Si le joueur bloque, il ne prend pas de dégâts
        if (this.isBlocking) {
            return;
        }
        
        this.game.playerData.hp = Math.max(0, this.game.playerData.hp - amount);
        if (this.game.playerData.hp <= 0) {
            this.isAlive = false;
        }
    }

    heal(amount) {
        this.game.playerData.hp = Math.min(this.game.playerData.maxHp, this.game.playerData.hp + amount);
    }

    checkCollision(x, y) {
        try {
            if (this.game && this.game.currentPhase && this.game.currentPhase.tileMap) {
                const tileMap = this.game.currentPhase.tileMap;
                if (tileMap && tileMap.map && Array.isArray(tileMap.map) && tileMap.map.length > 0) {
                    return tileMap.isObstacle(x, y, this.width, this.height);
                }
            }
        } catch (error) {
            console.warn('Erreur lors de la vérification de collision:', error);
            return false;
        }
        return false;
    }
}

