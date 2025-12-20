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
        this.insults = []; // Système d'insultes
        this.insultList = [
            "T'as vu tes bras ?!",
            "Et dis pas merci !",
            "Go kill yourself !",
            "Retourne chez toi si t'es pas content !",
            "Encore un a%@b# !!!",
            "T'es pas la chips la plus croustillante du paquet...",
            "Mais concentrez-vous bande de noobs !",
            "C'est toi le problème !",
            "Toi ta gueule !"
        ];
        this.waveStartTimer = 0; // Timer pour le compte à rebours de la vague
        this.waveStartDelay = 5; // 5 secondes d'attente
        this.enemyAttackCooldown = 0; // Cooldown global pour attaques des ennemis
        this.enemyAttackIndex = 0; // Index de l'ennemi qui attaque actuellement
        this._attackPressed = false;
        this._toxicityPressed = false;
        this.upgradeMenuActive = false;
        this.selectedUpgrade = null;
        this.gameOver = false; // État Game Over
        this.buttonPressed = false; // État du bouton Rejouer (pour l'animation)
        this.upgradeButtonPressed = { hp: false, toxicity: false }; // État des boutons d'amélioration

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

        // Démarrage du compte à rebours pour la première vague
        this.waveStartTimer = this.waveStartDelay;
        console.log('⏰ Démarrage du compte à rebours de la vague ennemie (5 secondes)');
        
        console.log('✅ Phase1_Roguelike initialisée complètement');
    }

    setupInput() {
        // Créer les handlers comme des fonctions fléchées pour garder le contexte
        this.keydownHandler = (e) => {
            // CRITIQUE : Empêcher la propagation pour éviter les doubles déclenchements
            if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter')) {
                e.preventDefault(); // Empêcher le comportement par défaut
                
                // CRITIQUE : Ne déclencher l'attaque QUE si _attackPressed est false
                // ET ne JAMAIS permettre une nouvelle attaque tant que la touche n'est pas relâchée
                if (!this._attackPressed) {
                    this._attackPressed = true; // ← Marquer IMMÉDIATEMENT
                    
                    if (this.player && !this.upgradeMenuActive && !this.player.isAttacking) {
                        console.log('🗡️ Attaque déclenchée depuis Phase1');
                        this.player.attack();
                    }
                }
                return; // Sortir immédiatement
            }

            if ((e.key === 'a' || e.key === 'A' || e.key === '!')) {
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

            if (e.key === 'a' || e.key === 'A' || e.key === '!') {
                this._toxicityPressed = false;
            }
        };

        // Ajouter les listeners
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
        
        // Listener pour les clics (pour le bouton Rejouer)
        this.clickHandler = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleClick(x, y);
        };
        this.canvas.addEventListener('click', this.clickHandler);
    }

    // Méthode pour nettoyer les listeners (important pour éviter les fuites mémoire)
    cleanup() {
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
        }
        if (this.keyupHandler) {
            document.removeEventListener('keyup', this.keyupHandler);
        }
        if (this.clickHandler) {
            this.canvas.removeEventListener('click', this.clickHandler);
        }
    }

    spawnWave() {
        if (this.currentWave >= this.waves.length) {
            this.allWavesComplete = true;
            return;
        }

        const wave = this.waves[this.currentWave];
        this.enemies = [];
        
        // Configuration des vagues :
        // Vague 1 : 3 ennemis avec 30 HP (STRONG)
        // Vague 2 : 3 ennemis avec 40 HP
        // Vague 3 : 4 ennemis avec 50 HP
        let waveType = 'STRONG'; // Par défaut
        let waveCount = 3;
        let customHp = null; // HP personnalisé si nécessaire
        
        if (this.currentWave === 0) {
            // Vague 1 : 3 ennemis avec 30 HP
            waveType = 'STRONG';
            waveCount = 3;
        } else if (this.currentWave === 1) {
            // Vague 2 : 3 ennemis avec 40 HP
            waveType = 'STRONG'; // On utilise STRONG comme base, mais on modifiera les HP
            waveCount = 3;
            customHp = 40;
        } else if (this.currentWave === 2) {
            // Vague 3 : 4 ennemis avec 50 HP
            waveType = 'STRONG'; // On utilise STRONG comme base, mais on modifiera les HP
            waveCount = 4;
            customHp = 50;
        } else {
            // Autres vagues : utiliser la configuration par défaut
            waveType = wave.type;
            waveCount = wave.count;
        }

        for (let i = 0; i < waveCount; i++) {
            const angle = (Math.PI * 2 * i) / waveCount;
            const distance = 300;
            const x = this.canvas.width / 2 + Math.cos(angle) * distance;
            const y = this.canvas.height / 2 + Math.sin(angle) * distance;

            const enemy = new Enemy(x, y, waveType, this.game);
            
            // Si un HP personnalisé est défini, l'appliquer
            if (customHp !== null) {
                enemy.hp = customHp;
                enemy.maxHp = customHp;
            }
            
            this.enemies.push(enemy);
        }
    }

    playerAttack(type) {
        if (!this.player || !this.player.isAttacking) return;

        const player = this.player;
        const damage = 10; // Coup d'épée = 10 dégâts
        // Portée de contact : moitié du joueur (80) + moitié de l'ennemi (24) = 104 pixels
        // Le joueur fait 160x160, les ennemis font 48x48
        const contactRange = (player.width / 2) + 48; // ~104 pixels

        // CRITIQUE : Vérifier STRICTEMENT que les dégâts n'ont pas déjà été appliqués
        if (player._damageApplied === true) {
            return; // ← AJOUT DE CETTE LIGNE
        }

        // CRITIQUE : Appliquer les dégâts UNE SEULE FOIS au début de l'attaque
        // On supprime toute vérification de frame pour éviter les appels multiples
        if (!player._damageApplied) {
            // Trouver l'ennemi le plus proche dans la portée
            let targetEnemy = null;
            let closestDistance = Infinity;
            
            this.enemies.forEach(enemy => {
                if (enemy.isAlive) {
                    // Calculer la distance au contact (considérer les hitboxes)
                    const playerCenterX = player.x + player.width / 2;
                    const playerCenterY = player.y + player.height / 2;
                    const enemyCenterX = enemy.x + enemy.width / 2;
                    const enemyCenterY = enemy.y + enemy.height / 2;
                    const dx = enemyCenterX - playerCenterX;
                    const dy = enemyCenterY - playerCenterY;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    // Attaque au corps à corps : doit être au contact
                    if (distance <= contactRange && distance < closestDistance) {
                        closestDistance = distance;
                        targetEnemy = enemy;
                    }
                }
            });
            
            // Appliquer les dégâts seulement à l'ennemi le plus proche
            if (targetEnemy) {
                targetEnemy.takeDamage(damage);
                this.attackFeedbacks.push({
                    text: `-${damage}`,
                    x: targetEnemy.x + targetEnemy.width / 2,
                    y: targetEnemy.y,
                    color: '#ff0000',
                    timer: 60
                });
            }
            
            // Marquer immédiatement pour éviter les doubles appels
            player._damageApplied = true;
        }
    }

    useToxicity() {
        if (this.player && this.player.useToxicity()) {
            const player = this.player;
            const damage = 30; // Insulte = 30 dégâts
            const range = 400; // Portée augmentée pour une attaque à distance
            
            // Choisir une insulte aléatoire
            const randomInsult = this.insultList[Math.floor(Math.random() * this.insultList.length)];
            
            // Trouver l'ennemi le plus proche pour orienter l'insulte
            // Utiliser les centres des hitboxes pour un calcul de distance précis
            let closestEnemy = null;
            let closestDistance = Infinity; // Utiliser Infinity pour trouver le plus proche même à la limite
            
            this.enemies.forEach(enemy => {
                if (enemy.isAlive) {
                    // Calculer la distance entre les centres des hitboxes
                    const playerCenterX = player.x + player.width / 2;
                    const playerCenterY = player.y + player.height / 2;
                    const enemyCenterX = enemy.x + enemy.width / 2;
                    const enemyCenterY = enemy.y + enemy.height / 2;
                    const dx = enemyCenterX - playerCenterX;
                    const dy = enemyCenterY - playerCenterY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance <= range && distance < closestDistance) {
                        closestDistance = distance;
                        closestEnemy = enemy;
                    }
                }
            });
            
            // Calculer la direction vers l'ennemi le plus proche (ou droite par défaut)
            let targetX = player.x + 100;
            let targetY = player.y;
            if (closestEnemy) {
                targetX = closestEnemy.x + closestEnemy.width / 2;
                targetY = closestEnemy.y + closestEnemy.height / 2;
            }
            
            // Créer l'insulte qui apparaît au-dessus du joueur
            this.insults.push({
                text: randomInsult,
                startX: player.x + player.width / 2,
                startY: player.y - 30,
                targetX: targetX,
                targetY: targetY,
                x: player.x + player.width / 2,
                y: player.y - 30,
                timer: 90, // Durée d'affichage
                progress: 0 // Progression vers la cible (0 à 1)
            });

            // Appliquer les dégâts à UN SEUL ennemi (le plus proche) à portée
            // Utiliser le même closestEnemy trouvé précédemment pour la cohérence
            if (closestEnemy) {
                closestEnemy.takeDamage(damage);
                this.attackFeedbacks.push({
                    text: `-${damage}`,
                    x: closestEnemy.x + closestEnemy.width / 2,
                    y: closestEnemy.y,
                    color: '#00ffff',
                    timer: 60
                });
            }
        }
    }

    upgradeStat(stat) {
        if (!this.upgradeMenuActive) return;

        const playerData = this.game.playerData;

        // Remettre la vie et la toxicité au maximum avant d'appliquer l'amélioration
        playerData.hp = playerData.maxHp;
        playerData.mana = playerData.maxMana;

        if (stat === 'hp') {
            // Augmenter les HP max de 10
            playerData.maxHp += 10;
            playerData.hp = playerData.maxHp; // Remettre au max après augmentation
            console.log('💚 +10 HP :', playerData.hp, '/', playerData.maxHp);
        } else if (stat === 'toxicity') {
            // Augmenter la toxicité max de 10
            playerData.maxMana += 10;
            playerData.mana = playerData.maxMana; // Remettre au max après augmentation
            console.log('💜 +10 Toxicité :', playerData.mana, '/', playerData.maxMana);
        }

        // CRITIQUE : Synchroniser les valeurs dans l'instance Player
        if (this.player) {
            this.player.mana = playerData.mana;
            this.player.maxMana = playerData.maxMana;
        }

        // Fermer le menu et passer à la vague suivante
        this.upgradeMenuActive = false;
        this.upgradeButtonPressed = { hp: false, toxicity: false };
        // Réinitialiser les flags de touches pour éviter qu'ils restent bloqués
        this._toxicityPressed = false;
        this._attackPressed = false;
        this.currentWave++;
        
        // Si on vient de terminer la vague 3, passer à la phase suivante (énigme)
        if (this.currentWave >= this.waves.length) {
            console.log('🎉 Toutes les vagues terminées, passage à la phase énigme');
            setTimeout(() => {
                this.game.nextPhase();
            }, 500);
            return;
        }
        
        // Sinon, démarrer le décompte pour la prochaine vague
        this.waveStartTimer = this.waveStartDelay;
        console.log('⏰ Démarrage du décompte pour la vague', this.currentWave + 1);
    }

    update(deltaTime, keys) {
        // Log une seule fois pour confirmer que update est appelé
        if (!this._updateLogged) {
            console.log('🔄 Phase1_Roguelike.update() appelé - player:', this.player ? 'existe' : 'null');
            this._updateLogged = true;
        }
        
        // Si Game Over, ne pas mettre à jour le jeu
        if (this.gameOver) {
            return;
        }
        
        // Ne pas mettre à jour le décompte si le menu d'amélioration est actif
        if (!this.upgradeMenuActive) {
            // Gérer le compte à rebours de la vague
            if (this.waveStartTimer > 0) {
                this.waveStartTimer -= deltaTime;
                if (this.waveStartTimer <= 0) {
                    // Lancer la vague
                    this.spawnWave();
                    this.waveStartTimer = 0;
                }
            }
        }
        
        // Pas de menu d'amélioration pour le moment
        // if (this.upgradeMenuActive) return;

        // Mise à jour du joueur
        if (this.player) {
            this.player.update(keys, deltaTime);
            
            // Gérer l'attaque du joueur
            if (this.player.isAttacking) {
                this.playerAttack('strength');
            }
        } else {
            console.warn('⚠️ Phase1_Roguelike: player is null');
        }

        // Mise à jour des ennemis (déplacement vers le joueur)
        // D'abord, calculer les nouvelles positions
        this.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                enemy.update(deltaTime);
            }
        });
        
        // Ensuite, résoudre les collisions entre ennemis pour éviter qu'ils fusionnent
        for (let i = 0; i < this.enemies.length; i++) {
            if (!this.enemies[i].isAlive) continue;
            
            for (let j = i + 1; j < this.enemies.length; j++) {
                if (!this.enemies[j].isAlive) continue;
                
                const enemy1 = this.enemies[i];
                const enemy2 = this.enemies[j];
                
                // Si les ennemis se chevauchent, les séparer
                if (enemy1.overlapsWith(enemy2)) {
                    const dx = enemy2.x - enemy1.x;
                    const dy = enemy2.y - enemy1.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                    
                    // Distance minimale pour éviter le chevauchement (somme des rayons)
                    const minDistance = (enemy1.width + enemy2.width) / 2;
                    const overlap = minDistance - distance;
                    
                    if (overlap > 0) {
                        // Séparer les ennemis
                        const separationX = (dx / distance) * overlap * 0.5;
                        const separationY = (dy / distance) * overlap * 0.5;
                        
                        // Déplacer les ennemis en sens opposés
                        enemy1.x -= separationX;
                        enemy1.y -= separationY;
                        enemy2.x += separationX;
                        enemy2.y += separationY;
                        
                        // Réappliquer les limites après séparation
                        const canvas = this.canvas;
                        const visibleHeight = Math.floor(canvas.height * 0.70);
                        const maxY = visibleHeight - enemy1.height;
                        
                        enemy1.x = Math.max(0, Math.min(canvas.width - enemy1.width, enemy1.x));
                        enemy1.y = Math.max(0, Math.min(maxY, enemy1.y));
                        
                        enemy2.x = Math.max(0, Math.min(canvas.width - enemy2.width, enemy2.x));
                        enemy2.y = Math.max(0, Math.min(maxY, enemy2.y));
                    }
                }
            }
        }
        
        // Attaque des ennemis (tour à tour, pas tous en même temps)
        if (this.enemies.length > 0 && this.waveStartTimer <= 0) {
            this.enemyAttackCooldown -= deltaTime;
            if (this.enemyAttackCooldown <= 0) {
                // Trouver le prochain ennemi vivant qui peut attaquer
                const aliveEnemies = this.enemies.filter(e => e.isAlive);
                if (aliveEnemies.length > 0) {
                    const attackingEnemy = aliveEnemies[this.enemyAttackIndex % aliveEnemies.length];
                    
                    // Vérifier si l'ennemi est au contact du joueur
                    if (this.player && this.player.isAlive) {
                        // Calculer la distance entre les centres des hitboxes
                        const playerCenterX = this.player.x + this.player.width / 2;
                        const playerCenterY = this.player.y + this.player.height / 2;
                        const enemyCenterX = attackingEnemy.x + attackingEnemy.width / 2;
                        const enemyCenterY = attackingEnemy.y + attackingEnemy.height / 2;
                        const dx = playerCenterX - enemyCenterX;
                        const dy = playerCenterY - enemyCenterY;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        // Distance de contact : lorsque les hitboxes se touchent (moitié de chaque côté)
                        // Joueur: 160x160, Ennemi: 64x64
                        const contactDistance = (this.player.width / 2 + attackingEnemy.width / 2) * 0.9;
                        if (distance < contactDistance) {
                            attackingEnemy.attack(this.player);
                        }
                    }
                    
                    // Passer au prochain ennemi et ajouter un cooldown
                    this.enemyAttackIndex = (this.enemyAttackIndex + 1) % aliveEnemies.length;
                    this.enemyAttackCooldown = 1.5; // 1.5 seconde entre chaque attaque d'ennemi
                }
            }
        }

        // Nettoyage des ennemis morts
        this.enemies = this.enemies.filter(e => e.isAlive);

        // Vérifier si le joueur est mort
        if (this.player && !this.player.isAlive && !this.gameOver) {
            this.gameOver = true;
            console.log('💀 Game Over - Le joueur est mort');
        }

        // Vérifier si tous les ennemis sont morts et afficher le menu d'amélioration
        if (this.enemies.length === 0 && !this.allWavesComplete && this.currentWave < this.waves.length && !this.upgradeMenuActive && this.waveStartTimer <= 0) {
            // Tous les ennemis sont morts, activer le menu d'amélioration
            this.upgradeMenuActive = true;
            console.log('✅ Tous les ennemis sont morts, affichage du menu d\'amélioration');
        }

        // Pas de passage à la phase suivante pour le moment
        // if (this.enemies.length === 0 && this.allWavesComplete) {
        //     setTimeout(() => {
        //         this.game.nextPhase();
        //     }, 1000);
        // }

        // Mise à jour des feedbacks d'attaque
        this.attackFeedbacks = this.attackFeedbacks.filter(feedback => {
            feedback.timer--;
            feedback.y -= 1;
            return feedback.timer > 0;
        });
        
        // Mise à jour des insultes (se déplacent vers la cible)
        this.insults = this.insults.filter(insult => {
            insult.timer--;
            insult.progress = Math.min(1, insult.progress + 0.02); // Avance vers la cible
            
            // Interpolation entre la position de départ et la cible
            const dx = insult.targetX - insult.startX;
            const dy = insult.targetY - insult.startY;
            insult.x = insult.startX + dx * insult.progress;
            insult.y = insult.startY + dy * insult.progress;
            
            return insult.timer > 0;
        });

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

        // 2. Ennemis
        this.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                enemy.render(ctx);
            }
        });

        // 2.5. Message de prévention de vague (compte à rebours)
        if (this.waveStartTimer > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const countdown = Math.ceil(this.waveStartTimer);
            ctx.fillText(`Vague d'ennemis en approche`, this.canvas.width / 2, this.canvas.height / 2 - 40);
            ctx.fillText(`${countdown}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        }
        
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

        // 4. Feedbacks de dégâts
        this.attackFeedbacks.forEach(feedback => {
            ctx.fillStyle = feedback.color;
            ctx.font = '16px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(feedback.text, feedback.x, feedback.y);
        });
        
        // 5. Insultes (affichées au-dessus du joueur, direction ennemis)
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.insults.forEach(insult => {
            // Ombre du texte pour la lisibilité
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillText(insult.text, insult.x + 2, insult.y + 2);
            
            // Texte principal (jaune/orange pour les insultes, plus gros et épais)
            ctx.fillStyle = '#ffaa00';
            ctx.fillText(insult.text, insult.x, insult.y);
        });

        // 6. Menu d'amélioration (dessiné avant Game Over)
        if (this.upgradeMenuActive) {
            // Fond semi-transparent
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Titre
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Choisissez votre amélioration', this.canvas.width / 2, this.canvas.height / 2 - 120);
            
            // Dimensions des boutons
            const buttonWidth = 250;
            const buttonHeight = 60;
            const buttonSpacing = 30;
            const totalWidth = (buttonWidth * 2) + buttonSpacing;
            const startX = this.canvas.width / 2 - totalWidth / 2;
            const buttonY = this.canvas.height / 2 + 20;
            
            // Bouton +10 HP
            const hpButtonX = startX;
            const hpPressOffset = this.upgradeButtonPressed.hp ? 3 : 0;
            ctx.fillStyle = this.upgradeButtonPressed.hp ? '#228822' : '#33aa33';
            ctx.fillRect(hpButtonX, buttonY + hpPressOffset, buttonWidth, buttonHeight);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(hpButtonX, buttonY + hpPressOffset, buttonWidth, buttonHeight);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('+10 Santé', hpButtonX + buttonWidth / 2, buttonY + hpPressOffset + buttonHeight / 2);
            
            // Bouton +10 Toxicité
            const toxicityButtonX = startX + buttonWidth + buttonSpacing;
            const toxicityPressOffset = this.upgradeButtonPressed.toxicity ? 3 : 0;
            ctx.fillStyle = this.upgradeButtonPressed.toxicity ? '#882288' : '#aa33aa';
            ctx.fillRect(toxicityButtonX, buttonY + toxicityPressOffset, buttonWidth, buttonHeight);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(toxicityButtonX, buttonY + toxicityPressOffset, buttonWidth, buttonHeight);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('+10 Toxicité', toxicityButtonX + buttonWidth / 2, buttonY + toxicityPressOffset + buttonHeight / 2);
        }
        
        // 7. Écran Game Over (dessiné en dernier pour être au-dessus de tout)
        if (this.gameOver) {
            // Fond semi-transparent
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Texte "GAME OVER"
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 64px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 100);
            
            // Zone pour le bouton "Rejouer"
            const buttonWidth = 200;
            const buttonHeight = 50;
            const buttonX = this.canvas.width / 2 - buttonWidth / 2;
            let buttonY = this.canvas.height / 2 + 50;
            const pressOffset = this.buttonPressed ? 3 : 0; // Décalage quand enfoncé
            
            // Ajuster la position si le bouton est pressé
            buttonY += pressOffset;
            
            // Fond du bouton (plus sombre si pressé)
            ctx.fillStyle = this.buttonPressed ? '#222222' : '#333333';
            ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
            
            // Bordure du bouton
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
            
            // Texte du bouton (centré verticalement et horizontalement)
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Rejouer', this.canvas.width / 2, buttonY + buttonHeight / 2);
        }
        } finally {
            // TOUJOURS remettre à false
            this._isCurrentlyRendering = false;
        }
    }
    
    // Méthode pour relancer la partie (depuis le début de la vague)
    restartWave() {
        console.log('🔄 Relance de la vague');
        
        // Réinitialiser l'état Game Over et le bouton
        this.gameOver = false;
        this.buttonPressed = false;
        this.upgradeMenuActive = false;
        this.upgradeButtonPressed = { hp: false, toxicity: false };
        
        // Réinitialiser les données du joueur
        this.game.playerData.hp = PLAYER_CONFIG.INITIAL_HP;
        this.game.playerData.maxHp = PLAYER_CONFIG.INITIAL_HP;
        this.game.playerData.mana = PLAYER_CONFIG.INITIAL_MANA;
        this.game.playerData.maxMana = PLAYER_CONFIG.INITIAL_MANA;
        
        // Réinitialiser la vague actuelle
        this.currentWave = 0;
        this.enemies = [];
        this.attackFeedbacks = [];
        this.insults = [];
        
        // Repositionner le joueur
        const width = this.canvas.width;
        const height = this.canvas.height;
        if (this.player) {
            this.player.x = width / 2 - 80;
            this.player.y = height / 2 - 150;
            this.player.isAlive = true;
        }
        
        // Redémarrer le compte à rebours de la vague
        this.waveStartTimer = this.waveStartDelay;
    }
    
    // Méthode pour gérer les clics (pour le bouton Rejouer et les boutons d'amélioration)
    handleClick(x, y) {
        // Gérer les clics sur les boutons d'amélioration
        if (this.upgradeMenuActive) {
            const buttonWidth = 250;
            const buttonHeight = 60;
            const buttonSpacing = 30;
            const totalWidth = (buttonWidth * 2) + buttonSpacing;
            const startX = this.canvas.width / 2 - totalWidth / 2;
            const buttonY = this.canvas.height / 2 + 20;
            
            // Bouton +10 HP
            const hpButtonX = startX;
            if (x >= hpButtonX && x <= hpButtonX + buttonWidth && 
                y >= buttonY && y <= buttonY + buttonHeight) {
                this.upgradeButtonPressed.hp = true;
                setTimeout(() => {
                    this.upgradeButtonPressed.hp = false;
                    this.upgradeStat('hp');
                }, 150);
                return;
            }
            
            // Bouton +10 Toxicité
            const toxicityButtonX = startX + buttonWidth + buttonSpacing;
            if (x >= toxicityButtonX && x <= toxicityButtonX + buttonWidth && 
                y >= buttonY && y <= buttonY + buttonHeight) {
                this.upgradeButtonPressed.toxicity = true;
                setTimeout(() => {
                    this.upgradeButtonPressed.toxicity = false;
                    this.upgradeStat('toxicity');
                }, 150);
                return;
            }
        }
        
        // Gérer les clics sur le bouton Rejouer (Game Over)
        if (!this.gameOver) return;
        
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonX = this.canvas.width / 2 - buttonWidth / 2;
        const buttonY = this.canvas.height / 2 + 50;
        
        // Vérifier si le clic est sur le bouton
        if (x >= buttonX && x <= buttonX + buttonWidth && 
            y >= buttonY && y <= buttonY + buttonHeight) {
            // Animation d'enfoncement
            this.buttonPressed = true;
            
            // Attendre un peu pour l'effet visuel, puis relancer
            setTimeout(() => {
                this.buttonPressed = false;
                this.restartWave();
            }, 150); // 150ms d'animation
        }
    }
}

