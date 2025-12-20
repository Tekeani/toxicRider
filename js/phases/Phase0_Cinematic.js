class Phase0_Cinematic {
    constructor(game) {
        console.error('PHASE0 CINEMATIC LOADED - VERSION UNIQUE');
        this.game = game;
        this.canvas = game.canvas;
        this.ctx = game.ctx;
        this.player = null;
        this.npc = null;
        this.isComplete = false;
        
        // État de la cinématique
        this.state = 'logo'; // 'logo', 'knight_appear', 'cat_coming', 'dialogue', 'cat_leaving'
        
        // Logo : traverse l'écran de haut en bas
        this.logoY = -100;
        this.logoSpeed = 90; // pixels par seconde (basé sur le temps)
        this.logoVisible = true; // Visibilité du logo (séparé de l'état)
        
        // Chevalier : apparaît après le logo
        this.knightAlpha = 0;
        this.knightFadeSpeed = 4.8; // par seconde (équivalent à 0.08 par frame à 60 FPS)
        this.dialogueIndex = 0;
        this.dialogueLines = [
            "Miaou ! Chevalier Damas ! Tu es là !",
            "Tu dois te dépêcher ! Le puissant Amar a enlevé ta bien-aimée et l'a enfermée dans son donjon !",
            "Va vite la libérer ! Miaou !"
        ];
        this.waitingForInput = false;
        this.keys = {};
        this.arrowBlinkTimer = 0; // Timer pour la flèche clignotante
        this.dialogueCooldown = 0; // Cooldown pour éviter les timeouts multiples
        this.renderCount = 0; // Compteur pour voir combien de fois render est appelé
        this.setupInput();
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Pour avancer dans le dialogue
            if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter') && this.state === 'dialogue' && this.waitingForInput) {
                this.nextDialogue();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    async init() {
        // S'assurer qu'on ne crée qu'un seul NPC
        if (this.npc) {
            return; // Déjà initialisé
        }

        const width = this.canvas.width;
        const height = this.canvas.height;

        // Le chevalier apparaît au milieu de l'écran, plus haut qu'avant
        if (!this.player) {
            this.player = new Player(width / 2 - 80, height / 2 - 150, this.game);
        }
        
        // Le chat commence hors écran à gauche, positionné pour ne pas croiser le chevalier
        // Le chevalier est à height / 2 - 150, donc le chat part plus bas
        this.npc = new NPC(-50, height / 2 - 50, this.game);
    }

    nextDialogue() {
        this.dialogueIndex++;
        this.waitingForInput = false;
        this.dialogueCooldown = 0.3; // Cooldown de 0.3 secondes avant de pouvoir continuer
        
        console.log('📝 Dialogue suivant, index:', this.dialogueIndex, '/', this.dialogueLines.length);
        
        if (this.dialogueIndex >= this.dialogueLines.length) {
            // Fin du dialogue, le chat repart vers la droite
            // Il reste à la même hauteur (height/2 - 50) pour ne pas croiser le chevalier
            console.log('✅ Dialogue terminé, le chat repart');
            this.state = 'cat_leaving';
            const width = this.canvas.width;
            this.npc.setTarget(width + 50, this.canvas.height / 2 - 50);
        }
    }

    update(deltaTime, keys) {
        if (this.isComplete) return;

        // LOGO : descend jusqu'au bord bas de l'écran
        if (this.state === 'logo') {
            this.logoY += this.logoSpeed * deltaTime;

            // Dès que le titre atteint le bord bas de l'écran, le chevalier commence à apparaître
            if (this.logoY >= this.canvas.height) {
                this.logoVisible = false;
                this.state = 'knight_appear';
                this.knightAlpha = 0;
            }
        }

        // CHEVALIER : apparition avec fade-in
        if (this.state === 'knight_appear') {
            this.knightAlpha += 5 * deltaTime;
            if (this.knightAlpha >= 1) {
                this.knightAlpha = 1;
                this.state = 'cat_coming';
                // Le chat s'arrête à gauche du chevalier, sans le croiser
                // Le chevalier est à width/2 - 80, donc le chat s'arrête à width/2 - 200
                // Le chevalier est à height/2 - 150, donc le chat reste à height/2 - 50 (plus bas)
                this.npc.setTarget(
                    this.canvas.width / 2 - 200,
                    this.canvas.height / 2 - 50
                );
            }
        }

        // CHAT
        if (this.state === 'cat_coming') {
            if (!this.npc) {
                console.error('NPC non initialisé dans cat_coming');
                return;
            }
            this.npc.update(deltaTime);
            const distance = Math.sqrt(
                Math.pow(this.npc.targetX - this.npc.x, 2) + 
                Math.pow(this.npc.targetY - this.npc.y, 2)
            );
            console.log('NPC position:', this.npc.x, this.npc.y, 'Target:', this.npc.targetX, this.npc.targetY, 'Distance:', distance, 'hasReachedTarget:', this.npc.hasReachedTarget);
            
            if (this.npc.hasReachedTarget) {
                console.log('PASSAGE EN DIALOGUE');
                this.state = 'dialogue';
                this.dialogueIndex = 0;
                this.waitingForInput = true;
                this.arrowBlinkTimer = 0;
                this.dialogueCooldown = 0.3;
                console.log('Dialogue démarré, index:', this.dialogueIndex);
            }
        }

        else if (this.state === 'dialogue') {
            // Timer pour la flèche clignotante
            this.arrowBlinkTimer += deltaTime;
            // Gestion du cooldown pour waitingForInput (évite les timeouts multiples)
            this.dialogueCooldown -= deltaTime;
            if (this.dialogueCooldown <= 0) {
                this.waitingForInput = true;
            }
            return; // ⛔ STOP tout le reste pendant le dialogue
        }

        else if (this.state === 'cat_leaving') {
            // Le chat continue à se déplacer vers la droite jusqu'à sortir de l'écran
            // Si le chat a atteint sa cible mais n'est pas encore sorti, on le force à continuer
            if (this.npc.hasReachedTarget && this.npc.x <= this.canvas.width + 50) {
                // Réinitialiser hasReachedTarget pour forcer le mouvement
                this.npc.hasReachedTarget = false;
                // S'assurer que la cible est bien hors écran
                this.npc.setTarget(this.canvas.width + 100, this.npc.y);
            }
            
            this.npc.update(deltaTime);
            
            // Log pour déboguer (une fois par seconde environ)
            if (!this._leavingLogTimer) this._leavingLogTimer = 0;
            this._leavingLogTimer += deltaTime;
            if (this._leavingLogTimer >= 1) {
                console.log('🐱 Chat en train de partir - Position X:', Math.round(this.npc.x), '/', this.canvas.width + 50, 'hasReachedTarget:', this.npc.hasReachedTarget);
                this._leavingLogTimer = 0;
            }
            
            // Vérifier si le chat est sorti de l'écran
            if (this.npc.x > this.canvas.width + 50) {
                console.log('✅ Chat parti, transition vers Phase1_Roguelike');
                this.isComplete = true;
                
                // CRITIQUE : NETTOYER TOUT
                this.player = null;  // Nettoyer la référence au joueur
                this.npc = null;     // Nettoyer la référence au NPC
                
                this.game.nextPhase();
            }
        }

        // joueur toujours mis à jour
        if (this.player) {
            this.player.update({});
        }
    }


    render(ctx) {
        // PROTECTION : Ne rien rendre si la phase est terminée
        if (this.isComplete) {
            return;
        }
        
        // Nettoyer le canvas en premier
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Désactiver l'anti-aliasing pour un rendu pixel art
        ctx.imageSmoothingEnabled = false;
        
        // Sol en damier avec 2 verts seulement
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
            // Tronc marron (rectangle vertical) - TRÈS VISIBLE
            ctx.fillStyle = '#8B4513';
            const trunkWidth = 40;
            const trunkHeight = 80;
            ctx.fillRect(x - trunkWidth/2, y - trunkHeight, trunkWidth, trunkHeight);
            
            // Feuillage vert (carrés collés au-dessus du tronc) - TRÈS VISIBLE
            ctx.fillStyle = '#006400'; // Vert foncé différent du sol
            // Carré du bas (le plus large)
            ctx.fillRect(x - 40, y - trunkHeight - 40, 80, 40);
            // Carré du milieu
            ctx.fillRect(x - 30, y - trunkHeight - 80, 60, 40);
            // Carré du haut (le plus petit)
            ctx.fillRect(x - 20, y - trunkHeight - 110, 40, 30);
        };
        
        // Positionner les arbres dispersés partout sur l'écran (vue du dessus)
        // y = position basse où le tronc touche le sol
        // L'arbre fait environ 150 pixels de haut, donc il faut laisser de la place en haut
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
        
        // Réactiver l'anti-aliasing pour le reste
        // ctx.imageSmoothingEnabled = true;  // ← COMMENTÉ POUR TEST

        // FONCTION 1 : Rendu du logo (visuel)
        // RENDER — LOGO
        if (this.state === 'logo' && this.logoVisible) {
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 64px "Courier New", monospace';
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;

            ctx.strokeText('TOXIC RIDER', this.canvas.width / 2, this.logoY);
            ctx.fillText('TOXIC RIDER', this.canvas.width / 2, this.logoY);
            ctx.restore();
        }

        // FONCTION 2 : Rendu du chevalier (visuel) - Affiché pendant le dialogue aussi
        if (this.player && this.state !== 'logo') {
            ctx.save();
            ctx.globalAlpha = this.knightAlpha;
            this.player.render(ctx);
            ctx.restore();
        }

        // Rendu du NPC (affiché pendant le dialogue aussi)
        if (this.npc && (this.state === 'cat_coming' || this.state === 'dialogue' || this.state === 'cat_leaving')) {
            this.npc.render(ctx);
        }
        
        // Dialogue - Style RPG (Pokémon/Final Fantasy) - RENDU EN DERNIER ABSOLUMENT
        if (this.state === 'dialogue') {
            // Réinitialiser complètement le contexte canvas
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            ctx.imageSmoothingEnabled = true;
            
            // Dimensions de la fenêtre de dialogue - Responsive, positionnée pour être toujours visible
            const dialogHeight = Math.min(120, Math.max(80, this.canvas.height * 0.15)); // 15% de la hauteur, entre 80 et 120px
            const dialogWidth = Math.min(800, Math.max(500, this.canvas.width * 0.75)); // 75% de la largeur, entre 500 et 800px
            const dialogX = (this.canvas.width - dialogWidth) / 2; // Centré horizontalement
            const dialogY = this.canvas.height * 0.5; // 50% de la hauteur (au milieu de l'écran)
            
            console.log('🔴 DÉBUT RENDU DIALOGUE');
            console.log('Canvas:', this.canvas.width, 'x', this.canvas.height);
            console.log('Position dialogue:', dialogX, dialogY);
            console.log('Taille dialogue:', dialogWidth, dialogHeight);
            
            // Fond noir opaque pour la boîte de dialogue
            ctx.fillStyle = '#000000';
            ctx.fillRect(dialogX, dialogY, dialogWidth, dialogHeight);
            console.log('✅ Rectangle noir dessiné');
            
            // Bordure blanche épaisse (style RPG)
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.strokeRect(dialogX, dialogY, dialogWidth, dialogHeight);
            console.log('✅ Bordure blanche dessinée');
            
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
                console.log('✅ Texte dessiné:', text);
            }
            
            // Flèche clignotante vers le bas (style RPG)
            if (this.waitingForInput) {
                const arrowVisible = Math.floor(this.arrowBlinkTimer * 2) % 2 === 0;
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
            
            console.log('🔴 FIN RENDU DIALOGUE');
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

