class Phase2_Riddle {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        this.ctx = game.ctx;
        this.player = null;
        this.npc = null;
        
        // État de transition
        this.transitionActive = true;
        this.transitionText = "Après une bien trop longue marche...";
        this.waitingForInput = false;
        this.transitionComplete = false;
        this.transitionArrowBlinkTimer = 0;
        
        // État de dialogue
        this.dialogueActive = false;
        this.dialogueIndex = 0;
        this.dialogueLines = [
            "Meuh ! Tremble devant le terrible gardien du terrible donjon de la terrible Amar !",
            "*ton soudainement enjouée* Tu veux bien jouer avec moi :) ?",
            "Je te propose un deal : réponds correctement à ma devinette et je te laisse franchir les portes du donjon (*marmonne* de toute façon Amar ne me paye pas assez pour ces conneries...)",
            "Si tu te trompes, tu devras te retourner, te défroquer, te pencher et *rire sardonique*"
        ];
        this.dialogueArrowBlinkTimer = 0;
        this.dialogueCooldown = 0.3;
        this.waitingForDialogueInput = false;
        
        // État de l'énigme
        this.riddleState = 'dialogue'; // 'dialogue' | 'riddle' | 'result'
        this.riddleLines = [
            "Je me hisse chaque matin,",
            "Ou branlé par une main,",
            "Fièrement droit et large, jamais chagrin,",
            "Sauf lorsque je projette mon crachin.",
            "Qui suis-je ?"
        ];
        this.answerChoices = [
            "Ta mère la catin",
            "Justin",
            "Damien"
        ];
        this.selectedAnswerIndex = 0; // Index du choix sélectionné (0, 1, 2)
        this.correctAnswerIndex = 1; // Justin est la bonne réponse
        this.answerResult = null; // 'correct' | 'incorrect'
        this.resultText = ''; // Texte du résultat
        
        // État Game Over
        this.gameOver = false;
        this.gameOverText = "BWAHAHAHAHA ! Retour à la case départ sale nigaud !";
        this.buttonPressed = false;
        
        // État transition vers boss (écran noir)
        this.bossTransitionActive = false;
        this.bossTransitionTimer = 0;
        
        // Décor - Château imposant comme un donjon
        this.castleX = this.canvas.width / 2 - 200; // Centre du château (agrandi)
        this.castleY = 20; // En haut de l'écran
        this.castleWidth = 400; // Plus large et imposant
        this.castleHeight = 280; // Plus haut, comme un donjon
        
