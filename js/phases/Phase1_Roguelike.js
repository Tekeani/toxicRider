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
        this.keys = {};
        this._attackPressed = false;
        this._toxicityPressed = false;
        this.upgradeMenuActive = false;
        this.selectedUpgrade = null;

        this.setupInput();
    }

    async init() {
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Initialiser la tilemap
        this.tileMap = new TileMap(Math.ceil(width / 32), Math.ceil(height / 32), 32);
        this.tileMap.generateMap();
        
        try {
            await this.tileMap.loadTileset('assets/images/tilesets/mana_forest/big_tree.png');
            this.tilesLoaded = true;
        } catch (e) {
            console.warn('Tileset non chargé, utilisation du rendu de fallback');
            this.tilesLoaded = false;
        }

        // Position initiale du joueur
        this.player = new Player(width / 2 - 72, height / 2 - 72, this.game);

        // Spawn immédiat de la première vague
        this.spawnWave();
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;

            // Attaque à l'épée (E ou Enter)
            if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter') && !this._attackPressed) {
                this._attackPressed = true;
                if (this.player && !this.upgradeMenuActive) {
                    this.player.attack();
                }
            }

            // Sort/Toxicité (R)
            if ((e.key === 'r' || e.key === 'R') && !this._toxicityPressed) {
                this._toxicityPressed = true;
                if (this.player && !this.upgradeMenuActive) {
                    this.useToxicity();
                }
            }

            // Blocage (Shift)
            if (e.key === 'Shift' && this.player) {
                this.player.block(true);
            }

            // Menu d'amélioration
            if (this.upgradeMenuActive) {
                if (e.key === '1') {
                    this.upgradeStat('strength');
                } else if (e.key === '2') {
                    this.upgradeStat('toxicity');
                } else if (e.key === '3') {
                    this.upgradeStat('endurance');
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;

            if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') {
                this._attackPressed = false;
            }

            if (e.key === 'r' || e.key === 'R') {
                this._toxicityPressed = false;
            }

            if (e.key === 'Shift' && this.player) {
                this.player.block(false);
            }
        });
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
        if (this.upgradeMenuActive) return;

        // Mise à jour du joueur
        if (this.player) {
            this.player.update(keys);
            
            // Vérifier l'attaque
            if (this.player.isAttacking) {
                this.playerAttack('strength');
            }
        }

        // Mise à jour des ennemis
        this.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                enemy.update();
            }
        });

        // Nettoyer les ennemis morts
        this.enemies = this.enemies.filter(e => e.isAlive);

        // Vérifier si la vague est terminée
        if (this.enemies.length === 0 && !this.allWavesComplete && this.currentWave < this.waves.length) {
            this.upgradeMenuActive = true;
        }

        // Vérifier si toutes les vagues sont terminées
        if (this.enemies.length === 0 && this.allWavesComplete) {
            // Passer à la phase suivante
            setTimeout(() => {
                this.game.nextPhase();
            }, 1000);
        }

        // Mise à jour des feedbacks d'attaque
        this.attackFeedbacks = this.attackFeedbacks.filter(feedback => {
            feedback.timer--;
            feedback.y -= 1;
            return feedback.timer > 0;
        });

        // Vérifier si le joueur est mort
        if (this.player && !this.player.isAlive) {
            // Game Over
            console.log('Game Over');
        }
    }

    render(ctx) {
        // Nettoyer le canvas en premier
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 1. Fond/tiles
        if (this.tilesLoaded && this.tileMap) {
            this.tileMap.render(ctx);
        } else {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // 2. Ennemis
        this.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                enemy.render(ctx);
            }
        });

        // 3. Joueur
        if (this.player) {
            this.player.render(ctx);
        }

        // 4. Feedbacks
        this.attackFeedbacks.forEach(feedback => {
            ctx.fillStyle = feedback.color;
            ctx.font = '16px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(feedback.text, feedback.x, feedback.y);
        });

        // 5. Menu d'amélioration
        if (this.upgradeMenuActive) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.fillStyle = '#fff';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Choisissez une amélioration:', this.canvas.width / 2, this.canvas.height / 2 - 60);

            ctx.font = '18px Arial';
            ctx.fillText('1 - Force (+10 dégâts)', this.canvas.width / 2, this.canvas.height / 2 - 20);
            ctx.fillText('2 - Toxicité (+10 TP max)', this.canvas.width / 2, this.canvas.height / 2 + 10);
            ctx.fillText('3 - Endurance (+10 HP max)', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
    }
}

