class Enemy {
    static spriteSheetImage = null;

    constructor(x, y, type, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.type = type;
        this.config = ENEMY_TYPES[type] || ENEMY_TYPES.WEAK;
        
        this.width = 32;
        this.height = 32;
        this.speed = this.config.speed;
        this.hp = this.config.hp;
        this.maxHp = this.config.hp;
        this.damage = this.config.damage;
        
        this.isAlive = true;
        this.direction = 'left';
        this.spriteIndex = Math.floor(Math.random() * 16); // 16 sprites dans roguelikecreatures.png
        
        this.spriteSheet = null;
        this.spriteLoaded = false;
        
        this.loadSprite();
    }

    static async loadSharedSprite() {
        if (Enemy.spriteSheetImage) return Promise.resolve();
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                Enemy.spriteSheetImage = img;
                resolve();
            };
            img.onerror = () => {
                console.error('Erreur chargement sprite ennemis');
                reject();
            };
            img.src = 'assets/images/sprites/enemies/roguelikecreatures.png';
        });
    }

    async loadSprite() {
        await Enemy.loadSharedSprite();
        if (Enemy.spriteSheetImage) {
            this.spriteSheet = new SpriteSheet(Enemy.spriteSheetImage, 32, 32);
            this.spriteLoaded = true;
        }
    }

    update() {
        if (!this.isAlive) return;

        // IA simple : se diriger vers le joueur
        const player = this.game.currentPhase?.player;
        if (player && player.isAlive) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
                this.direction = dx < 0 ? 'left' : 'right';
            }

            // Attaque au contact
            if (distance < 50) {
                this.attack(player);
            }
        }
    }

    attack(player) {
        if (!player.isBlocking) {
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

    render(ctx) {
        if (!this.isAlive) return;

        if (!this.spriteLoaded || !this.spriteSheet) {
            ctx.fillStyle = COLORS.ENEMY;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            return;
        }

        // Calculer la position du sprite dans la feuille (4x4 grid)
        const spriteRow = Math.floor(this.spriteIndex / 4);
        const spriteCol = this.spriteIndex % 4;
        const sx = spriteCol * 32;
        const sy = spriteRow * 32;

        const flipX = this.direction === 'left';

        if (flipX) {
            ctx.save();
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
            ctx.drawImage(
                this.spriteSheet.image,
                sx, sy, 32, 32,
                0, 0, this.width, this.height
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.spriteSheet.image,
                sx, sy, 32, 32,
                this.x, this.y, this.width, this.height
            );
        }
    }
}

