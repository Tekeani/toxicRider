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
            "Bienvenue, chevalier...",
            "Pour entrer dans ce château, tu dois résoudre mon énigme.",
            "Es-tu prêt ?"
        ];
        this.dialogueArrowBlinkTimer = 0;
        this.dialogueCooldown = 0.3;
        this.waitingForDialogueInput = false;
        
        // Décor - Château imposant comme un donjon
        this.castleX = this.canvas.width / 2 - 200; // Centre du château (agrandi)
        this.castleY = 20; // En haut de l'écran
        this.castleWidth = 400; // Plus large et imposant
        this.castleHeight = 280; // Plus haut, comme un donjon
        
        // Input handlers
        this.keydownHandler = null;
        this._interactPressed = false; // Flag pour éviter les déclenchements multiples
    }
    
    async init() {
        console.log('🎮 Phase2_Riddle.init() appelé');
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Initialiser le joueur (même position que dans Phase1)
        this.player = new Player(width / 2 - 80, height / 2 + 100, this.game);
        console.log('✅ Joueur créé à la position:', this.player.x, this.player.y);
        
        // Initialiser le PNJ (sheepman) en bas du château, accessible
        // Positionner le NPC en bas du château pour qu'il soit accessible
        const npcX = this.castleX + this.castleWidth / 2 - 30; // Centré devant les portes
        const npcY = this.castleY + this.castleHeight + 30; // En bas du château, accessible
        this.npc = new NPC(npcX, npcY, this.game);
        // Définir la taille pour le sheepman (48x64)
        this.npc.width = 96; // 48 * 2
        this.npc.height = 128; // 64 * 2
        console.log('✅ NPC créé à la position:', npcX, npcY);
        // Empêcher le chargement du sprite par défaut du NPC
        this.npc._loading = true;
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
            // Empêcher le chargement du sprite par défaut
            this.npc._loading = true;
            this.npc.spriteLoaded = false;
            
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
                    console.log('✅ Sprite sheepman chargé');
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
            
            // Gérer le dialogue
            if (this.dialogueActive && this.waitingForDialogueInput) {
                if ((e.key === 'Enter' || e.key === 'e' || e.key === 'E') && !this._interactPressed) {
                    e.preventDefault();
                    this._interactPressed = true;
                    this.dialogueCooldown = 0.3;
                    this.waitingForDialogueInput = false;
                    
                    // Passer au dialogue suivant
                    this.dialogueIndex++;
                    if (this.dialogueIndex >= this.dialogueLines.length) {
                        // Dialogue terminé
                        this.dialogueActive = false;
                        this.dialogueIndex = 0;
                        console.log('✅ Dialogue terminé');
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
            // Réinitialiser le flag quand la touche est relâchée
            if (e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
                this._interactPressed = false;
            }
        };
        
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
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
    
    cleanup() {
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
        }
        if (this.keyupHandler) {
            document.removeEventListener('keyup', this.keyupHandler);
        }
    }
    
    // Vérifier si une position est dans le château (collision)
    isInCastle(x, y, width, height) {
        return x < this.castleX + this.castleWidth &&
               x + width > this.castleX &&
               y < this.castleY + this.castleHeight &&
               y + height > this.castleY;
    }
    
    update(deltaTime, keys) {
        // Gérer la transition
        if (this.transitionActive && !this.transitionComplete) {
            this.transitionArrowBlinkTimer += deltaTime;
            // Activer l'attente d'input après un court délai
            if (!this.waitingForInput) {
                this.waitingForInput = true;
            }
            return;
        }
        
        // Gérer le dialogue
        if (this.dialogueActive) {
            this.dialogueArrowBlinkTimer += deltaTime;
            this.dialogueCooldown -= deltaTime;
            if (this.dialogueCooldown <= 0) {
                this.waitingForDialogueInput = true;
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
            
            // Mettre à jour le joueur
            this.player.update(keys, deltaTime);
            
            // Vérifier si le joueur tente de rentrer dans le château
            if (this.isInCastle(this.player.x, this.player.y, this.player.width, this.player.height)) {
                // Empêcher le mouvement en restaurant l'ancienne position
                this.player.x = oldX;
                this.player.y = oldY;
            }
        }
        
        // Mise à jour du PNJ
        if (this.npc) {
            if (this.npc.currentAnimation) {
                this.npc.currentAnimation.update(deltaTime);
            }
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
        
        // ========== PNJ (vieil homme) ==========
        if (this.npc) {
            this.npc.render(ctx);
        }
        
        // ========== JOUEUR ==========
        if (this.player) {
            this.player.render(ctx);
        }
        
        // ========== DIALOGUE (rendu en dernier) ==========
        if (this.dialogueActive) {
            // Réinitialiser le contexte canvas
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            ctx.imageSmoothingEnabled = true;
            
            // Dimensions de la fenêtre de dialogue (même style que Phase0_Cinematic)
            const dialogHeight = Math.min(120, Math.max(80, this.canvas.height * 0.15));
            const dialogWidth = Math.min(800, Math.max(500, this.canvas.width * 0.75));
            const dialogX = (this.canvas.width - dialogWidth) / 2;
            const dialogY = this.canvas.height * 0.5; // 50% de la hauteur (au milieu de l'écran)
            
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
            
            // Texte du dialogue (blanc)
            if (this.dialogueIndex < this.dialogueLines.length) {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 18px Arial';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                const text = this.dialogueLines[this.dialogueIndex];
                const lines = this.wrapText(ctx, text, dialogWidth - 60);
                lines.forEach((line, i) => {
                    ctx.fillText(line, dialogX + 20, dialogY + 20 + (i * 24));
                });
            }
            
            // Flèche clignotante vers le bas (style RPG)
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

