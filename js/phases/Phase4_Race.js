class Phase4_Race {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        this.ctx = game.ctx;
        
        // État du jeu
        this.gameState = 'racing'; // 'racing' | 'finished' | 'victory' | 'game_over'
        this.raceTime = 0;
        this.raceDuration = 30; // 30 secondes
        this.finished = false;
        this.gameOver = false;
        
        // Moto
        this.bikeX = this.canvas.width / 2; // Position X de la moto (peut bouger gauche/droite)
        this.bikeY = this.canvas.height * 0.55; // Position Y remontée (55% de la hauteur)
        this.bikeWidth = 80;
        this.bikeHeight = 80;
        this.bikeSpeed = 300; // Vitesse de déplacement gauche/droite (pixels par seconde)
        this.bikeCurrentFrame = 0; // 0 = gauche, 1 = droite
        this.bikeSpriteSheet = null; // Sprite sheet généré
        this.BIKE_SPRITE_SIZE = 32; // Taille d'une frame du sprite sheet
        
        // Route
        this.roadWidth = 400;
        this.roadX = (this.canvas.width - this.roadWidth) / 2;
        this.roadScrollSpeed = 500; // Vitesse de défilement (pixels par seconde)
        this.roadScrollOffset = 0;
        
        // Décor qui défile
        this.trees = [];
        this.rocks = [];
        this.grassPattern = [];
        
        // Ennemis sur la route (obstacles)
        this.enemies = [];
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 2.0; // Spawn un ennemi toutes les 2 secondes
        
        // Confettis et feux d'artifice
        this.confetti = [];
        this.fireworks = [];
        this.fireworkTimer = 0; // Timer pour créer de nouveaux feux d'artifice
        
        // Bouton quitter
        this.buttonPressed = false;
        
        // Input handlers
        this.keydownHandler = null;
        this.keyupHandler = null;
        this.clickHandler = null;
        
        this.setupInput();
    }
    
    async init() {
        console.log('🎮 Phase4_Race.init() appelé');
        
        // Nettoyer les event listeners précédents
        this.cleanup();
        
        // Réinitialiser l'état
        this.gameState = 'racing';
        this.raceTime = 0;
        this.finished = false;
        this.gameOver = false;
        this.bikeX = this.canvas.width / 2;
        this.bikeCurrentFrame = 0;
        this._bikeRenderCount = 0; // Réinitialiser le compteur de debug
        this.roadScrollOffset = 0;
        this.enemies = [];
        this.enemySpawnTimer = 0;
        this.confetti = [];
        this.fireworks = [];
        this.fireworkTimer = 0;
        this.buttonPressed = false;
        
        // Réinitialiser les inputs
        this.setupInput();
        
        // Charger le sprite sheet des ennemis (partagé avec Phase1)
        await Enemy.loadSharedSprite();
        
        // Initialiser le décor
        this.initDecor();
        
        // Générer le sprite sheet de la moto
        this.generateBikeSpriteSheet();
        
        console.log('✅ Phase4_Race initialisée');
    }
    
    generateBikeSpriteSheet() {
        const SPRITE_SIZE = this.BIKE_SPRITE_SIZE;
        const DIRECTIONS = 2; // gauche (0), droite (1)
        
        const canvas = document.createElement("canvas");
        canvas.width = SPRITE_SIZE * DIRECTIONS;
        canvas.height = SPRITE_SIZE;
        
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        
        // Couleurs
        const BLACK = "#000000";
        const DARK_GRAY = "#222222";
        const GRAY = "#444444";
        
        // Dessine une moto vue du dessus, orientée vers le haut (roue avant en haut, roue arrière en bas)
        // direction 0 = guidon penché à gauche, direction 1 = guidon penché à droite
        const drawMotorcycle = (ctx, x, y, direction) => {
            // Roue arrière (fixe, en bas)
            ctx.fillStyle = BLACK;
            ctx.fillRect(x + 14, y + 24, 4, 6);
            
            // Corps moto (fixe, vertical)
            ctx.fillStyle = DARK_GRAY;
            ctx.fillRect(x + 12, y + 8, 8, 16);
            
            // Pilote (fixe)
            ctx.fillStyle = BLACK;
            ctx.fillRect(x + 13, y + 12, 6, 6); // Torse
            ctx.fillRect(x + 14, y + 10, 4, 2); // Tête
            
            // Roue avant (pencher selon la direction, en haut)
            ctx.save();
            ctx.translate(x + 16, y + 4); // Centre de la roue avant
            // Inclinaison : gauche = penché à gauche, droite = penché à droite
            const tiltAngle = direction === 0 ? -0.4 : 0.4; // Angle d'inclinaison
            ctx.rotate(tiltAngle);
            ctx.translate(-2, -3); // Retour au coin de la roue
            ctx.fillStyle = BLACK;
            ctx.fillRect(0, 0, 4, 6);
            ctx.restore();
            
            // Guidon (pencher selon la direction, en haut)
            ctx.save();
            ctx.translate(x + 16, y + 7); // Centre du guidon
            // Même inclinaison que la roue avant
            const handlebarTilt = direction === 0 ? -0.4 : 0.4;
            ctx.rotate(handlebarTilt);
            ctx.translate(-6, -1); // Retour au coin du guidon
            ctx.fillStyle = DARK_GRAY;
            ctx.fillRect(0, 0, 12, 2);
            ctx.restore();
        };
        
        // Génération du sprite sheet
        for (let i = 0; i < DIRECTIONS; i++) {
            drawMotorcycle(ctx, i * SPRITE_SIZE, 0, i);
        }
        
        // Stocker le sprite sheet comme image
        this.bikeSpriteSheet = canvas;
    }
    
    initDecor() {
        // Initialiser les arbres et rochers (qui défilent)
        this.trees = [];
        this.rocks = [];
        
        // Créer quelques arbres et rochers de départ
        for (let i = 0; i < 20; i++) {
            // Arbres à gauche et à droite de la route
            if (Math.random() < 0.5) {
                this.trees.push({
                    x: Math.random() < 0.5 ? this.roadX - 60 - Math.random() * 100 : this.roadX + this.roadWidth + 60 + Math.random() * 100,
                    y: -i * 200 - Math.random() * 200,
                    size: 40 + Math.random() * 30
                });
            } else {
                this.rocks.push({
                    x: Math.random() < 0.5 ? this.roadX - 40 - Math.random() * 80 : this.roadX + this.roadWidth + 40 + Math.random() * 80,
                    y: -i * 150 - Math.random() * 150,
                    size: 20 + Math.random() * 20
                });
            }
        }
    }
    
    setupInput() {
        this.keydownHandler = (e) => {
            if (this.gameState === 'racing') {
                // Déplacement gauche/droite
                if (e.key === 'ArrowLeft' || e.key === 'q' || e.key === 'Q') {
                    e.preventDefault();
                }
                if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                    e.preventDefault();
                }
            } else if (this.gameState === 'victory') {
                // Bouton quitter (clic seulement, pas de clavier)
            }
        };
        
        this.keyupHandler = (e) => {
            // Gestion du relâchement des touches si nécessaire
        };
        
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
        
        // Gestion des clics pour le bouton Quitter
        this.clickHandler = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleClick(x, y);
        };
        this.canvas.addEventListener('click', this.clickHandler);
    }
    
    handleClick(x, y) {
        if (this.gameState === 'game_over') {
            const buttonWidth = 200;
            const buttonHeight = 50;
            const buttonX = this.canvas.width / 2 - buttonWidth / 2;
            let buttonY = this.canvas.height / 2 + 50;
            const pressOffset = this.buttonPressed ? 3 : 0;
            buttonY += pressOffset;
            
            if (x >= buttonX && x <= buttonX + buttonWidth &&
                y >= buttonY && y <= buttonY + buttonHeight) {
                this.buttonPressed = true;
                
                // Redémarrer la course depuis le début
                setTimeout(() => {
                    this.buttonPressed = false;
                    console.log('🔄 Redémarrage de la course');
                    this.init();
                }, 150);
            }
        } else if (this.gameState === 'victory') {
            const dialogWidth = Math.min(800, Math.max(500, this.canvas.width * 0.75));
            const dialogHeight = Math.min(280, Math.max(150, this.canvas.height * 0.35));
            const dialogY = this.canvas.height * 0.15;
            const buttonWidth = 200;
            const buttonHeight = 50;
            const buttonX = this.canvas.width / 2 - buttonWidth / 2;
            let buttonY = dialogY + dialogHeight + 30;
            const pressOffset = this.buttonPressed ? 3 : 0;
            buttonY += pressOffset;
            
            if (x >= buttonX && x <= buttonX + buttonWidth &&
                y >= buttonY && y <= buttonY + buttonHeight) {
                this.buttonPressed = true;
                
                // Réinitialiser complètement le jeu depuis le début (comme un refresh)
                setTimeout(() => {
                    this.buttonPressed = false;
                    console.log('🔄 Réinitialisation complète du jeu (comme un refresh)');
                    
                    // Nettoyer la phase actuelle
                    this.cleanup();
                    
                    // Nettoyer toutes les autres phases
                    if (this.game.phases) {
                        this.game.phases.forEach(phase => {
                            if (phase && phase.cleanup && phase !== this) {
                                phase.cleanup();
                            }
                        });
                    }
                    
                    // Réinitialiser les données du joueur
                    this.game.playerData.hp = PLAYER_CONFIG.INITIAL_HP;
                    this.game.playerData.maxHp = PLAYER_CONFIG.INITIAL_HP;
                    this.game.playerData.mana = PLAYER_CONFIG.INITIAL_MANA;
                    this.game.playerData.maxMana = PLAYER_CONFIG.INITIAL_MANA;
                    this.game.playerData.strength = PLAYER_CONFIG.INITIAL_STRENGTH;
                    this.game.playerData.toxicity = PLAYER_CONFIG.INITIAL_TOXICITY;
                    this.game.playerData.endurance = PLAYER_CONFIG.INITIAL_ENDURANCE;
                    
                    // Arrêter la game loop actuelle
                    this.game.stopGameLoop();
                    
                    // Réinitialiser complètement le jeu
                    this.game.phaseIndex = 0;
                    this.game.currentPhase = null;
                    this.game.phases = [];
                    
                    // Relancer le jeu depuis le début (game.init() va recréer les phases)
                    this.game.init();
                }, 150);
            }
        }
    }
    
    cleanup() {
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
            this.keydownHandler = null;
        }
        if (this.keyupHandler) {
            document.removeEventListener('keyup', this.keyupHandler);
            this.keyupHandler = null;
        }
        if (this.clickHandler) {
            this.canvas.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
        }
    }
    
    update(deltaTime, keys) {
        if (this.gameState === 'racing') {
            // Mise à jour du temps de course
            this.raceTime += deltaTime;
            
            // Vérifier si la course est terminée
            if (this.raceTime >= this.raceDuration) {
                this.finished = true;
                this.gameState = 'victory';
                this.createVictoryEffects();
                return;
            }
            
            // Déplacement de la moto (gauche/droite uniquement)
            let isMovingLeft = keys['ArrowLeft'] || keys['q'] || keys['Q'];
            let isMovingRight = keys['ArrowRight'] || keys['d'] || keys['D'];
            
            if (isMovingLeft) {
                this.bikeX -= this.bikeSpeed * deltaTime;
                // Frame 0 pour tourner à gauche
                this.bikeCurrentFrame = 0;
            } else if (isMovingRight) {
                this.bikeX += this.bikeSpeed * deltaTime;
                // Frame 1 pour tourner à droite
                this.bikeCurrentFrame = 1;
            } else {
                // Rester sur la dernière frame utilisée (pas de frame "centrale")
                // Ou on peut choisir une frame par défaut
                // this.bikeCurrentFrame = 0; // Par exemple, frame gauche par défaut
            }
            
            // Limiter la moto sur la route (avec marges)
            const roadLeft = this.roadX + 20;
            const roadRight = this.roadX + this.roadWidth - 20;
            this.bikeX = Math.max(roadLeft, Math.min(roadRight, this.bikeX));
            
            // Défilement de la route
            this.roadScrollOffset += this.roadScrollSpeed * deltaTime;
            
            // Déplacer les arbres et rochers
            this.trees.forEach(tree => {
                tree.y += this.roadScrollSpeed * deltaTime;
            });
            this.rocks.forEach(rock => {
                rock.y += this.roadScrollSpeed * deltaTime;
            });
            
            // Réinitialiser les éléments qui sortent de l'écran
            this.trees = this.trees.filter(tree => {
                if (tree.y > this.canvas.height + 100) {
                    // Réapparition en haut
                    tree.y = -200 - Math.random() * 200;
                    tree.x = Math.random() < 0.5 ? this.roadX - 60 - Math.random() * 100 : this.roadX + this.roadWidth + 60 + Math.random() * 100;
                }
                return true;
            });
            
            this.rocks = this.rocks.filter(rock => {
                if (rock.y > this.canvas.height + 100) {
                    // Réapparition en haut
                    rock.y = -150 - Math.random() * 150;
                    rock.x = Math.random() < 0.5 ? this.roadX - 40 - Math.random() * 80 : this.roadX + this.roadWidth + 40 + Math.random() * 80;
                }
                return true;
            });
            
            // Génération d'ennemis
            this.enemySpawnTimer += deltaTime;
            if (this.enemySpawnTimer >= this.enemySpawnInterval) {
                this.enemySpawnTimer = 0;
                this.spawnEnemy();
            }
            
            // Déplacer les ennemis
            this.enemies.forEach(enemy => {
                enemy.y += this.roadScrollSpeed * deltaTime;
                // Mettre à jour les animations des ennemis
                if (enemy.spriteSheet) {
                    // Les ennemis bougent vers le bas, donc on peut utiliser une animation simple
                }
            });
            
            // Retirer les ennemis qui sortent de l'écran
            this.enemies = this.enemies.filter(enemy => enemy.y < this.canvas.height + 100);
            
            // Détection de collision avec les ennemis
            const bikeLeft = this.bikeX - this.bikeWidth / 2;
            const bikeRight = this.bikeX + this.bikeWidth / 2;
            const bikeTop = this.bikeY - this.bikeHeight / 2;
            const bikeBottom = this.bikeY + this.bikeHeight / 2;
            
            this.enemies.forEach((enemy) => {
                if (!enemy.isAlive) return;
                
                const enemyLeft = enemy.x - enemy.width / 2;
                const enemyRight = enemy.x + enemy.width / 2;
                const enemyTop = enemy.y - enemy.height / 2;
                const enemyBottom = enemy.y + enemy.height / 2;
                
                // Collision détectée
                if (bikeRight > enemyLeft && bikeLeft < enemyRight &&
                    bikeBottom > enemyTop && bikeTop < enemyBottom) {
                    // Game Over !
                    console.log('💥 Collision avec ennemi ! Game Over');
                    this.gameOver = true;
                    this.gameState = 'game_over';
                }
            });
            
            // Ligne d'arrivée (à 30 secondes - fin de la course)
            if (this.raceTime >= this.raceDuration && !this.finished) {
                this.finished = true;
                this.gameState = 'victory';
                this.createVictoryEffects();
            }
            
        } else if (this.gameState === 'victory') {
            // Mettre à jour les effets de victoire (confettis, feux d'artifice)
            this.updateVictoryEffects(deltaTime);
        } else if (this.gameState === 'game_over') {
            // Ne rien faire, on attend le clic sur le bouton Rejouer
            return;
        }
    }
    
    spawnEnemy() {
        // Générer un ennemi aléatoirement sur la route (sans await pour ne pas bloquer)
        const enemyX = this.roadX + 50 + Math.random() * (this.roadWidth - 100);
        const enemyY = -50;
        
        // Utiliser le type STRONG par défaut pour les ennemis sur la route
        const enemy = new Enemy(enemyX, enemyY, 'STRONG', this.game);
        enemy.loadSprite().then(() => {
            // Sprite chargé, rien à faire de plus
        });
        this.enemies.push(enemy);
    }
    
    createVictoryEffects() {
        // Créer des confettis
        for (let i = 0; i < 100; i++) {
            this.confetti.push({
                x: Math.random() * this.canvas.width,
                y: -10 - Math.random() * 100,
                vx: (Math.random() - 0.5) * 200,
                vy: 100 + Math.random() * 200,
                color: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'][Math.floor(Math.random() * 6)],
                size: 5 + Math.random() * 5,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 5
            });
        }
        
        // Créer des feux d'artifice
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const fireworkX = 100 + Math.random() * (this.canvas.width - 200);
                const fireworkY = 100 + Math.random() * 300;
                this.createFirework(fireworkX, fireworkY);
            }, i * 500);
        }
    }
    
    createFirework(x, y) {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'];
        const numParticles = 30;
        
        for (let i = 0; i < numParticles; i++) {
            const angle = (Math.PI * 2 / numParticles) * i;
            const speed = 100 + Math.random() * 100;
            
            this.fireworks.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 3 + Math.random() * 3,
                life: 1.0,
                lifeDecay: 0.01 + Math.random() * 0.02
            });
        }
    }
    
    updateVictoryEffects(deltaTime) {
        // Mettre à jour les confettis
        this.confetti.forEach(confetti => {
            confetti.x += confetti.vx * deltaTime;
            confetti.y += confetti.vy * deltaTime;
            confetti.vy += 300 * deltaTime; // Gravité
            confetti.rotation += confetti.rotationSpeed * deltaTime;
        });
        
        // Retirer les confettis qui sortent de l'écran et en ajouter de nouveaux
        this.confetti = this.confetti.filter(c => {
            if (c.y > this.canvas.height + 50) {
                // Réapparition en haut avec nouvelles propriétés
                c.y = -10 - Math.random() * 100;
                c.x = Math.random() * this.canvas.width;
                c.vx = (Math.random() - 0.5) * 200;
                c.vy = 100 + Math.random() * 200;
            }
            return true;
        });
        
        // Mettre à jour les feux d'artifice
        this.fireworks.forEach(firework => {
            firework.x += firework.vx * deltaTime;
            firework.y += firework.vy * deltaTime;
            firework.vy += 100 * deltaTime; // Gravité
            firework.life -= firework.lifeDecay;
        });
        
        // Retirer les feux d'artifice qui sont morts
        this.fireworks = this.fireworks.filter(f => f.life > 0);
        
        // Créer de nouveaux feux d'artifice périodiquement
        if (!this.fireworkTimer) this.fireworkTimer = 0;
        this.fireworkTimer += deltaTime;
        if (this.fireworkTimer >= 1.0) {
            this.fireworkTimer = 0;
            const fireworkX = 100 + Math.random() * (this.canvas.width - 200);
            const fireworkY = 100 + Math.random() * 300;
            this.createFirework(fireworkX, fireworkY);
        }
    }
    
    render(ctx) {
        if (this.gameState === 'game_over') {
            this.renderGameOver(ctx);
        } else if (this.gameState === 'racing') {
            this.renderRace(ctx);
        } else if (this.gameState === 'victory') {
            this.renderVictory(ctx);
        }
    }
    
    renderRace(ctx) {
        // Nettoyer le canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Herbe sur les côtés
        ctx.fillStyle = '#4a7c3f';
        ctx.fillRect(0, 0, this.roadX, this.canvas.height);
        ctx.fillRect(this.roadX + this.roadWidth, 0, this.canvas.width - (this.roadX + this.roadWidth), this.canvas.height);
        
        // Route (avec lignes qui défilent)
        ctx.fillStyle = '#444444';
        ctx.fillRect(this.roadX, 0, this.roadWidth, this.canvas.height);
        
        // Lignes au milieu de la route (qui défilent)
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 4;
        ctx.setLineDash([30, 30]);
        ctx.lineDashOffset = -this.roadScrollOffset;
        ctx.beginPath();
        ctx.moveTo(this.roadX + this.roadWidth / 2, 0);
        ctx.lineTo(this.roadX + this.roadWidth / 2, this.canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Bordures de la route
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.roadX, 0);
        ctx.lineTo(this.roadX, this.canvas.height);
        ctx.moveTo(this.roadX + this.roadWidth, 0);
        ctx.lineTo(this.roadX + this.roadWidth, this.canvas.height);
        ctx.stroke();
        
        // Arbres
        ctx.fillStyle = '#2d5016';
        this.trees.forEach(tree => {
            // Tronc
            ctx.fillRect(tree.x - 5, tree.y, 10, tree.size);
            // Feuillage
            ctx.fillStyle = '#3d7c2f';
            ctx.beginPath();
            ctx.arc(tree.x, tree.y, tree.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2d5016';
        });
        
        // Rochers
        ctx.fillStyle = '#555555';
        this.rocks.forEach(rock => {
            ctx.beginPath();
            ctx.arc(rock.x, rock.y, rock.size / 2, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Ennemis sur la route
        this.enemies.forEach(enemy => {
            if (enemy.isAlive && enemy.spriteLoaded) {
                enemy.render(ctx);
            }
        });
        
        // Moto (vue du dessus - générée en pixel art rétro)
        this.renderBike(ctx);
        
        // Ligne d'arrivée (si on est proche de la fin - dernière seconde)
        if (this.raceTime >= this.raceDuration - 1) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('ARRIVÉE', this.canvas.width / 2, 100);
            
            // Ligne d'arrivée
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 5;
            ctx.setLineDash([20, 10]);
            ctx.beginPath();
            ctx.moveTo(this.roadX, 150);
            ctx.lineTo(this.roadX + this.roadWidth, 150);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Timer caché (ne pas afficher)
    }
    
    renderVictory(ctx) {
        // Fond semi-transparent
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Confettis (dessinés par-dessus le fond)
        this.confetti.forEach(confetti => {
            ctx.save();
            ctx.translate(confetti.x, confetti.y);
            ctx.rotate(confetti.rotation);
            ctx.fillStyle = confetti.color;
            ctx.fillRect(-confetti.size / 2, -confetti.size / 2, confetti.size, confetti.size);
            ctx.restore();
        });
        
        // Feux d'artifice (dessinés par-dessus le fond)
        this.fireworks.forEach(firework => {
            ctx.save();
            ctx.globalAlpha = firework.life;
            ctx.fillStyle = firework.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = firework.color;
            ctx.beginPath();
            ctx.arc(firework.x, firework.y, firework.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        
        // Fond opaque pour le message (au-dessus des effets mais légèrement transparent pour voir les effets)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Message de victoire (style dialogue rétro comme Pokémon)
        // Dimensions de la fenêtre de dialogue (même style que Phase2_Riddle)
        const dialogWidth = Math.min(800, Math.max(500, this.canvas.width * 0.75));
        const dialogHeight = Math.min(280, Math.max(150, this.canvas.height * 0.35));
        const dialogX = (this.canvas.width - dialogWidth) / 2;
        const dialogY = this.canvas.height * 0.15; // Plus haut sur l'écran (15% de la hauteur)
        
        // Fond noir opaque
        ctx.fillStyle = '#000000';
        ctx.fillRect(dialogX, dialogY, dialogWidth, dialogHeight);
        
        // Bordure blanche épaisse (style RPG, comme Phase2_Riddle)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(dialogX, dialogY, dialogWidth, dialogHeight);
        
        // Bordure intérieure fine (comme Phase2_Riddle)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(dialogX + 3, dialogY + 3, dialogWidth - 6, dialogHeight - 6);
        
        ctx.fillStyle = '#ffffff'; // Texte blanc
        ctx.font = 'bold 18px Arial'; // Police plus petite
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        const message = "Bravo ! Tu fais officiellement partie du gang des vrais mâles alphas. Chevaliers de l'ombre qui combattent pour conserver leur liberté et répandent leur toxicité, envers et contre tous !";
        const lines = this.wrapText(ctx, message, dialogWidth - 60);
        lines.forEach((line, i) => {
            ctx.fillText(line, dialogX + 20, dialogY + 20 + (i * 25));
        });
        
        // Bouton Quitter (juste sous la boîte de dialogue)
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonX = this.canvas.width / 2 - buttonWidth / 2;
        let buttonY = dialogY + dialogHeight + 30; // Juste sous la boîte de dialogue
        const pressOffset = this.buttonPressed ? 3 : 0;
        buttonY += pressOffset;
        
        ctx.fillStyle = this.buttonPressed ? '#222222' : '#333333';
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Quitter', this.canvas.width / 2, buttonY + buttonHeight / 2);
    }
    
    renderGameOver(ctx) {
        // Fond semi-transparent
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Texte "GAME OVER"
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 100);
        
        // Bouton Rejouer (même style que Phase1 et Phase2)
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonX = this.canvas.width / 2 - buttonWidth / 2;
        let buttonY = this.canvas.height / 2 + 50;
        const pressOffset = this.buttonPressed ? 3 : 0;
        buttonY += pressOffset;
        
        ctx.fillStyle = this.buttonPressed ? '#222222' : '#333333';
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Rejouer', this.canvas.width / 2, buttonY + buttonHeight / 2);
    }
    
    renderBike(ctx) {
        // Utiliser le sprite sheet généré
        if (this.bikeSpriteSheet) {
            // Désactiver l'anti-aliasing pour pixel art net
            ctx.imageSmoothingEnabled = false;
            
            // Calculer la position source dans le sprite sheet
            const sx = this.bikeCurrentFrame * this.BIKE_SPRITE_SIZE;
            const sy = 0;
            const sWidth = this.BIKE_SPRITE_SIZE;
            const sHeight = this.BIKE_SPRITE_SIZE;
            
            // Position de destination (centrée sur bikeX, bikeY)
            const dx = this.bikeX - this.bikeWidth / 2;
            const dy = this.bikeY - this.bikeHeight / 2;
            
            // Dessiner la frame appropriée du sprite sheet (pas de rotation, guidon vers le haut)
            ctx.drawImage(
                this.bikeSpriteSheet,
                sx, sy, sWidth, sHeight,  // Source : frame du sprite sheet
                dx, dy, this.bikeWidth, this.bikeHeight  // Destination : position et taille à l'écran
            );
            
            // Réactiver l'anti-aliasing pour le reste
            ctx.imageSmoothingEnabled = true;
        } else {
            // Fallback : rectangle simple si le sprite sheet n'est pas encore généré
            ctx.fillStyle = '#333333';
            ctx.fillRect(this.bikeX - this.bikeWidth / 2, this.bikeY - this.bikeHeight / 2, this.bikeWidth, this.bikeHeight);
        }
    }
    
    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }
}

