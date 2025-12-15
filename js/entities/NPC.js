class NPC {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.width = 48;
        this.height = 48;
        this.speed = 2;
        this.direction = 'right';
        this.isMoving = false;
        
        this.spriteSheet = null;
        this.currentAnimation = null;
        this.animations = {};
        this.spriteLoaded = false;
        this._loading = false; // Protection contre les chargements multiples
        
        this.targetX = null;
        this.targetY = null;
        this.hasReachedTarget = false;
        
        this.loadSprite();
    }

    async loadSprite() {
        // Protection : ne pas charger plusieurs fois
        if (this._loading || this.spriteLoaded) {
            return;
        }
        
        this._loading = true;
        const img = new Image();
        img.onload = () => {
            if (img.complete && img.naturalWidth > 0) {
                // Le sprite sheet Gude!Jump est en 16x16 pixels
                this.spriteSheet = new SpriteSheet(img, 16, 16);
                this.setupAnimations();
                this.spriteLoaded = true;
                this._loading = false;
            }
        };
        img.onerror = () => {
            console.error('Erreur chargement sprite NPC');
            this._loading = false;
        };
        img.src = 'assets/images/sprites/npc/playersprite.png';
    }

    setupAnimations() {
        if (!this.spriteSheet) return;
        
        // D'après le pack Gude!Jump :
        // - sit (idle) : frames 4-6 (5-7 dans la description, mais index 0-based = 4-6)
        // - walk : frames 0-7 (1-8 dans la description, mais index 0-based = 0-7)
        this.animations.idle = new Animation(this.spriteSheet, [4, 5, 6], 0.25, true);
        this.animations.walk = new Animation(this.spriteSheet, [0, 1, 2, 3, 4, 5, 6, 7], 0.15, true);
        
        this.currentAnimation = this.animations.idle;
        this.currentAnimation.play();
    }

    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
        this.hasReachedTarget = false;
    }

    update() {
        // Mettre à jour l'animation
        if (this.currentAnimation) {
            this.currentAnimation.update(1/60); // deltaTime approximatif
        }

        if (this.targetX !== null && this.targetY !== null && !this.hasReachedTarget) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 5) {
                this.isMoving = true;
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
                this.direction = dx < 0 ? 'left' : 'right';
                
                // Changer d'animation si nécessaire
                if (this.currentAnimation !== this.animations.walk) {
                    this.currentAnimation = this.animations.walk;
                    this.currentAnimation.reset();
                    this.currentAnimation.play();
                }
            } else {
                this.hasReachedTarget = true;
                this.isMoving = false;
                
                // Changer d'animation si nécessaire
                if (this.currentAnimation !== this.animations.idle) {
                    this.currentAnimation = this.animations.idle;
                    this.currentAnimation.reset();
                    this.currentAnimation.play();
                }
            }
        }
    }

    render(ctx) {
        if (!this.spriteLoaded || !this.spriteSheet || !this.currentAnimation) {
            ctx.fillStyle = COLORS.NPC;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            return;
        }

        const frameIndex = this.currentAnimation.getCurrentFrameIndex();
        if (frameIndex === undefined) return;

        const flipX = this.direction === 'left';
        const scale = this.width / this.spriteSheet.frameWidth; // Agrandir de 16px à 60px

        // Utiliser SpriteSheet.drawFrame pour le rendu correct
        this.spriteSheet.drawFrame(ctx, frameIndex, this.x, this.y, scale, flipX);
    }
}

