class Phase3_Boss {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        this.ctx = game.ctx;
        this.player = null;
        
        // État du combat
        this.bossHp = 50;
        this.bossMaxHp = 50;
        this.currentTurn = 0; // Tour actuel (0-4, 5 questions max)
        this.selectedAnswerIndex = 0;
        this.battleState = 'intro_dialogue'; // 'intro_dialogue' | 'boss_talk' | 'player_choice' | 'result' | 'game_over' | 'victory_dialogue' | 'victory_free' | 'defeat_dialogue'
        
        // Sprites
        this.bossSprite = null;
        this.bikeSprite = null;
        this.bossSpriteLoaded = false;
        this.bikeSpriteLoaded = false;
        
        // Position de la cage et de la moto (en haut à gauche de l'écran)
        this.cageX = 100; // Décalé sur la gauche
        this.cageY = 50; // En haut de l'écran
        this.cageWidth = 200;
        this.cageHeight = 150;
        this.cageVisible = true;
        
        // Position du boss (cœur) à gauche, sous la cage
        this.bossX = 200; // À gauche de l'écran
        this.bossY = this.canvas.height / 2 - 100; // Remonté de 100 pixels
        
        // Dialogue d'introduction
        this.introDialogueLines = [
            "Je suis la puissante Amar ! Tu ne pourras pas vaincre mon amour pour toi !"
        ];
        this.introDialogueTimer = 0;
        this.introDialogueComplete = false;
        this.waitingForDialogueInput = false;
        this.dialogueArrowBlinkTimer = 0;
        
        // Dialogue de victoire
        this.victoryDialogueLines = [
            "Aaaaargh ! Je suis vaincue ! Je ne peux plus m'interposer entre toi et ton véritable amour ! *s'effondre*"
        ];
        this.victoryDialogueComplete = false;
        
        // Dialogue de défaite
        this.defeatDialogueLines = [
            "HAHAHA ! Je le savais ! Tu m'aimes donc ! Allons nous marier !"
        ];
        this.defeatDialogueComplete = false;
        
        // Phrases du boss et réponses
        this.bossPhrases = [
            {
                text: "Je t'aime !",
                answers: [
                    { text: "Moi aussi je m'aime !", correct: true },
                    { text: "Moi aussi je t'aime !", correct: false },
                    { text: "Tu es la femme de ma vie !", correct: false }
                ]
            },
            {
                text: "Partons en voyage demain !",
                answers: [
                    { text: "Achetons nos billets et c'est parti !", correct: false },
                    { text: "Je rêve de visiter le monde à tes côté !", correct: false },
                    { text: "J'aime rester chez moi !", correct: true }
                ]
            },
            {
                text: "Je veux vivre avec toi !",
                answers: [
                    { text: "Achetons une petite maison de Hobbit et let's go !", correct: false },
                    { text: "Je ne suis pas prêt", correct: true },
                    { text: "Chez toi ou chez moi mon amour ?", correct: false }
                ]
            },
            {
                text: "Il y a un super jeu vidéo que j'aimerai faire avec toi !",
                answers: [
                    { text: "Je ne joue pas avec les noobs", correct: true },
                    { text: "Lequel, que je l'installe de ce pas ?", correct: false },
                    { text: "Bien sûr mon amour, et après on pourra en tester plein d'autres toute notre vie !", correct: false }
                ]
            },
            {
                text: "On est quoi toi et moi ?",
                answers: [
                    { text: "Tu es l'amour de ma vie voyons !", correct: false },
                    { text: "Pourquoi vouloir à tout prix mettre une étiquette et se prendre la tête ?", correct: true },
                    { text: "Tu es mon âme sœur !", correct: false }
                ]
            }
        ];
        