        // Input handlers
        this.keydownHandler = null;
        this.keyupHandler = null;
        this.clickHandler = null;
        this._interactPressed = false; // Flag pour éviter les déclenchements multiples
    }
    
    async init() {
        console.log('🎮 Phase2_Riddle.init() appelé');
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Initialiser le PNJ (sheepman) en bas du château, accessible
        // Positionner le NPC en bas du château pour qu'il soit accessible
        const npcX = this.castleX + this.castleWidth / 2 - 30; // Centré devant les portes
        const npcY = this.castleY + this.castleHeight + 30; // En bas du château, accessible
        
        // Initialiser le joueur à côté du NPC (à gauche du NPC, pas loin)
        // Positionner le joueur à gauche du NPC pour qu'il soit visible et accessible
        const playerX = npcX - 150; // À gauche du NPC
        const playerY = npcY; // Même hauteur que le NPC
        this.player = new Player(playerX, playerY, this.game);
        console.log('✅ Joueur créé à la position:', this.player.x, this.player.y);
        
        // Créer le NPC et empêcher immédiatement le chargement du sprite par défaut
        this.npc = new NPC(npcX, npcY, this.game);
        // CRITIQUE : Empêcher le chargement du sprite par défaut AVANT qu'il ne commence
        this.npc._loading = true;
        this.npc.spriteLoaded = false;
        // Annuler le spriteSheet par défaut s'il a été créé
        this.npc.spriteSheet = null;
        // Définir la taille pour le sheepman (48x64)
        this.npc.width = 96; // 48 * 2
        this.npc.height = 128; // 64 * 2
        console.log('✅ NPC créé à la position:', npcX, npcY);
        // Charger le sprite du sheepman
        await this.loadSheepmanSprite();
        
        // Démarrer la transition
        this.transitionActive = true;
        this.waitingForInput = false;
        this.transitionComplete = false;
        
        this.setupInput();
        
        console.log('✅ Phase2_Riddle initialisée complètement');
    }
    
    async loadSheepmanSprite() {
        return new Promise((resolve, reject) => {
            // CRITIQUE : Empêcher complètement le chargement du sprite par défaut
            // Annuler toute tentative de chargement du sprite par défaut
            this.npc._loading = true;
            this.npc.spriteLoaded = false;
            this.npc.spriteSheet = null;
            this.npc.animations = {};
            this.npc.currentAnimation = null;
            
            const img = new Image();
            img.onload = () => {
                if (img.complete && img.naturalWidth > 0) {
                    console.log('✅ Image sheepman chargée:', img.width, 'x', img.height);
                    
                    // Le sprite sheepman est en 48x64 pixels
                    // 12 frames (3 par direction N/E/S/W)
                    this.npc.spriteSheet = new SpriteSheet(img, 48, 64);
                    this.npc.spriteSheet.framesPerRow = Math.floor(img.width / 48);
                    
                    // Configuration des animations pour le sheepman
                    // 12 frames: 3 frames par direction (N/E/S/W)
                    // Frame 0-2: North (haut)
                    // Frame 3-5: East (droite)
                    // Frame 6-8: South (bas) - direction par défaut
                    // Frame 9-11: West (gauche)
                    // Utiliser la première frame de la direction sud (face au joueur) pour idle
                    this.npc.animations = {
                        idle: new Animation(this.npc.spriteSheet, [6], 1, true) // Frame 6 = South, frame 0
                        // Pourrait ajouter walk plus tard avec [6, 7, 8] si nécessaire
                    };
                    
                    this.npc.currentAnimation = this.npc.animations.idle;
                    this.npc.currentAnimation.play();
                    
                    this.npc.spriteLoaded = true;
                    this.npc._loading = false;
                    console.log('✅ Sprite sheepman chargé et configuré');
                    resolve();
                }
            };
            img.onerror = () => {
                console.error('❌ Erreur chargement sprite sheepman');
                this.npc._loading = false;
                reject();
            };
            img.src = 'assets/images/sprites/npc/PNG/48x64/sheepman.png';
        });
    }
    
    setupInput() {
        this.keydownHandler = (e) => {
            // Bloquer l'insulte/sort (touches a ou !) dans Phase2_Riddle
            // Utiliser stopPropagation() pour empêcher que d'autres handlers ne soient appelés
            if (e.key === 'a' || e.key === 'A' || e.key === '!') {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                // S'assurer que les touches ne sont pas enregistrées dans le système global
                if (this.game && this.game.keys) {
                    this.game.keys[e.key] = false;
                }
                return; // Bloquer complètement l'insulte dans cette phase
            }
            
            // Gérer la transition
            if (this.transitionActive && !this.transitionComplete && this.waitingForInput) {
                if (e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                    this.transitionComplete = true;
                    this.transitionActive = false;
                    this.waitingForInput = false;
                    console.log('✅ Transition complétée');
                }
                return;
            }
            
            // Gérer le dialogue (avant l'énigme)
            if (this.dialogueActive && this.riddleState === 'dialogue' && this.waitingForDialogueInput) {
                if ((e.key === 'Enter' || e.key === 'e' || e.key === 'E') && !this._interactPressed) {
                    e.preventDefault();
                    this._interactPressed = true;
                    this.dialogueCooldown = 0.3;
                    this.waitingForDialogueInput = false;
                    
                    // Passer au dialogue suivant
                    this.dialogueIndex++;
                    if (this.dialogueIndex >= this.dialogueLines.length) {
                        // Dialogue terminé, passer à l'énigme
                        this.riddleState = 'riddle';
                        this.selectedAnswerIndex = 0;
                        console.log('✅ Dialogue terminé, passage à l\'énigme');
                        // Réinitialiser le cooldown pour afficher immédiatement l'énigme
                        this.dialogueCooldown = 0;
                        this.waitingForDialogueInput = false;
                    }
                }
                return;
            }
            
            // Gérer la sélection de réponse dans l'énigme
            if (this.dialogueActive && this.riddleState === 'riddle') {
                if (e.key === 'ArrowUp' || e.key === 'z' || e.key === 'Z') {
                    e.preventDefault();
                    // Déplacer la sélection vers le haut
                    this.selectedAnswerIndex = (this.selectedAnswerIndex - 1 + this.answerChoices.length) % this.answerChoices.length;
                } else if (e.key === 'ArrowDown' || e.key === 'w' || e.key === 'W') {
                    e.preventDefault();
                    // Déplacer la sélection vers le bas
                    this.selectedAnswerIndex = (this.selectedAnswerIndex + 1) % this.answerChoices.length;
                } else if ((e.key === 'Enter' || e.key === 'e' || e.key === 'E') && !this._interactPressed) {
                    e.preventDefault();
                    this._interactPressed = true;
                    // Valider la réponse
                    this.checkAnswer();
                }
                return;
            }
            
            // Gérer le résultat (après la réponse)
            if (this.dialogueActive && this.riddleState === 'result' && this.waitingForDialogueInput) {
                if ((e.key === 'Enter' || e.key === 'e' || e.key === 'E') && !this._interactPressed) {
                    e.preventDefault();
                    this._interactPressed = true;
                    
                    if (this.answerResult === 'correct') {
                        // Réponse correcte : afficher écran noir puis passer à la phase boss
                        console.log('✅ Réponse correcte, transition vers phase boss');
                        this.dialogueActive = false;
                        this.bossTransitionActive = true;
                        this.bossTransitionTimer = 0;
                    } else {
                        // Réponse incorrecte : Game Over
                        console.log('❌ Réponse incorrecte, Game Over');
                        this.dialogueActive = false;
                        this.gameOver = true;
                    }
                }
                return;
            }
            
            // Vérifier si le joueur veut interagir avec le NPC
            if (!this.dialogueActive && !this.transitionActive && (e.key === 'Enter' || e.key === 'e' || e.key === 'E') && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                if (this.isPlayerNearNPC()) {
                    this.dialogueActive = true;
                    this.dialogueIndex = 0;
                    this.dialogueCooldown = 0.3;
                    this.waitingForDialogueInput = false;
                    console.log('💬 Début du dialogue avec le vieil homme');
                }
            }
            
            // Les autres inputs sont gérés par le système de clés global
        };
        
        this.keyupHandler = (e) => {
            // Bloquer aussi dans keyup pour éviter tout problème
            if (e.key === 'a' || e.key === 'A' || e.key === '!') {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            
            // Réinitialiser le flag quand la touche est relâchée
            if (e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
                this._interactPressed = false;
            }
        };
        
        // Ajouter les listeners avec capture phase pour être sûr d'intercepter avant les autres
        document.addEventListener('keydown', this.keydownHandler, true);
        document.addEventListener('keyup', this.keyupHandler, true);
        
        // Gestion des clics pour le bouton Rejouer
        this.clickHandler = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleClick(x, y);
        };
        this.canvas.addEventListener('click', this.clickHandler);
    }
    
    handleClick(x, y) {
        // Gérer le clic sur le bouton "Rejouer" si Game Over
        if (this.gameOver) {
            const buttonWidth = 200;
            const buttonHeight = 60;
            const buttonX = (this.canvas.width - buttonWidth) / 2;
            const buttonY = this.canvas.height / 2 + 50;
            
            if (x >= buttonX && x <= buttonX + buttonWidth &&
                y >= buttonY && y <= buttonY + buttonHeight) {
                // Clic sur le bouton Rejouer
                this.buttonPressed = true;
                
                // Retourner à Phase1_Roguelike (vague 1)
                setTimeout(() => {
                    this.buttonPressed = false;
                    console.log('🔄 Retour à Phase1_Roguelike (vague 1)');
                    // Nettoyer Phase2
                    this.cleanup();
                    // Réinitialiser l'index de phase pour revenir à Phase1
                    this.game.phaseIndex = 1; // Phase1 est à l'index 1 (Phase0 est à 0)
                    this.game.currentPhase = this.game.phases[1];
                    // Réinitialiser la phase
                    this.game.currentPhase.init().then(() => {
                        // Appeler restartWave après l'initialisation
                        if (this.game.currentPhase.restartWave) {
                            this.game.currentPhase.restartWave();
                        }
                        console.log('✅ Phase1 réinitialisée avec succès');
                    });
                }, 150);
            }
        }
    }
    
    // Vérifier si le joueur est au contact du NPC
    isPlayerNearNPC() {
        if (!this.player || !this.npc) return false;
        
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        const npcCenterX = this.npc.x + this.npc.width / 2;
        const npcCenterY = this.npc.y + this.npc.height / 2;
        
        const dx = playerCenterX - npcCenterX;
        const dy = playerCenterY - npcCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Distance de contact : 80 pixels (distance raisonnable pour parler)
        return distance < 80;
    }
    
    checkAnswer() {
        if (this.selectedAnswerIndex === this.correctAnswerIndex) {
            // Réponse correcte
            this.answerResult = 'correct';
            this.riddleState = 'result';
            this.resultText = "Zut, moi qui voulait t'enc... Heu bonne chance face à Amar ! Meuh !";
            this.waitingForDialogueInput = false;
            this.dialogueCooldown = 0.3;
            console.log('✅ Réponse correcte !');
        } else {
            // Réponse incorrecte
            this.answerResult = 'incorrect';
            this.riddleState = 'result';
            this.waitingForDialogueInput = false;
            this.dialogueCooldown = 0.3;
            console.log('❌ Réponse incorrecte !');
        }
    }
    
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
    
    // Vérifier si une position est dans le château (collision)
    isInCastle(x, y, width, height) {
        return x < this.castleX + this.castleWidth &&
               x + width > this.castleX &&
               y < this.castleY + this.castleHeight &&
               y + height > this.castleY;
    }
    
    // Vérifier si une position entre en collision avec le NPC
    isCollidingWithNPC(x, y, width, height) {
        if (!this.npc) return false;
        return x < this.npc.x + this.npc.width &&
               x + width > this.npc.x &&
               y < this.npc.y + this.npc.height &&
               y + height > this.npc.y;
    }
    
    update(deltaTime, keys) {
        // BLOQUER L'INSULTE : Forcer les touches a et ! à false dans le système global
        // Cela empêche toute utilisation de l'insulte même si elle était déjà enregistrée
        if (this.game && this.game.keys) {
            this.game.keys['a'] = false;
            this.game.keys['A'] = false;
            this.game.keys['!'] = false;
        }
        
        // Gérer la transition
        if (this.transitionActive && !this.transitionComplete) {
            this.transitionArrowBlinkTimer += deltaTime;
            // Activer l'attente d'input après un court délai
            if (!this.waitingForInput) {
                this.waitingForInput = true;
            }
            return;
        }
        
        // Gérer le Game Over
        if (this.gameOver) {
            // Ne rien faire, on attend le clic sur le bouton "Rejouer"
            return;
        }
        
        // Gérer le dialogue
        if (this.dialogueActive) {
            this.dialogueArrowBlinkTimer += deltaTime;
            
            // Activer l'attente d'input seulement pour le dialogue et le résultat (pas pour l'énigme)
            if (this.riddleState === 'dialogue' || this.riddleState === 'result') {
                this.dialogueCooldown -= deltaTime;
                if (this.dialogueCooldown <= 0) {
                    this.waitingForDialogueInput = true;
                }
            }
            
            // Mettre à jour les animations pendant le dialogue
            if (this.player && this.player.currentAnimation) {
                this.player.currentAnimation.update(deltaTime);
            }
            if (this.npc && this.npc.currentAnimation) {
                this.npc.currentAnimation.update(deltaTime);
            }
            return; // Ne pas mettre à jour le mouvement pendant le dialogue
        }
        
        // Mise à jour du joueur
        if (this.player) {
            // Sauvegarder la position avant déplacement
            const oldX = this.player.x;
            const oldY = this.player.y;
            
            // Calculer le mouvement manuellement pour éviter les limites restrictives de Player.update()
            // Player.update() limite à 70% de la hauteur, mais dans Phase2 on veut utiliser toute la hauteur
            const speedPerSecond = this.player.speed * 60;
            let newX = this.player.x;
            let newY = this.player.y;
            let isMoving = false;
            
            // Calculer le mouvement selon les touches
            if (keys['ArrowUp'] || keys['z'] || keys['Z']) {
                newY -= speedPerSecond * deltaTime;
                this.player.direction = 'up';
                isMoving = true;
            }
            if (keys['ArrowDown'] || keys['w'] || keys['W']) {
                newY += speedPerSecond * deltaTime;
                this.player.direction = 'down';
                isMoving = true;
            }
            if (keys['ArrowRight'] || keys['s'] || keys['S']) {
                newX += speedPerSecond * deltaTime;
                this.player.direction = 'right';
                isMoving = true;
            }
            if (keys['ArrowLeft'] || keys['q'] || keys['Q']) {
                newX -= speedPerSecond * deltaTime;
                this.player.direction = 'left';
                isMoving = true;
            }
            
            this.player.isMoving = isMoving;
            
            // Appliquer les limites de l'écran (toute la hauteur pour Phase2)
            newX = Math.max(0, Math.min(this.canvas.width - this.player.width, newX));
            newY = Math.max(0, Math.min(this.canvas.height - this.player.height, newY));
            
            // Aucune collision - le joueur peut se déplacer librement partout
            this.player.x = newX;
            this.player.y = newY;
            
            // Mettre à jour les animations du joueur (sans mouvement)
            // On doit mettre à jour manuellement les animations car Player.update() gère aussi le mouvement
            if (this.player.currentAnimation) {
                this.player.currentAnimation.update(deltaTime);
            }
            
            // Sélection de l'animation selon l'état
            if (!this.player.isAlive) {
                if (this.player.animations.dead) {
                    this.player.switchAnimation(this.player.animations.dead);
                }
            } else if (this.player.isBlocking) {
                if (this.player.animations.block) {
                    this.player.switchAnimation(this.player.animations.block);
                }
            } else if (this.player.isMoving) {
                if (this.player.animations.run) {
                    this.player.switchAnimation(this.player.animations.run);
                }
            } else {
                if (this.player.animations.idle) {
                    this.player.switchAnimation(this.player.animations.idle);
                }
            }
        }
        
        // Mise à jour du PNJ (sheepman)
        if (this.npc) {
            this.npc.update(deltaTime);
        }
    }
    
    render(ctx) {
        // Si en transition, afficher l'écran noir avec le texte
        if (this.transitionActive && !this.transitionComplete) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.transitionText, this.canvas.width / 2, this.canvas.height / 2 - 20);
            
            // Flèche clignotante vers le bas
            if (this.waitingForInput) {
                const arrowVisible = Math.floor(this.transitionArrowBlinkTimer * 2) % 2 === 0;
                if (arrowVisible) {
                    ctx.fillStyle = '#ffffff';
                    const arrowX = this.canvas.width / 2;
                    const arrowY = this.canvas.height / 2 + 30;
                    ctx.beginPath();
                    ctx.moveTo(arrowX, arrowY);
                    ctx.lineTo(arrowX - 8, arrowY - 8);
                    ctx.lineTo(arrowX + 8, arrowY - 8);
                    ctx.closePath();
                    ctx.fill();
                }
            }
            
            return;
        }
        
        // ========== TRANSITION VERS BOSS (écran noir) ==========
        if (this.bossTransitionActive) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }
        
        // Nettoyer le canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Désactiver l'anti-aliasing pour pixel art
        ctx.imageSmoothingEnabled = false;
        
        // ========== DÉCOR : SOL EN DAMIER (forêt) ==========
        const green1 = '#90EE90'; // Vert clair
        const green2 = '#32CD32'; // Vert moyen
        const tileSize = 32;
        
        for (let x = 0; x < this.canvas.width; x += tileSize) {
            for (let y = 0; y < this.canvas.height; y += tileSize) {
                const tileX = Math.floor(x / tileSize);
                const tileY = Math.floor(y / tileSize);
                ctx.fillStyle = (tileX + tileY) % 2 === 0 ? green1 : green2;
                ctx.fillRect(x, y, tileSize, tileSize);
            }
        }
        
        // ========== ARBRES ==========
        const drawSimpleTree = (x, y) => {
            // Tronc marron
            ctx.fillStyle = '#8B4513';
            const trunkWidth = 40;
            const trunkHeight = 80;
            ctx.fillRect(x - trunkWidth/2, y - trunkHeight, trunkWidth, trunkHeight);
            
            // Feuillage vert
            ctx.fillStyle = '#006400';
            ctx.fillRect(x - 40, y - trunkHeight - 40, 80, 40);
            ctx.fillRect(x - 30, y - trunkHeight - 80, 60, 40);
            ctx.fillRect(x - 20, y - trunkHeight - 110, 40, 30);
        };
        
        // Positionner les arbres (éviter le château)
        const trees = [
            {x: 150, y: 250},   // Haut gauche
            {x: 300, y: 200},   // Haut gauche-centre
            {x: 724, y: 200},   // Haut droite-centre
            {x: 874, y: 250},   // Haut droite
            {x: 150, y: 550},   // Bas gauche
            {x: 400, y: 600},   // Bas centre-gauche
            {x: 624, y: 600},   // Bas centre-droite
            {x: 874, y: 550}    // Bas droite
        ];
        
        trees.forEach(tree => {
            drawSimpleTree(tree.x, tree.y);
        });
        
        // ========== CHÂTEAU / DONJON (pixel art style rétro - imposant) ==========
        ctx.fillStyle = '#696969'; // Gris foncé pour les murs
        // Corps principal du château (plus grand)
        const mainBodyHeight = 200;
        ctx.fillRect(this.castleX, this.castleY + 80, this.castleWidth, mainBodyHeight);
        
        // Tours latérales (beaucoup plus hautes et imposantes)
        const towerWidth = 60;
        const towerHeight = 200;
        // Tour gauche (plus large)
        ctx.fillRect(this.castleX - 30, this.castleY + 40, towerWidth, towerHeight);
        // Tour droite (plus large)
        ctx.fillRect(this.castleX + this.castleWidth - 30, this.castleY + 40, towerWidth, towerHeight);
        
        // Tour centrale (donjon style)
        const centerTowerWidth = 80;
        const centerTowerHeight = 240;
        const centerTowerX = this.castleX + this.castleWidth / 2 - centerTowerWidth / 2;
        ctx.fillRect(centerTowerX, this.castleY + 20, centerTowerWidth, centerTowerHeight);
        
        // Créneaux (en haut) - plus grands
        ctx.fillStyle = '#555555';
        const battlementWidth = 30;
        const battlementHeight = 25;
        // Créneaux sur le corps principal
        for (let i = 0; i < Math.floor(this.castleWidth / battlementWidth); i++) {
            const x = this.castleX + i * battlementWidth;
            if (i % 2 === 0) { // Un créneau sur deux
                ctx.fillRect(x, this.castleY + 80, battlementWidth, battlementHeight);
            }
        }
        // Créneaux sur la tour gauche
        ctx.fillRect(this.castleX - 30, this.castleY + 40, battlementWidth, battlementHeight);
        ctx.fillRect(this.castleX, this.castleY + 40, battlementWidth, battlementHeight);
        // Créneaux sur la tour droite
        ctx.fillRect(this.castleX + this.castleWidth - 60, this.castleY + 40, battlementWidth, battlementHeight);
        ctx.fillRect(this.castleX + this.castleWidth - 30, this.castleY + 40, battlementWidth, battlementHeight);
        // Créneaux sur la tour centrale
        ctx.fillRect(centerTowerX, this.castleY + 20, battlementWidth, battlementHeight);
        ctx.fillRect(centerTowerX + centerTowerWidth - battlementWidth, this.castleY + 20, battlementWidth, battlementHeight);
        
        // Détails supplémentaires pour rendre plus imposant
        ctx.fillStyle = '#4a4a4a'; // Plus foncé pour les ombres
        // Ombre sur le côté gauche
        ctx.fillRect(this.castleX, this.castleY + 80, 10, mainBodyHeight);
        // Ombre sur la tour gauche
        ctx.fillRect(this.castleX - 30, this.castleY + 40, 10, towerHeight);
        
        // Fenêtres du château
        ctx.fillStyle = '#FFD700'; // Jaune pour les fenêtres (lumière)
        const windowWidth = 20;
        const windowHeight = 30;
        // Fenêtre tour gauche
        const leftTowerWindowX = this.castleX - 15;
        const leftTowerWindowY = this.castleY + 100;
        ctx.fillRect(leftTowerWindowX, leftTowerWindowY, windowWidth, windowHeight);
        // Fenêtre tour droite
        const rightTowerWindowX = this.castleX + this.castleWidth - 5;
        const rightTowerWindowY = this.castleY + 100;
        ctx.fillRect(rightTowerWindowX, rightTowerWindowY, windowWidth, windowHeight);
        // Fenêtres tour centrale (2 fenêtres)
        const centerTowerLeftWindowX = centerTowerX + 15;
        const centerTowerRightWindowX = centerTowerX + centerTowerWidth - 35;
        const centerTowerWindowY = this.castleY + 80;
        ctx.fillRect(centerTowerLeftWindowX, centerTowerWindowY, windowWidth, windowHeight);
        ctx.fillRect(centerTowerRightWindowX, centerTowerWindowY, windowWidth, windowHeight);
        // Fenêtre supérieure tour centrale
        ctx.fillRect(centerTowerLeftWindowX, this.castleY + 50, windowWidth, windowHeight);
        ctx.fillRect(centerTowerRightWindowX, this.castleY + 50, windowWidth, windowHeight);
        // Croix dans les fenêtres (barreaux)
        ctx.fillStyle = '#1a1008'; // Brun très foncé pour les barreaux
        ctx.lineWidth = 2;
        // Tour gauche
        ctx.strokeRect(leftTowerWindowX + 2, leftTowerWindowY + 2, windowWidth - 4, windowHeight - 4);
        ctx.fillRect(leftTowerWindowX + windowWidth / 2 - 1, leftTowerWindowY + 2, 2, windowHeight - 4);
        ctx.fillRect(leftTowerWindowX + 2, leftTowerWindowY + windowHeight / 2 - 1, windowWidth - 4, 2);
        // Tour droite
        ctx.strokeRect(rightTowerWindowX + 2, rightTowerWindowY + 2, windowWidth - 4, windowHeight - 4);
        ctx.fillRect(rightTowerWindowX + windowWidth / 2 - 1, rightTowerWindowY + 2, 2, windowHeight - 4);
        ctx.fillRect(rightTowerWindowX + 2, rightTowerWindowY + windowHeight / 2 - 1, windowWidth - 4, 2);
        // Tours centrales
        const drawWindowCross = (x, y) => {
            ctx.strokeRect(x + 2, y + 2, windowWidth - 4, windowHeight - 4);
            ctx.fillRect(x + windowWidth / 2 - 1, y + 2, 2, windowHeight - 4);
            ctx.fillRect(x + 2, y + windowHeight / 2 - 1, windowWidth - 4, 2);
        };
        drawWindowCross(centerTowerLeftWindowX, centerTowerWindowY);
        drawWindowCross(centerTowerRightWindowX, centerTowerWindowY);
        drawWindowCross(centerTowerLeftWindowX, this.castleY + 50);
        drawWindowCross(centerTowerRightWindowX, this.castleY + 50);
        
        // Portes (fermées) - plus grandes et imposantes au centre
        ctx.fillStyle = '#2F1B14'; // Brun foncé pour les portes
        const doorWidth = 60;
        const doorHeight = 120;
        const doorX = this.castleX + this.castleWidth / 2 - doorWidth / 2;
        const doorY = this.castleY + 240; // Position plus basse pour les portes
        ctx.fillRect(doorX, doorY, doorWidth, doorHeight);
        
        // Détails des portes (fermeture) - plus épais
        ctx.fillStyle = '#1a1008';
        ctx.fillRect(doorX + 8, doorY + 15, 8, 90); // Barre verticale gauche
        ctx.fillRect(doorX + doorWidth - 16, doorY + 15, 8, 90); // Barre verticale droite
        ctx.fillRect(doorX + 8, doorY + 50, doorWidth - 16, 8); // Barre horizontale haute
        ctx.fillRect(doorX + 8, doorY + 80, doorWidth - 16, 8); // Barre horizontale basse
        
        // Renforts métalliques sur les portes
        ctx.fillStyle = '#555555';
        ctx.fillRect(doorX + 10, doorY + 20, 4, 100);
        ctx.fillRect(doorX + doorWidth - 14, doorY + 20, 4, 100);
        
        // ========== PNJ (sheepman) ==========
        if (this.npc) {
            this.npc.render(ctx);
        }
        
        // ========== JOUEUR ==========
        if (this.player) {
            this.player.render(ctx);
        }
        
        // ========== GAME OVER (rendu en dernier, même style que Phase1) ==========
        if (this.gameOver) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalAlpha = 1;
            ctx.imageSmoothingEnabled = true;
            
            // Fond noir semi-transparent
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Texte "GAME OVER" (rouge comme dans Phase1)
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 64px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 100);
            
            // Zone pour le bouton "Rejouer" (même style que Phase1)
            const buttonWidth = 200;
            const buttonHeight = 50;
            const buttonX = this.canvas.width / 2 - buttonWidth / 2;
            let buttonY = this.canvas.height / 2 + 50;
            const pressOffset = this.buttonPressed ? 3 : 0; // Décalage quand enfoncé
            
            // Ajuster la position si le bouton est pressé
            buttonY += pressOffset;
            
            // Fond du bouton (plus sombre si pressé, même style que Phase1)
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
            
            return; // Ne pas afficher le dialogue si Game Over
        }
        
        // ========== DIALOGUE (rendu en dernier) ==========
        if (this.dialogueActive) {
            // Réinitialiser le contexte canvas
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            ctx.imageSmoothingEnabled = true;
            
            // Dimensions de la fenêtre de dialogue
            const dialogWidth = Math.min(800, Math.max(500, this.canvas.width * 0.75));
            let dialogHeight;
            let dialogX = (this.canvas.width - dialogWidth) / 2;
            let dialogY;
            
            if (this.riddleState === 'riddle') {
                // Fenêtre plus grande pour l'énigme avec les choix, positionnée plus haut
                dialogHeight = 350;
                dialogY = this.canvas.height * 0.15; // Plus haut pour voir tout le dialogue
            } else {
                // Fenêtre normale pour le dialogue
                dialogHeight = Math.min(120, Math.max(80, this.canvas.height * 0.15));
                dialogY = this.canvas.height * 0.5;
            }
            
            // Fond noir opaque
            ctx.fillStyle = '#000000';
            ctx.fillRect(dialogX, dialogY, dialogWidth, dialogHeight);
            
            // Bordure blanche épaisse (style RPG)
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.strokeRect(dialogX, dialogY, dialogWidth, dialogHeight);
            
            // Bordure intérieure fine
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(dialogX + 3, dialogY + 3, dialogWidth - 6, dialogHeight - 6);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            
            if (this.riddleState === 'dialogue') {
                // Afficher le dialogue normal
                if (this.dialogueIndex < this.dialogueLines.length) {
                    const text = this.dialogueLines[this.dialogueIndex];
                    const lines = this.wrapText(ctx, text, dialogWidth - 60);
                    lines.forEach((line, i) => {
                        ctx.fillText(line, dialogX + 20, dialogY + 20 + (i * 24));
                    });
                }
                
                // Flèche clignotante vers le bas
                if (this.waitingForDialogueInput) {
                    const arrowVisible = Math.floor(this.dialogueArrowBlinkTimer * 2) % 2 === 0;
                    if (arrowVisible) {
                        ctx.fillStyle = '#ffffff';
                        const arrowX = dialogX + dialogWidth - 30;
                        const arrowY = dialogY + dialogHeight - 25;
                        ctx.beginPath();
                        ctx.moveTo(arrowX, arrowY);
                        ctx.lineTo(arrowX - 8, arrowY - 8);
                        ctx.lineTo(arrowX + 8, arrowY - 8);
                        ctx.closePath();
                        ctx.fill();
                    }
                }
            } else if (this.riddleState === 'riddle') {
                // Afficher "Voici mon énigme :"
                let yPos = dialogY + 20;
                ctx.fillText("Voici mon énigme :", dialogX + 20, yPos);
                yPos += 35;
                
                // Afficher l'énigme
                this.riddleLines.forEach((line, i) => {
                    ctx.fillText(line, dialogX + 20, yPos);
                    yPos += 30;
                });
                
                // Afficher les choix de réponse
                yPos += 20;
                this.answerChoices.forEach((choice, index) => {
                    const isSelected = index === this.selectedAnswerIndex;
                    const choiceY = yPos + 15; // Position Y pour le texte
                    
                    // Fond pour le choix sélectionné (bien aligné)
                    if (isSelected) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                        ctx.fillRect(dialogX + 15, yPos, dialogWidth - 30, 30);
                    }
                    
                    // Flèche pour le choix sélectionné (pointant vers la droite, style dialogue)
                    if (isSelected) {
                        ctx.fillStyle = '#ffffff';
                        const arrowX = dialogX + 25;
                        const arrowY = choiceY + 5; // Alignée avec le texte
                        ctx.beginPath();
                        ctx.moveTo(arrowX, arrowY);
                        ctx.lineTo(arrowX - 8, arrowY - 8);
                        ctx.lineTo(arrowX - 8, arrowY + 8);
                        ctx.closePath();
                        ctx.fill();
                    }
                    
                    // Texte du choix
                    ctx.fillStyle = isSelected ? '#ffff00' : '#ffffff';
                    ctx.font = 'bold 18px Arial';
                    ctx.fillText(choice, dialogX + 45, choiceY);
                    
                    yPos += 40;
                });
            } else if (this.riddleState === 'result') {
                // Afficher le résultat
                let resultText = '';
                if (this.answerResult === 'correct') {
                    resultText = this.resultText || "Zut, moi qui voulait t'enc... Heu bonne chance face à Amar ! Meuh !";
                } else {
                    resultText = this.gameOverText;
                }
                
                const lines = this.wrapText(ctx, resultText, dialogWidth - 60);
                lines.forEach((line, i) => {
                    ctx.fillText(line, dialogX + 20, dialogY + 20 + (i * 24));
                });
                
                // Flèche clignotante vers le bas
                if (this.waitingForDialogueInput) {
                    const arrowVisible = Math.floor(this.dialogueArrowBlinkTimer * 2) % 2 === 0;
                    if (arrowVisible) {
                        ctx.fillStyle = '#ffffff';
                        const arrowX = dialogX + dialogWidth - 30;
                        const arrowY = dialogY + dialogHeight - 25;
                        ctx.beginPath();
                        ctx.moveTo(arrowX, arrowY);
                        ctx.lineTo(arrowX - 8, arrowY - 8);
                        ctx.lineTo(arrowX + 8, arrowY - 8);
                        ctx.closePath();
                        ctx.fill();
                    }
                }
            }
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

