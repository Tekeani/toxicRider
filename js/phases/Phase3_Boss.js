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
        this.waitingForPlayerResponse = false;
        this.selectedAnswerIndex = 0;
        this.battleState = 'boss_talk'; // 'boss_talk' | 'player_choice' | 'result' | 'game_over' | 'victory'
        
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
    }
    
    async init() {
        console.log('🎮 Phase3_Boss.init() appelé');
        
        // Initialiser le joueur (utiliser les HP actuels du joueur)
        this.player = new Player(0, 0, this.game); // Position non utilisée pour le rendu
        
        // Réinitialiser l'état du combat
        this.bossHp = 50;
        this.bossMaxHp = 50;
        this.currentTurn = 0;
        this.waitingForPlayerResponse = false;
        this.selectedAnswerIndex = 0;
        this.battleState = 'boss_talk';
        this.bossTalkTimer = 0; // Timer pour transition automatique
        this.heartPulseTime = 0; // Timer pour pulsation du cœur
        this.resultMessage = null;
        
        this.setupInput();
        
        console.log('✅ Phase3_Boss initialisée (combat style Pokémon)');
    }
    
    setupInput() {
        this.keydownHandler = (e) => {
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
                this.battleState = 'victory';
            }
        } else {
            // Mauvaise réponse : joueur prend 20 dégâts
            this.game.playerData.hp = Math.max(0, this.game.playerData.hp - 20);
            console.log('❌ Mauvaise réponse ! Joueur prend 20 dégâts. HP restants:', this.game.playerData.hp);
            this.battleState = 'result';
            this.resultMessage = `Vous prenez 20 dégâts !`;
            
            // Vérifier si le joueur est KO
            if (this.game.playerData.hp <= 0) {
                this.battleState = 'game_over';
            }
        }
    }
    
    nextTurn() {
        if (this.battleState === 'victory' || this.battleState === 'game_over') {
            return;
        }
        
        this.currentTurn++;
        this.selectedAnswerIndex = 0;
        
        // Vérifier si on a fait toutes les questions
        if (this.currentTurn >= this.bossPhrases.length) {
            // Toutes les questions passées sans KO → Game Over
            this.battleState = 'game_over';
            return;
        }
        
        // Nouveau tour : le boss parle
        this.battleState = 'boss_talk';
        this.resultMessage = null;
        this.bossTalkTimer = 0; // Réinitialiser le timer
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
        // Ne pas mettre à jour si game over ou victory (on attend le clic)
        if (this.battleState === 'game_over' || this.battleState === 'victory') {
            return;
        }
        
        // Animation du cœur (pulsation)
        if (!this.heartPulseTime) this.heartPulseTime = 0;
        this.heartPulseTime += deltaTime;
        
        // Transition automatique du boss_talk vers player_choice
        if (this.battleState === 'boss_talk') {
            if (!this.bossTalkTimer) this.bossTalkTimer = 0;
            this.bossTalkTimer += deltaTime;
            if (this.bossTalkTimer >= 2.0) {
                this.battleState = 'player_choice';
                this.bossTalkTimer = 0;
            }
        }
    }
    
    render(ctx) {
        // Nettoyer le canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fond dégradé (style Pokémon - ciel)
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height * 0.6);
        gradient.addColorStop(0, '#87CEEB'); // Ciel clair
        gradient.addColorStop(1, '#98D8D8'); // Ciel plus foncé
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height * 0.6);
        
        // Sol (style Pokémon avec lignes horizontales)
        const groundY = this.canvas.height * 0.6;
        ctx.fillStyle = '#E8E8D0'; // Beige clair
        ctx.fillRect(0, groundY, this.canvas.width, this.canvas.height - groundY);
        
        // Lignes horizontales sur le sol (style Pokémon)
        ctx.strokeStyle = '#D0D0B8';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const lineY = groundY + (this.canvas.height - groundY) / 5 * i;
            ctx.beginPath();
            ctx.moveTo(0, lineY);
            ctx.lineTo(this.canvas.width, lineY);
            ctx.stroke();
        }
        
        // ========== BOSS CŒUR (arrière-plan, à droite) ==========
        this.renderHeartBoss(ctx);
        
        // ========== CHEVALIER (premier plan, vue de dos, grand, à gauche) ==========
        this.renderKnightBack(ctx);
        
        // ========== INTERFACE DE COMBAT ==========
        this.renderBattleUI(ctx);
        
        // ========== GAME OVER / VICTOIRE ==========
        if (this.battleState === 'game_over') {
            this.renderGameOver(ctx);
        } else if (this.battleState === 'victory') {
            this.renderVictory(ctx);
        }
    }
    
    renderHeartBoss(ctx) {
        const centerX = this.canvas.width * 0.75; // À droite de l'écran (style Pokémon)
        const groundY = this.canvas.height * 0.6;
        const centerY = groundY + (this.canvas.height - groundY) / 2; // Sur le sol
        
        // Effet de pulsation (plus subtil)
        const pulse = Math.sin(this.heartPulseTime * 1.5) * 0.05 + 1; // Pulsation entre 0.95 et 1.05
        const heartSize = 180 * pulse; // Plus grand pour être visible
        
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Dessiner un cœur rouge
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        const topCurveHeight = heartSize * 0.3;
        ctx.moveTo(0, topCurveHeight);
        // Gauche
        ctx.bezierCurveTo(-heartSize / 2, -topCurveHeight / 2, -heartSize / 2, -heartSize / 2, 0, -heartSize / 2);
        // Droite
        ctx.bezierCurveTo(heartSize / 2, -heartSize / 2, heartSize / 2, -topCurveHeight / 2, 0, topCurveHeight);
        ctx.closePath();
        ctx.fill();
        
        // Yeux
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-heartSize * 0.2, -heartSize * 0.1, heartSize * 0.08, 0, Math.PI * 2);
        ctx.arc(heartSize * 0.2, -heartSize * 0.1, heartSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupilles
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-heartSize * 0.2, -heartSize * 0.1, heartSize * 0.04, 0, Math.PI * 2);
        ctx.arc(heartSize * 0.2, -heartSize * 0.1, heartSize * 0.04, 0, Math.PI * 2);
        ctx.fill();
        
        // Sourire
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, heartSize * 0.1, heartSize * 0.2, 0, Math.PI);
        ctx.stroke();
        
        ctx.restore();
        
        // Barre de vie du boss (en haut à droite, style Pokémon)
        const bossHpPercent = (this.bossHp / this.bossMaxHp) * 100;
        const hpBarWidth = 250;
        const hpBarHeight = 25;
        const hpBarX = this.canvas.width - hpBarWidth - 20;
        const hpBarY = 20;
        
        // Fond de la barre (noir)
        ctx.fillStyle = '#000000';
        ctx.fillRect(hpBarX, hpBarY, hpBarWidth + 4, hpBarHeight + 4);
        
        // Fond de la barre (gris)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(hpBarX + 2, hpBarY + 2, hpBarWidth, hpBarHeight);
        
        // Fond interne (rouge clair)
        ctx.fillStyle = '#F8D030';
        ctx.fillRect(hpBarX + 4, hpBarY + 4, hpBarWidth - 4, hpBarHeight - 4);
        
        // Barre de vie (vert/jaune/rouge selon les HP)
        ctx.fillStyle = bossHpPercent > 50 ? '#00FF00' : bossHpPercent > 25 ? '#FFFF00' : '#FF0000';
        ctx.fillRect(hpBarX + 4, hpBarY + 4, (hpBarWidth - 4) * (bossHpPercent / 100), hpBarHeight - 4);
        
        // Bordure noire
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(hpBarX + 2, hpBarY + 2, hpBarWidth, hpBarHeight);
        
        // Texte HP (style Pokémon)
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`CŒUR AMOUREUX`, hpBarX + 6, hpBarY - 18);
        ctx.fillText(`HP: ${this.bossHp}/${this.bossMaxHp}`, hpBarX + 6, hpBarY + 8);
    }
    
    renderKnightBack(ctx) {
        // Chevalier en premier plan (vue de dos, grand, style Pokémon)
        const groundY = this.canvas.height * 0.6;
        const knightX = this.canvas.width * 0.25; // À gauche de l'écran (style Pokémon)
        const knightY = groundY + (this.canvas.height - groundY) * 0.85; // Sur le sol, vers le bas
        const knightSize = 280; // Grand (agrandi pour premier plan)
        const scale = knightSize / 64; // Facteur d'agrandissement
        
        // Utiliser le sprite du joueur s'il est chargé
        if (this.player && this.player.spriteLoaded && this.player.spriteSheet && this.player.animations && this.player.animations.idle) {
            ctx.save();
            
            // Positionner le chevalier (point d'ancrage en bas au centre du sprite)
            ctx.translate(knightX, knightY);
            ctx.scale(scale, scale);
            
            // Utiliser la première frame de l'animation idle (vue de face)
            // Pour la vue de dos, on peut utiliser le sprite normal (les sprites sont souvent symétriques)
            const frameIndex = this.player.animations.idle.frames[0];
            
            // Dessiner le sprite (point d'ancrage en bas)
            this.player.spriteSheet.drawFrame(ctx, frameIndex, -32, -64, 1, false);
            
            ctx.restore();
        } else {
            // Fallback : dessiner un rectangle représentatif si le sprite n'est pas chargé
            ctx.fillStyle = '#4A4A4A'; // Gris foncé pour l'armure
            ctx.fillRect(knightX - knightSize / 2, knightY - knightSize, knightSize, knightSize);
            
            // Casque
            ctx.fillStyle = '#666666';
            ctx.beginPath();
            ctx.arc(knightX, knightY - knightSize * 0.8, knightSize * 0.15, 0, Math.PI * 2);
            ctx.fill();
            
            // Épée (tenue de dos)
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(knightX + knightSize * 0.1, knightY - knightSize * 0.5, knightSize * 0.05, knightSize * 0.4);
        }
        
        // Barre de vie du joueur (en haut à gauche, style Pokémon)
        const playerHpPercent = (this.game.playerData.hp / this.game.playerData.maxHp) * 100;
        const hpBarWidth = 250;
        const hpBarHeight = 25;
        const hpBarX = 20;
        const hpBarY = 20;
        
        // Fond de la barre (noir)
        ctx.fillStyle = '#000000';
        ctx.fillRect(hpBarX, hpBarY, hpBarWidth + 4, hpBarHeight + 4);
        
        // Fond de la barre (gris)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(hpBarX + 2, hpBarY + 2, hpBarWidth, hpBarHeight);
        
        // Fond interne (rouge clair)
        ctx.fillStyle = '#F8D030';
        ctx.fillRect(hpBarX + 4, hpBarY + 4, hpBarWidth - 4, hpBarHeight - 4);
        
        // Barre de vie (vert/jaune/rouge selon les HP)
        ctx.fillStyle = playerHpPercent > 50 ? '#00FF00' : playerHpPercent > 25 ? '#FFFF00' : '#FF0000';
        ctx.fillRect(hpBarX + 4, hpBarY + 4, (hpBarWidth - 4) * (playerHpPercent / 100), hpBarHeight - 4);
        
        // Bordure noire
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(hpBarX + 2, hpBarY + 2, hpBarWidth, hpBarHeight);
        
        // Texte HP (style Pokémon)
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`CHEVALIER`, hpBarX + 6, hpBarY - 18);
        ctx.fillText(`HP: ${Math.floor(this.game.playerData.hp)}/${Math.floor(this.game.playerData.maxHp)}`, hpBarX + 6, hpBarY + 8);
    }
    
    renderBattleUI(ctx) {
        if (this.battleState === 'game_over' || this.battleState === 'victory') {
            return;
        }
        
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
            ctx.fillText(`BOSS: ${currentPhrase.text}`, dialogX + 20, dialogY + 20);
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
    
    renderVictory(ctx) {
        // Écran noir (victoire)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