        // Input handlers
        this.keydownHandler = null;
        this.keyupHandler = null;
        this.clickHandler = null;
        this._interactPressed = false;
        this.buttonPressed = false;
        this.bossTalkTimer = 0;
        this.heartPulseTime = 0;
        this.resultMessage = null;
    }
    
    async init() {
        console.log('🎮 Phase3_Boss.init() appelé');
        
        // Réinitialiser les positions
        this.cageX = 100; // Cage en haut à gauche
        this.cageY = 50; // Cage en haut
        this.bossX = 200; // Boss à gauche
        this.bossY = this.canvas.height / 2 - 100; // Boss remonté (sous la cage)
        
        // Position initiale du joueur (à droite d'Amar, même niveau vertical)
        const playerX = this.bossX + 400; // Grand espace à droite d'Amar
        const playerY = this.bossY - 20; // Même niveau vertical qu'Amar (ajusté pour centrer)
        this.player = new Player(playerX, playerY, this.game);
        
        // S'assurer que le sprite du joueur est chargé
        await this.player.loadSprite();
        
        // Réinitialiser l'état du combat
        this.bossHp = 50;
        this.bossMaxHp = 50;
        this.currentTurn = 0;
        this.selectedAnswerIndex = 0;
        this.battleState = 'intro_dialogue';
        this.bossTalkTimer = 0;
        this.heartPulseTime = 0;
        this.resultMessage = null;
        this.introDialogueComplete = false;
        this.victoryDialogueComplete = false;
        this.defeatDialogueComplete = false;
        this.cageVisible = true;
        this.waitingForDialogueInput = false;
        this.dialogueArrowBlinkTimer = 0;
        
        // Charger les sprites
        await this.loadSprites();
        
        this.setupInput();
        
        console.log('✅ Phase3_Boss initialisée (combat style donjon)');
    }
    
    async loadSprites() {
        // Charger le sprite du boss (cœur)
        return new Promise((resolve) => {
            const bossImg = new Image();
            bossImg.onload = () => {
                this.bossSprite = bossImg;
                this.bossSpriteLoaded = true;
                console.log('✅ Sprite boss (cœur) chargé:', bossImg.width, 'x', bossImg.height);
                
                // Charger le sprite de la moto
                const bikeImg = new Image();
                
                bikeImg.onload = () => {
                    console.log('🏍️ Image moto onload déclenché');
                    console.log('  - Dimensions:', bikeImg.width, 'x', bikeImg.height);
                    console.log('  - Complete:', bikeImg.complete);
                    console.log('  - naturalWidth:', bikeImg.naturalWidth);
                    
                    // Vérifier que l'image est vraiment chargée
                    if (bikeImg.complete && bikeImg.naturalWidth > 0) {
                        this.bikeSprite = bikeImg;
                        this.bikeSpriteLoaded = true;
                        console.log('✅ Sprite moto chargé avec succès !');
                    } else {
                        console.error('❌ Image moto onload mais pas complete ou naturalWidth = 0');
                        this.bikeSpriteLoaded = false;
                    }
                    resolve();
                };
                
                bikeImg.onerror = (e) => {
                    console.error('❌ Erreur chargement sprite moto:', e);
                    console.error('  - URL tentée:', bikeImg.src);
                    this.bikeSpriteLoaded = false;
                    resolve();
                };
                
                // Définir la source APRÈS avoir défini les handlers
                const bikePath = 'assets/images/sprites/vehicles/spr_bike_0.png';
                console.log('🔄 Tentative de chargement moto:', bikePath);
                bikeImg.src = bikePath;
            };
            
            bossImg.onerror = (e) => {
                console.error('❌ Erreur chargement sprite boss:', e);
                console.error('  - URL tentée:', bossImg.src);
                this.bossSpriteLoaded = false;
                
                // Même si le boss ne charge pas, essayer de charger la moto
                const bikeImg = new Image();
                bikeImg.onload = () => {
                    if (bikeImg.complete && bikeImg.naturalWidth > 0) {
                        this.bikeSprite = bikeImg;
                        this.bikeSpriteLoaded = true;
                        console.log('✅ Sprite moto chargé (malgré échec boss)');
                    }
                    resolve();
                };
                bikeImg.onerror = () => {
                    console.error('❌ Erreur chargement sprite moto (après échec boss)');
                    resolve();
                };
                bikeImg.src = 'assets/images/sprites/vehicles/spr_bike_0.png';
            };
            
            bossImg.src = 'assets/images/sprites/boss/Heart.png';
        });
    }
    
    setupInput() {
        this.keydownHandler = (e) => {
            // Gérer le dialogue d'introduction
            if (this.battleState === 'intro_dialogue' && this.waitingForDialogueInput && (e.key === 'Enter' || e.key === 'e' || e.key === 'E') && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                this.introDialogueComplete = true;
                this.waitingForDialogueInput = false;
                this.battleState = 'boss_talk';
                this.bossTalkTimer = 0;
                return;
            }
            
            // Gérer le dialogue de victoire
            if (this.battleState === 'victory_dialogue' && this.waitingForDialogueInput && (e.key === 'Enter' || e.key === 'e' || e.key === 'E') && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                this.victoryDialogueComplete = true;
                this.waitingForDialogueInput = false;
                this.cageVisible = false;
                this.battleState = 'victory_free';
                return;
            }
            
            // Gérer le dialogue de défaite
            if (this.battleState === 'defeat_dialogue' && this.waitingForDialogueInput && (e.key === 'Enter' || e.key === 'e' || e.key === 'E') && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                this.defeatDialogueComplete = true;
                this.waitingForDialogueInput = false;
                this.battleState = 'game_over';
                return;
            }
            
            // Gérer l'interaction avec la moto en mode libre
            if (this.battleState === 'victory_free' && (e.key === 'Enter' || e.key === 'e' || e.key === 'E') && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                // Vérifier si le joueur est proche de la moto
                const bikeX = this.cageX + this.cageWidth / 2;
                const bikeY = this.cageY + this.cageHeight / 2;
                const distance = Math.sqrt(Math.pow(this.player.x + this.player.width/2 - bikeX, 2) + Math.pow(this.player.y + this.player.height/2 - bikeY, 2));
                if (distance < 100) {
                    // Passer à la phase suivante (écran noir)
                    console.log('✅ Interaction avec la moto, passage à la phase suivante');
                    this.game.nextPhase(); // Cette méthode passera à la phase suivante ou affichera un écran noir
                }
                return;
            }
            
            // Gérer la sélection de réponse
            if (this.battleState === 'player_choice') {
                if (e.key === 'ArrowUp' || e.key === 'z' || e.key === 'Z') {
                    e.preventDefault();
                    this.selectedAnswerIndex = (this.selectedAnswerIndex - 1 + 3) % 3;
                } else if (e.key === 'ArrowDown' || e.key === 'w' || e.key === 'W') {
                    e.preventDefault();
                    this.selectedAnswerIndex = (this.selectedAnswerIndex + 1) % 3;
                } else if ((e.key === 'Enter' || e.key === 'e' || e.key === 'E') && !this._interactPressed) {
                    e.preventDefault();
                    this._interactPressed = true;
                    this.submitAnswer();
                }
                return;
            }
            
            // Gérer la transition après résultat
            if (this.battleState === 'result' && (e.key === 'Enter' || e.key === 'e' || e.key === 'E') && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                this.nextTurn();
            }
        };
        
        this.keyupHandler = (e) => {
            if (e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
                this._interactPressed = false;
            }
        };
        
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
        
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
        if (this.battleState === 'game_over') {
            const buttonWidth = 200;
            const buttonHeight = 50;
            const buttonX = this.canvas.width / 2 - buttonWidth / 2;
            const buttonY = this.canvas.height / 2 + 50;
            
            if (x >= buttonX && x <= buttonX + buttonWidth &&
                y >= buttonY && y <= buttonY + buttonHeight) {
                // Clic sur le bouton Rejouer
                this.buttonPressed = true;
                
                // Retourner à Phase1_Roguelike (vague 1)
                setTimeout(() => {
                    this.buttonPressed = false;
                    console.log('🔄 Retour à Phase1_Roguelike (vague 1)');
                    // Nettoyer Phase3
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
    
    submitAnswer() {
        const currentPhrase = this.bossPhrases[this.currentTurn];
        const selectedAnswer = currentPhrase.answers[this.selectedAnswerIndex];
        
        if (selectedAnswer.correct) {
            // Bonne réponse : boss prend 10 dégâts
            this.bossHp = Math.max(0, this.bossHp - 10);
            console.log('✅ Bonne réponse ! Boss prend 10 dégâts. HP restants:', this.bossHp);
            this.battleState = 'result';
            this.resultMessage = `Le boss prend 10 dégâts !`;
            
            // Vérifier si le boss est KO
            if (this.bossHp <= 0) {
                this.battleState = 'victory_dialogue';
                this.waitingForDialogueInput = false;
            }
        } else {
            // Mauvaise réponse : joueur prend 20 dégâts
            this.game.playerData.hp = Math.max(0, this.game.playerData.hp - 20);
            console.log('❌ Mauvaise réponse ! Joueur prend 20 dégâts. HP restants:', this.game.playerData.hp);
            this.battleState = 'result';
            this.resultMessage = `Vous prenez 20 dégâts !`;
            
            // Vérifier si le joueur est KO
            if (this.game.playerData.hp <= 0) {
                this.battleState = 'defeat_dialogue';
                this.waitingForDialogueInput = false;
            }
        }
    }
    
    nextTurn() {
        // Passer au tour suivant
        this.currentTurn++;
        
        // Vérifier si on a atteint la fin du combat (5 tours max)
        if (this.currentTurn >= this.bossPhrases.length) {
            // Combat terminé, déterminer le vainqueur
            if (this.bossHp <= 0) {
                this.battleState = 'victory_dialogue';
                this.waitingForDialogueInput = false;
            } else if (this.game.playerData.hp <= 0) {
                this.battleState = 'defeat_dialogue';
                this.waitingForDialogueInput = false;
            } else {
                // Ni l'un ni l'autre n'est KO, mais on a fait tous les tours
                // Le boss gagne par défaut
                this.battleState = 'defeat_dialogue';
                this.waitingForDialogueInput = false;
            }
        } else {
            // Continuer le combat
            this.battleState = 'boss_talk';
            this.bossTalkTimer = 0;
            this.selectedAnswerIndex = 0;
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
    
    update(deltaTime, keys) {
        // Timer pour la pulsation du cœur
        this.heartPulseTime += deltaTime;
        
        // Timer pour la flèche clignotante dans les dialogues
        this.dialogueArrowBlinkTimer += deltaTime;
        
        // Gérer le dialogue d'introduction
        if (this.battleState === 'intro_dialogue') {
            this.introDialogueTimer += deltaTime;
            if (this.introDialogueTimer >= 0.5 && !this.waitingForDialogueInput) {
                this.waitingForDialogueInput = true;
            }
        }
        
        // Gérer les dialogues de victoire/défaite
        if (this.battleState === 'victory_dialogue' || this.battleState === 'defeat_dialogue') {
            if (!this.waitingForDialogueInput) {
                this.waitingForDialogueInput = true;
            }
        }
        
        // Si Game Over, ne pas permettre le mouvement
        if (this.battleState === 'game_over') {
            // Mettre à jour seulement les animations
            if (this.player && this.player.currentAnimation) {
                this.player.currentAnimation.update(deltaTime);
            }
            return;
        }
        
        // Mode libre après victoire : permettre le mouvement
        if (this.battleState === 'victory_free') {
            if (this.player) {
                this.player.update(keys, deltaTime);
            }
            return;
        }
        
        // Permettre le mouvement du joueur dans tous les autres états (dialogue, combat, etc.)
        if (this.player) {
            // Calculer le mouvement manuellement pour permettre le déplacement libre
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
            
            // Appliquer les limites de l'écran
            newX = Math.max(0, Math.min(this.canvas.width - this.player.width, newX));
            newY = Math.max(0, Math.min(this.canvas.height - this.player.height, newY));
            
            // Aucune collision - le joueur peut se déplacer librement
            this.player.x = newX;
            this.player.y = newY;
            
            // Mettre à jour les animations du joueur
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
        
        // Gestion de la transition automatique de boss_talk vers player_choice
        if (this.battleState === 'boss_talk') {
            this.bossTalkTimer += deltaTime;
            
            // Après 2 secondes, passer au choix du joueur
            if (this.bossTalkTimer >= 2) {
                this.battleState = 'player_choice';
            }
        }
    }
    
    render(ctx) {
        // DEBUG
        if (!this._renderCallCount) this._renderCallCount = 0;
        this._renderCallCount++;
        if (this._renderCallCount % 60 === 0) {
            console.log('🎨 Phase3 render() appelé', this._renderCallCount, 'fois - battleState:', this.battleState);
        }
        
        // Fond : sol de donjon (briques grises)
        this.renderDungeonFloor(ctx);
        
        // Dessiner la scène (cage, moto, boss, joueur)
        this.renderScene(ctx);
        
        // Rendu selon l'état
        if (this.battleState === 'game_over') {
            this.renderGameOver(ctx);
        } else if (this.battleState === 'victory_dialogue' || this.battleState === 'defeat_dialogue' || this.battleState === 'intro_dialogue') {
            this.renderDialogue(ctx);
        } else if (this.battleState !== 'victory_free') {
            this.renderBattleUI(ctx);
        }
    }
    
    renderDungeonFloor(ctx) {
        // Couleur de fond gris foncé
        ctx.fillStyle = '#2C2C2C';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dessiner des briques grises
        const brickWidth = 64;
        const brickHeight = 32;
        const brickColor = '#404040';
        const brickBorder = '#202020';
        
        for (let y = 0; y < this.canvas.height; y += brickHeight) {
            for (let x = 0; x < this.canvas.width; x += brickWidth) {
                // Décaler les briques de la deuxième ligne
                const offsetX = (Math.floor(y / brickHeight) % 2 === 0) ? 0 : brickWidth / 2;
                
                ctx.fillStyle = brickColor;
                ctx.fillRect(x + offsetX, y, brickWidth - 2, brickHeight - 2);
                
                ctx.strokeStyle = brickBorder;
                ctx.lineWidth = 1;
                ctx.strokeRect(x + offsetX, y, brickWidth - 2, brickHeight - 2);
            }
        }
    }
    
    renderScene(ctx) {
        // IMPORTANT : Dessiner la moto D'ABORD (derrière les barreaux)
        // Le sprite fait 288x189 pixels selon OpenGameArt, on va l'adapter à la taille de la cage
        if (this.bikeSpriteLoaded && this.bikeSprite) {
            // Calculer la position et la taille de la moto pour qu'elle s'adapte à la cage
            // Le sprite original fait 288x189, on va le redimensionner proportionnellement
            const bikeDisplayWidth = this.cageWidth * 0.9; // 90% de la largeur de la cage
            const bikeDisplayHeight = (this.bikeSprite.height / this.bikeSprite.width) * bikeDisplayWidth; // Conserver les proportions
            const bikeX = this.cageX + this.cageWidth / 2 - bikeDisplayWidth / 2;
            const bikeY = this.cageY + this.cageHeight / 2 - bikeDisplayHeight / 2;
            
            ctx.drawImage(this.bikeSprite, bikeX, bikeY, bikeDisplayWidth, bikeDisplayHeight);
        } else {
            // Fallback : rectangle représentatif (derrière les barreaux)
            ctx.fillStyle = '#666666';
            ctx.fillRect(this.cageX + this.cageWidth / 2 - 50, this.cageY + this.cageHeight / 2 - 30, 100, 60);
        }
        
        // Dessiner la cage PAR-DESSUS la moto (les barreaux apparaîtront devant)
        if (this.cageVisible) {
            this.renderCage(ctx);
        }
        
        // Dessiner le boss (cœur) au milieu de l'écran (seulement si pas en mode libre)
        if (this.battleState !== 'victory_free' && this.battleState !== 'victory_dialogue') {
            const bossSize = 64;
            const pulse = 1 + Math.sin(this.heartPulseTime * 3) * 0.1;
            
            // Dessiner le nom et la barre de vie AVANT le cœur (pour qu'ils soient au-dessus)
            ctx.save();
            ctx.translate(this.bossX, this.bossY);
            
            // Nom du boss "Amar" au-dessus
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 18px Arial'; // Réduit de 24px à 18px
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText('Amar', 0, -bossSize / 2 - 20); // Position ajustée
            
            // Barre de vie sous le nom (collée au nom)
            const barWidth = 200;
            const barHeight = 20;
            const barX = -barWidth / 2;
            const barY = -bossSize / 2 + 2; // Collée au nom (seulement 2px d'espace)
            
            // Fond de la barre (gris foncé)
            ctx.fillStyle = '#333333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Bordure de la barre
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
            
            // Barre de vie (rouge, proportionnelle aux HP)
            const hpPercent = this.bossHp / this.bossMaxHp;
            const hpBarWidth = barWidth * hpPercent;
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(barX + 2, barY + 2, hpBarWidth - 4, barHeight - 4);
            
            // Texte des HP au centre de la barre
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${this.bossHp} / ${this.bossMaxHp}`, 0, barY + barHeight / 2);
            
            ctx.restore();
            
            // Dessiner le cœur avec pulsation
            ctx.save();
            ctx.translate(this.bossX, this.bossY);
            ctx.scale(pulse, pulse);
            
            // Dessiner le cœur
            if (this.bossSpriteLoaded && this.bossSprite) {
                // Utiliser le sprite du cœur si disponible
                ctx.drawImage(this.bossSprite, -this.bossSprite.width / 2, -this.bossSprite.height / 2);
            } else {
                // Fallback : cœur dessiné
                ctx.fillStyle = '#FF0000';
                ctx.beginPath();
                ctx.moveTo(0, 10);
                ctx.bezierCurveTo(-25, -10, -50, 0, -25, 40);
                ctx.lineTo(0, 60);
                ctx.lineTo(25, 40);
                ctx.bezierCurveTo(50, 0, 25, -10, 0, 10);
                ctx.closePath();
                ctx.fill();
            }
            
            // Ajouter les yeux (deux petits cercles noirs) - repositionnés plus bas
            ctx.fillStyle = '#000000';
            // Œil gauche (positionné plus bas et centré sur le cœur)
            ctx.beginPath();
            ctx.arc(-12, 8, 4, 0, Math.PI * 2);
            ctx.fill();
            // Œil droit (positionné plus bas et centré sur le cœur)
            ctx.beginPath();
            ctx.arc(12, 8, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Ajouter le sourire (arc) - repositionné plus bas
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 22, 12, 0.2, Math.PI - 0.2, false);
            ctx.stroke();
            
            ctx.restore();
        }
        
        // Dessiner le joueur (utiliser la méthode render du Player)
        if (this.player) {
            this.player.render(ctx);
        }
    }
    
    renderCage(ctx) {
        // Barreaux verticaux
        const barSpacing = 20;
        const barWidth = 4;
        ctx.fillStyle = '#666666';
        
        for (let x = this.cageX; x <= this.cageX + this.cageWidth; x += barSpacing) {
            ctx.fillRect(x, this.cageY, barWidth, this.cageHeight);
        }
        
        // Barreaux horizontaux (haut et bas)
        ctx.fillRect(this.cageX, this.cageY, this.cageWidth, barWidth);
        ctx.fillRect(this.cageX, this.cageY + this.cageHeight - barWidth, this.cageWidth, barWidth);
        
        // Coins renforcés
        const cornerSize = 8;
        ctx.fillStyle = '#888888';
        ctx.fillRect(this.cageX, this.cageY, cornerSize, cornerSize);
        ctx.fillRect(this.cageX + this.cageWidth - cornerSize, this.cageY, cornerSize, cornerSize);
        ctx.fillRect(this.cageX, this.cageY + this.cageHeight - cornerSize, cornerSize, cornerSize);
        ctx.fillRect(this.cageX + this.cageWidth - cornerSize, this.cageY + this.cageHeight - cornerSize, cornerSize, cornerSize);
    }
    
    renderDialogue(ctx) {
        // Cadre de dialogue en bas
        const dialogHeight = 200;
        const dialogWidth = this.canvas.width - 40;
        const dialogX = 20;
        const dialogY = this.canvas.height - dialogHeight - 20;
        
        // Fond du dialogue
        ctx.fillStyle = '#000000';
        ctx.fillRect(dialogX, dialogY, dialogWidth, dialogHeight);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.strokeRect(dialogX, dialogY, dialogWidth, dialogHeight);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        let dialogueText = '';
        if (this.battleState === 'intro_dialogue') {
            dialogueText = this.introDialogueLines[0];
        } else if (this.battleState === 'victory_dialogue') {
            dialogueText = this.victoryDialogueLines[0];
        } else if (this.battleState === 'defeat_dialogue') {
            dialogueText = this.defeatDialogueLines[0];
        }
        
        // Afficher le texte du dialogue
        const lines = this.wrapText(ctx, dialogueText, dialogWidth - 40);
        let yPos = dialogY + 20;
        lines.forEach(line => {
            ctx.fillText(line, dialogX + 20, yPos);
            yPos += 25;
        });
        
        // Flèche clignotante
        if (this.waitingForDialogueInput && Math.floor(this.dialogueArrowBlinkTimer * 2) % 2 === 0) {
            ctx.fillStyle = '#FFFFFF';
            const arrowX = dialogX + dialogWidth - 40;
            const arrowY = dialogY + dialogHeight - 40;
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(arrowX - 10, arrowY - 10);
            ctx.lineTo(arrowX - 10, arrowY + 10);
            ctx.closePath();
            ctx.fill();
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
    
    renderBattleUI(ctx) {
        // Cadre de dialogue en bas
        const dialogHeight = 200;
        const dialogWidth = this.canvas.width - 40;
        const dialogX = 20;
        const dialogY = this.canvas.height - dialogHeight - 20;
        
        // Fond du dialogue
        ctx.fillStyle = '#000000';
        ctx.fillRect(dialogX, dialogY, dialogWidth, dialogHeight);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.strokeRect(dialogX, dialogY, dialogWidth, dialogHeight);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        if (this.battleState === 'boss_talk') {
            // Le boss parle
            const currentPhrase = this.bossPhrases[this.currentTurn];
            ctx.fillText(`AMAR: ${currentPhrase.text}`, dialogX + 20, dialogY + 20);
        } else if (this.battleState === 'player_choice') {
            // Choix du joueur
            const currentPhrase = this.bossPhrases[this.currentTurn];
            ctx.fillText(`Vous devez répondre:`, dialogX + 20, dialogY + 20);
            
            let yPos = dialogY + 60;
            currentPhrase.answers.forEach((answer, index) => {
                const isSelected = index === this.selectedAnswerIndex;
                
                // Fond pour la réponse sélectionnée
                if (isSelected) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.fillRect(dialogX + 15, yPos - 5, dialogWidth - 30, 35);
                }
                
                // Flèche pour la réponse sélectionnée
                if (isSelected) {
                    ctx.fillStyle = '#FFFFFF';
                    const arrowX = dialogX + 25;
                    const arrowY = yPos + 15;
                    ctx.beginPath();
                    ctx.moveTo(arrowX, arrowY);
                    ctx.lineTo(arrowX - 8, arrowY - 8);
                    ctx.lineTo(arrowX - 8, arrowY + 8);
                    ctx.closePath();
                    ctx.fill();
                }
                
                // Texte de la réponse
                ctx.fillStyle = isSelected ? '#FFFF00' : '#FFFFFF';
                ctx.font = 'bold 16px Arial';
                ctx.fillText(answer.text, dialogX + 45, yPos + 10);
                
                yPos += 40;
            });
        } else if (this.battleState === 'result') {
            // Résultat du tour
            ctx.fillText(this.resultMessage || '...', dialogX + 20, dialogY + 20);
            ctx.fillText('Appuyez sur Entrée pour continuer', dialogX + 20, dialogY + 80);
        }
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
        
        // Bouton Rejouer (même style que Phase1)
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
}