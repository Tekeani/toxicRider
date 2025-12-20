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
                // CRITIQUE : Créer un SpriteSheet avec le bon nombre de frames par row
                this.spriteSheet = new SpriteSheet(img, 64, 64);
                
                // FORCER le bon nombre de colonnes basé sur ton sprite sheet
                this.spriteSheet.framesPerRow = 8;
                
                this.setupAnimations();
                this.spriteLoaded = true;
                console.log('✅ Sprite chargé et animations configurées');
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
        this.animations.run = new Animation(this.spriteSheet, [8,9,10,11,12,13], 0.12, true);
        // FIX : row 5 commence à l'index 32 (row 1=0-7, row 2=8-15, row 3=16-23, row 4=24-31, row 5=32-39)
        // Doc dit frames 19-24 = 6 frames, donc indices 32-37 dans un sprite à 8 colonnes
        this.animations.attack = new Animation(this.spriteSheet, [32,33,34,35,36,37], 0.12, false);
        this.animations.block = new Animation(this.spriteSheet, [50,51,52,53,54,55,56,57,58,59], 0.12, true);
        this.animations.dead = new Animation(this.spriteSheet, [40,41,42,43,44,45,46,47,48,49], 0.15, false);

        this.currentAnimation = this.animations.idle;
        this.currentAnimation.play();
    }

    switchAnimation(newAnimation) {
        // Ne change l'animation QUE si c'est différent
        if (this.currentAnimation === newAnimation) {
            return; // Déjà sur cette animation
        }
        
        // Ne jamais interrompre une animation non-loop en cours
        if (this.currentAnimation && !this.currentAnimation.loop && this.currentAnimation.isPlaying) {
            return; // On attend la fin
        }
        
        // Changer d'animation
        this.currentAnimation = newAnimation;
        this.currentAnimation.play();
    }

    update(keys, deltaTime = 1/60) {
        if (!keys) {
            console.warn('Player.update: keys is undefined or null');
            return;
        }
        
        if (this.toxicityCooldown > 0) this.toxicityCooldown -= deltaTime * 60;

        // ========== GESTION DE L'ATTAQUE EN PRIORITÉ ==========
        if (this.isAttacking) {
            this.attackTimer += deltaTime;
            
            // Mettre à jour l'animation d'attaque
            if (this.currentAnimation) {
                this.currentAnimation.update(deltaTime);
            }
            
            // Vérifier si l'attaque est terminée
            const attackDuration = this.animations.attack.frames.length * this.animations.attack.frameDuration;
            if (this.attackTimer >= attackDuration) {
                // Fin de l'attaque
                this.isAttacking = false;
                this.attackTimer = 0;
                this._damageApplied = false;
            }
            
            // Pendant l'attaque, ne pas gérer le mouvement
            return;
        }
        // ======================================================

        // Mouvement (seulement si pas en attaque)
        const speedPerSecond = this.speed * 60;
        this.isMoving = false;
        let newX = this.x, newY = this.y;
        
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

        // Mise à jour de l'animation courante
        if (this.currentAnimation) {
            this.currentAnimation.update(deltaTime);
        }

        // Sélection de l'animation selon l'état
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

        // Changer d'animation si nécessaire
        if (targetAnimation) {
            this.switchAnimation(targetAnimation);
        }
    }

    attack() {
        // Ne peut pas attaquer si déjà en train d'attaquer
        if (this.isAttacking || !this.isAlive || this.isBlocking) {
            return;
        }
        
        // Vérifier que l'animation existe
        if (!this.animations.attack) {
            return;
        }
        
        console.log('⚔️ Démarrage attaque - Direction:', this.direction);
        
        // Démarrer l'attaque
        this.isAttacking = true;
        this.attackTimer = 0;
        this._damageApplied = false;
        
        // IMPORTANT : Figer la direction pendant l'attaque
        this._attackDirection = this.direction;
        
        // Forcer le changement vers l'animation d'attaque
        this.currentAnimation = this.animations.attack;
        this.animations.attack.play();
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
        if (!this._renderCallCount) this._renderCallCount = 0;
        this._renderCallCount++;
        
        if (this.isAttacking && this._renderCallCount % 60 === 0) {
            console.log('📊 Player.render() appelé', this._renderCallCount, 'fois');
        }
        
        if (!this.spriteLoaded || !this.spriteSheet || !this.currentAnimation) {
            // Fallback : rectangle de couleur
            ctx.fillStyle = COLORS.PLAYER || '#4169E1';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            return;
        }

        ctx.save();
        // CRITIQUE : Désactiver l'anti-aliasing APRÈS save()
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx.oImageSmoothingEnabled = false;

        const frameIndex = this.currentAnimation.getCurrentFrameIndex();
        // Utiliser la direction figée pendant l'attaque
        const flipX = this.isAttacking ? (this._attackDirection === 'left') : (this.direction === 'left');

        // Sécurité : si frameIndex invalide, utiliser 0
        let validFrameIndex = frameIndex;
        if (frameIndex === undefined || frameIndex === null || isNaN(frameIndex) || frameIndex < 0) {
            validFrameIndex = 0;
        }

        const row = Math.floor(validFrameIndex / this.spriteSheet.framesPerRow);
        const col = validFrameIndex % this.spriteSheet.framesPerRow;

        const sourceX = col * this.spriteSheet.frameWidth;
        const sourceY = row * this.spriteSheet.frameHeight;

        // Vérifier que les coordonnées sont valides
        const maxSourceX = this.spriteSheet.image.width - this.spriteSheet.frameWidth;
        const maxSourceY = this.spriteSheet.image.height - this.spriteSheet.frameHeight;
        
        const clampedSourceX = Math.max(0, Math.min(sourceX, maxSourceX));
        const clampedSourceY = Math.max(0, Math.min(sourceY, maxSourceY));

        // Dessiner le sprite avec ou sans flip horizontal
        if (flipX) {
            // Flip horizontal : translate puis scale
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
            ctx.drawImage(
                this.spriteSheet.image,
                clampedSourceX, clampedSourceY, 
                this.spriteSheet.frameWidth, this.spriteSheet.frameHeight,
                0, 0, this.width, this.height
            );
        } else {
            // Pas de flip : dessin normal
            ctx.drawImage(
                this.spriteSheet.image,
                clampedSourceX, clampedSourceY,
                this.spriteSheet.frameWidth, this.spriteSheet.frameHeight,
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
