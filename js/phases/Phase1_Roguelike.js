class Phase1_Roguelike {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        this.ctx = game.ctx;
        this.player = null;
        this.enemies = [];
        this.currentWave = 0;
        this.waves = [
            WAVES_CONFIG.WAVE_1,
            WAVES_CONFIG.WAVE_2,
            WAVES_CONFIG.WAVE_3
        ];
        this.allWavesComplete = false;
        this.tileMap = null;
        this.tilesLoaded = false;
        this.attackFeedbacks = [];
        this._attackPressed = false;
        this._toxicityPressed = false;
        this.upgradeMenuActive = false;
        this.selectedUpgrade = null;

        // IMPORTANT : Stocker les handlers pour pouvoir les retirer
        this.keydownHandler = null;
        this.keyupHandler = null;

        this.setupInput();
    }

    async init() {
        console.log('🎮 Phase1_Roguelike.init() appelé');
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Initialiser la tilemap
        this.tileMap = new TileMap(Math.ceil(width / 32), Math.ceil(height / 32), 32);
        this.tileMap.generateMap();
        
        try {
            await this.tileMap.loadTileset('assets/images/tilesets/mana_forest/big_tree.png');
            this.tilesLoaded = true;
            console.log('✅ Tileset chargé');
        } catch (e) {
            console.warn('Tileset non chargé, utilisation du rendu de fallback');
            this.tilesLoaded = false;
        }

        // Position initiale du joueur (même position que dans la cinématique)
        this.player = new Player(width / 2 - 80, height / 2 - 150, this.game);
        console.log('✅ Joueur créé à la position:', this.player.x, this.player.y);

        // Pas de spawn d'ennemis pour le moment
        // this.spawnWave();
        console.log('✅ Phase1_Roguelike initialisée complètement');
    }

    setupInput() {
        // Créer les handlers comme des fonctions fléchées pour garder le contexte
        this.keydownHandler = (e) => {
            // CRITIQUE : Empêcher la propagation pour éviter les doubles déclenchements
            if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter')) {
                e.preventDefault(); // Empêcher le comportement par défaut
                
                if (!this._attackPressed) {
                    this._attackPressed = true;
                    if (this.player && !this.upgradeMenuActive && !this.player.isAttacking) {
                        console.log('🗡️ Attaque déclenchée depuis Phase1');
                        this.player.attack();
                    }
                }
                return; // Sortir immédiatement
            }

            if ((e.key === 'r' || e.key === 'R')) {
                e.preventDefault();
                
                if (!this._toxicityPressed) {
                    this._toxicityPressed = true;
                    if (this.player && !this.upgradeMenuActive) {
                        this.useToxicity();
                    }
                }
                return;
            }

            if (this.upgradeMenuActive) {
                if (e.key === '1') {
                    this.upgradeStat('strength');
                } else if (e.key === '2') {
                    this.upgradeStat('toxicity');
                } else if (e.key === '3') {
                    this.upgradeStat('endurance');
                }
            }
        };

        this.keyupHandler = (e) => {
            if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') {
                this._attackPressed = false;
            }

            if (e.key === 'r' || e.key === 'R') {
                this._toxicityPressed = false;
            }
        };

        // Ajouter les listeners
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
    }

    // Méthode pour nettoyer les listeners (important pour éviter les fuites mémoire)
    cleanup() {
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
        }
        if (this.keyupHandler) {
            document.removeEventListener('keyup', this.keyupHandler);
        }
    }

    spawnWave() {
        if (this.currentWave >= this.waves.length) {
            this.allWavesComplete = true;
            return;
        }

        const wave = this.waves[this.currentWave];
        this.enemies = [];

        for (let i = 0; i < wave.count; i++) {
            const angle = (Math.PI * 2 * i) / wave.count;
            const distance = 300;
            const x = this.canvas.width / 2 + Math.cos(angle) * distance;
            const y = this.canvas.height / 2 + Math.sin(angle) * distance;

            const enemy = new Enemy(x, y, wave.type, this.game);
            this.enemies.push(enemy);
        }
    }

    playerAttack(type) {
        if (!this.player || !this.player.isAttacking) return;

        const player = this.player;
        const damage = type === 'strength' ? player.game.playerData.strength : 30;
        const range = type === 'strength' ? 60 : 150;

        // Appliquer les dégâts une seule fois au milieu de l'animation
        if (!player._damageApplied && player.isAttacking) {
            const attackFrame = 10; // Frame clé de l'attaque
            if (player.currentAnimation && player.currentAnimation.currentFrame === attackFrame) {
                this.enemies.forEach(enemy => {
                    if (enemy.isAlive) {
                        const dx = enemy.x - player.x;
                        const dy = enemy.y - player.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance <= range) {
                            enemy.takeDamage(damage);
                            this.attackFeedbacks.push({
                                text: `-${damage}`,
                                x: enemy.x + enemy.width / 2,
                                y: enemy.y,
                                color: '#ff0000',
                                timer: 60
                            });
                        }
                    }
                });
                player._damageApplied = true;
            }
        }
    }

    useToxicity() {
        if (this.player && this.player.useToxicity()) {
            const player = this.player;
            const damage = 30;
            const range = 150;

            this.enemies.forEach(enemy => {
                if (enemy.isAlive) {
                    const dx = enemy.x - player.x;
                    const dy = enemy.y - player.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance <= range) {
                        enemy.takeDamage(damage);
                        this.attackFeedbacks.push({
                            text: `-${damage}`,
                            x: enemy.x + enemy.width / 2,
                            y: enemy.y,
                            color: '#00ffff',
                            timer: 60
                        });
                    }
                }
            });
        }
    }

    upgradeStat(stat) {
        if (!this.upgradeMenuActive) return;

        const playerData = this.game.playerData;

        if (stat === 'strength') {
            playerData.strength += 10;
        } else if (stat === 'toxicity') {
            playerData.maxMana += 10;
            playerData.mana = playerData.maxMana;
        } else if (stat === 'endurance') {
            playerData.maxHp += 10;
            playerData.hp = playerData.maxHp;
        }

        this.upgradeMenuActive = false;
        this.currentWave++;
        this.spawnWave();
    }

    update(deltaTime, keys) {
        // Log une seule fois pour confirmer que update est appelé
        if (!this._updateLogged) {
            console.log('🔄 Phase1_Roguelike.update() appelé - player:', this.player ? 'existe' : 'null');
            this._updateLogged = true;
        }
        
        // Pas de menu d'amélioration pour le moment
        // if (this.upgradeMenuActive) return;

        // Mise à jour du joueur
        if (this.player) {
            this.player.update(keys, deltaTime);
            
            // Pas d'attaque pour le moment
            // if (this.player.isAttacking) {
            //     this.playerAttack('strength');
            // }
        } else {
            console.warn('⚠️ Phase1_Roguelike: player is null');
        }

        // Pas de mise à jour des ennemis pour le moment
        // this.enemies.forEach(enemy => {
        //     if (enemy.isAlive) {
        //         enemy.update();
        //     }
        // });

        // Pas de nettoyage des ennemis pour le moment
        // this.enemies = this.enemies.filter(e => e.isAlive);

        // Pas de vérification de vague pour le moment
        // if (this.enemies.length === 0 && !this.allWavesComplete && this.currentWave < this.waves.length) {
        //     this.upgradeMenuActive = true;
        // }

        // Pas de passage à la phase suivante pour le moment
        // if (this.enemies.length === 0 && this.allWavesComplete) {
        //     setTimeout(() => {
        //         this.game.nextPhase();
        //     }, 1000);
        // }

        // Pas de feedbacks d'attaque pour le moment
        // this.attackFeedbacks = this.attackFeedbacks.filter(feedback => {
        //     feedback.timer--;
        //     feedback.y -= 1;
        //     return feedback.timer > 0;
        // });

        // Vérifier si le joueur est mort
        if (this.player && !this.player.isAlive) {
            // Game Over
            console.log('Game Over');
        }
    }

    render(ctx) {
        // GUARD ANTI-RÉCURSION
        if (this._isCurrentlyRendering) {
            return; // Bloquer les appels récursifs
        }
        this._isCurrentlyRendering = true;
        
        try {
            // LOG: Vérifier combien de fois render est appelé
            if (!this._renderCount) this._renderCount = 0;
            this._renderCount++;
            
            if (this.player && this.player.isAttacking && Math.random() < 0.1) {
                console.log('📺 Phase1 render #' + this._renderCount, {
                    hasPlayer: !!this.player,
                    playerAttacking: this.player.isAttacking,
                    playerX: this.player.x,
                    playerY: this.player.y
                });
            }
            
            // Nettoyer le canvas en premier
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Désactiver l'anti-aliasing pour un rendu pixel art
        ctx.imageSmoothingEnabled = false;
        
        // Sol en damier avec 2 verts seulement (même décor que la cinématique)
        const green1 = '#90EE90'; // Vert clair
        const green2 = '#32CD32'; // Vert moyen
        const tileSize = 32;
        
        // Créer un damier avec 2 verts
        for (let x = 0; x < this.canvas.width; x += tileSize) {
            for (let y = 0; y < this.canvas.height; y += tileSize) {
                const tileX = Math.floor(x / tileSize);
                const tileY = Math.floor(y / tileSize);
                // Alternance en damier
                ctx.fillStyle = (tileX + tileY) % 2 === 0 ? green1 : green2;
                ctx.fillRect(x, y, tileSize, tileSize);
            }
        }
        
        // ARBRES - Désactiver l'anti-aliasing pour pixel art
        ctx.imageSmoothingEnabled = false;
        
        // Arbres simples : carrés collés (tronc marron + feuillage vert)
        const drawSimpleTree = (x, y) => {
            // Tronc marron (rectangle vertical)
            ctx.fillStyle = '#8B4513';
            const trunkWidth = 40;
            const trunkHeight = 80;
            ctx.fillRect(x - trunkWidth/2, y - trunkHeight, trunkWidth, trunkHeight);
            
            // Feuillage vert (carrés collés au-dessus du tronc)
            ctx.fillStyle = '#006400'; // Vert foncé différent du sol
            // Carré du bas (le plus large)
            ctx.fillRect(x - 40, y - trunkHeight - 40, 80, 40);
            // Carré du milieu
            ctx.fillRect(x - 30, y - trunkHeight - 80, 60, 40);
            // Carré du haut (le plus petit)
            ctx.fillRect(x - 20, y - trunkHeight - 110, 40, 30);
        };
        
        // Positionner les arbres dispersés partout sur l'écran (vue du dessus)
        const trees = [
            {x: 150, y: 200},   // Haut gauche
            {x: 400, y: 150},   // Haut centre
            {x: 750, y: 180},   // Haut droite
            {x: 250, y: 500},   // Bas gauche
            {x: 600, y: 550},   // Bas centre
            {x: 900, y: 520}    // Bas droite
        ];
        
        // Dessiner les arbres
        trees.forEach(tree => {
            drawSimpleTree(tree.x, tree.y);
        });
        
        // Rochers en pixel art (vue du dessus)
        const drawPixelRockTopDown = (x, y, size) => {
            // Différents gris pour les rochers
            const grays = ['#696969', '#808080', '#A9A9A9', '#778899'];
            const grayIndex = Math.floor((x + y) / 50) % grays.length;
            
            // Forme de rocher vue de dessus (forme irrégulière)
            ctx.fillStyle = grays[grayIndex];
            
            // Corps principal (forme ovale/carrée arrondie)
            ctx.beginPath();
            ctx.ellipse(x, y, size * 0.6, size * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Détails (taches plus sombres)
            ctx.fillStyle = grays[0];
            ctx.beginPath();
            ctx.ellipse(x - size * 0.2, y, size * 0.2, size * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = grays[2];
            ctx.beginPath();
            ctx.ellipse(x + size * 0.15, y + size * 0.1, size * 0.15, size * 0.1, 0, 0, Math.PI * 2);
            ctx.fill();
        };
        
        // Positionner les rochers
        const rocks = [
            {x: 80, y: 100, size: 35},
            {x: 250, y: 80, size: 30},
            {x: 480, y: 200, size: 40},
            {x: 680, y: 150, size: 32},
            {x: 920, y: 120, size: 38},
            {x: 180, y: 350, size: 35},
            {x: 420, y: 500, size: 30},
            {x: 720, y: 450, size: 40},
            {x: 880, y: 550, size: 32}
        ];
        
        rocks.forEach(rock => {
            drawPixelRockTopDown(rock.x, rock.y, rock.size);
        });

        // 2. Ennemis (désactivés pour le moment)
        // this.enemies.forEach(enemy => {
        //     if (enemy.isAlive) {
        //         enemy.render(ctx);
        //     }
        // });

        // 3. Joueur
        if (this.player && this.player.isAttacking && Math.random() < 0.2) {
            console.log('🎨 Avant player.render():', {
                hasPlayer: !!this.player,
                spriteLoaded: this.player.spriteLoaded,
                hasSpriteSheet: !!this.player.spriteSheet,
                hasCurrentAnim: !!this.player.currentAnimation
            });
        }
        if (this.player) {
            this.player.render(ctx);
        }

        // 4. Feedbacks (désactivés pour le moment)
        // this.attackFeedbacks.forEach(feedback => {
        //     ctx.fillStyle = feedback.color;
        //     ctx.font = '16px Courier New';
        //     ctx.textAlign = 'center';
        //     ctx.fillText(feedback.text, feedback.x, feedback.y);
        // });

        // 5. Menu d'amélioration (désactivé pour le moment)
        // if (this.upgradeMenuActive) {
        //     ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        //     ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        //
        //     ctx.fillStyle = '#fff';
        //     ctx.font = '24px Arial';
        //     ctx.textAlign = 'center';
        //     ctx.fillText('Choisissez une amélioration:', this.canvas.width / 2, this.canvas.height / 2 - 60);
        //
        //     ctx.font = '18px Arial';
        //     ctx.fillText('1 - Force (+10 dégâts)', this.canvas.width / 2, this.canvas.height / 2 - 20);
        //     ctx.fillText('2 - Toxicité (+10 TP max)', this.canvas.width / 2, this.canvas.height / 2 + 10);
        //     ctx.fillText('3 - Endurance (+10 HP max)', this.canvas.width / 2, this.canvas.height / 2 + 40);
        // }
        } finally {
            // TOUJOURS remettre à false
            this._isCurrentlyRendering = false;
        }
    }
}

