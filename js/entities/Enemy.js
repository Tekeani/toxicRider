class Enemy {
    static spriteSheetImage = null;

    constructor(x, y, type, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.type = type;
        this.config = ENEMY_TYPES[type] || ENEMY_TYPES.WEAK;
        
        // Les sprites du pack sont en 16x16, affichés plus petits que le chevalier
        this.spriteWidth = 16;  // Largeur réelle du sprite dans la feuille
        this.spriteHeight = 16; // Hauteur réelle du sprite dans la feuille
        this.width = 48;        // Largeur d'affichage (réduite encore)
        this.height = 48;       // Hauteur d'affichage (réduite encore)
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
                console.log('✅ Sprite sheet ennemis chargé:', img.width, 'x', img.height);
                resolve();
            };
            img.onerror = () => {
                console.error('❌ Erreur chargement sprite ennemis');
                reject();
            };
            img.src = 'assets/images/sprites/enemies/roguelikecreatures.png';
        });
    }

    async loadSprite() {
        await Enemy.loadSharedSprite();
        if (Enemy.spriteSheetImage) {
            // Le sprite sheet contient des sprites de 16x16 pixels
            this.spriteSheet = new SpriteSheet(Enemy.spriteSheetImage, 16, 16);
            this.spriteLoaded = true;
            console.log('✅ SpriteSheet ennemis initialisé avec 16x16');
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
            
            // Note : Les attaques sont gérées tour à tour dans Phase1_Roguelike.update()
            // pour éviter que tous les ennemis attaquent en même temps
        }
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

    render(ctx) {
        if (!this.isAlive) return;

        if (!this.spriteLoaded || !this.spriteSheet) {
            ctx.fillStyle = COLORS.ENEMY;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            return;
        }

        // Calculer la position du sprite dans la feuille (sprites de 16x16)
        // Le sprite sheet est organisé en grille, on utilise spriteIndex pour choisir un sprite
        const spriteRow = Math.floor(this.spriteIndex / 4);
        const spriteCol = this.spriteIndex % 4;
        const sx = spriteCol * this.spriteWidth;
        const sy = spriteRow * this.spriteHeight;

        // Désactiver l'anti-aliasing pour un rendu pixel art net
        ctx.imageSmoothingEnabled = false;
        
        const flipX = this.direction === 'left';

        if (flipX) {
            ctx.save();
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
            ctx.drawImage(
                this.spriteSheet.image,
                sx, sy, this.spriteWidth, this.spriteHeight,
                0, 0, this.width, this.height
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.spriteSheet.image,
                sx, sy, this.spriteWidth, this.spriteHeight,
                this.x, this.y, this.width, this.height
            );
        }
    }
}



