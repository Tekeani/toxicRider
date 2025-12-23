// Protection contre le chargement multiple
if (window._gameScriptLoaded) {
    console.error('❌ game.js déjà chargé ! Arrêt pour éviter les doublons.');
    throw new Error('Script déjà chargé');
}
window._gameScriptLoaded = true;

class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas avec l'id "${canvasId}" non trouvé`);
        }
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = 1024;
        this.canvas.height = 768;
        
        this.currentPhase = null;
        this.phaseIndex = 0;
        this.phases = [];
        
        // Données du joueur persistantes
        this.playerData = {
            hp: PLAYER_CONFIG.INITIAL_HP,
            maxHp: PLAYER_CONFIG.INITIAL_HP,
            mana: PLAYER_CONFIG.INITIAL_MANA,
            maxMana: PLAYER_CONFIG.INITIAL_MANA,
            strength: PLAYER_CONFIG.INITIAL_STRENGTH,
            toxicity: PLAYER_CONFIG.INITIAL_TOXICITY,
            endurance: PLAYER_CONFIG.INITIAL_ENDURANCE
        };
        
        this.gameLoopRunning = false;
        this.animationFrameId = null;
        this.keys = {};
        this.isPaused = false;
        this.setupInput();
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Gérer la pause (touche p)
            if (e.key === 'p' || e.key === 'P') {
                e.preventDefault();
                this.togglePause();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        console.log(this.isPaused ? '⏸️ Pause activée' : '▶️ Pause désactivée');
    }

    async init() {
        if (this.gameLoopRunning) {
            console.warn('Game loop déjà en cours');
            return;
        }

        // Initialiser les phases
        this.phases = [
            new Phase0_Cinematic(this),
            new Phase1_Roguelike(this),
            new Phase2_Riddle(this),
            new Phase3_Boss(this),
            new Phase4_Race(this)
        ];

        // Initialiser la première phase
        this.phaseIndex = 0;
        this.currentPhase = this.phases[this.phaseIndex];
        
        // ❌ PAS de await ici - ne pas bloquer la boucle de jeu
        this.currentPhase.init();

        // ✅ La boucle démarre immédiatement
        this.startGameLoop();
    }

    startGameLoop() {
        if (this.gameLoopRunning) {
            console.warn('⚠️ Game loop DÉJÀ en cours ! Tentative de démarrage ignorée.');
            return;
        }

        console.log('🎮 Démarrage de la game loop');
        this.gameLoopRunning = true;
        let lastTime = performance.now();

        const gameLoop = (time) => {
            if (!this.gameLoopRunning) {
                return;
            }
            
            // COMPTEUR GLOBAL
            if (!window._gameLoopCount) window._gameLoopCount = 0;
            window._gameLoopCount++;
            
            if (window._gameLoopCount % 60 === 0) {
                console.log('🔢 GameLoop iteration:', window._gameLoopCount);
            }

            const deltaTime = (time - lastTime) / 1000;
            lastTime = time;

            // LOG COMBIEN DE FOIS ON APPELLE RENDER
            const renderCountBefore = this.currentPhase?._renderCount || 0;

            // Mise à jour (seulement si pas en pause)
            if (this.currentPhase && !this.isPaused) {
                this.currentPhase.update(deltaTime, this.keys);
            }

            // Rendu - FORCER 1 SEUL APPEL
            if (this.currentPhase && !this._rendering) {
                this._rendering = true;
                this.currentPhase.render(this.ctx);
                this._rendering = false;
            }
            
            const renderCountAfter = this.currentPhase?._renderCount || 0;
            const renderCallsThisFrame = renderCountAfter - renderCountBefore;
            
            if (renderCallsThisFrame > 1) {
                console.error('❌ PROBLÈME: render() appelé', renderCallsThisFrame, 'fois dans UNE SEULE frame !');
            }

            // Mise à jour de l'UI
            this.updateUI();
            
            // Rendu de la pause et du récapitulatif des contrôles (après le rendu de la phase)
            this.renderGlobalUI();

            this.animationFrameId = requestAnimationFrame(gameLoop);
        };

        gameLoop(performance.now());
    }

    stopGameLoop() {
        this.gameLoopRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    nextPhase() {
        console.log('🔄 Transition de phase - phaseIndex:', this.phaseIndex);
        this.phaseIndex++;
        if (this.phaseIndex < this.phases.length) {
            console.log('✅ Passage à la phase', this.phaseIndex, '- Type:', this.phases[this.phaseIndex].constructor.name);
            this.currentPhase = this.phases[this.phaseIndex];
            this.currentPhase.init().then(() => {
                console.log('✅ Phase', this.phaseIndex, 'initialisée avec succès');
            }).catch(err => {
                console.error('❌ Erreur lors de l\'initialisation de la phase', this.phaseIndex, ':', err);
            });
        } else {
            console.log('Toutes les phases sont terminées');
            // Fin du jeu ou retour au menu
        }
    }

    updateUI() {
        const hpBar = document.getElementById('hp-bar');
        const tpBar = document.getElementById('tp-bar');
        const hpText = document.getElementById('hp-text');
        const tpText = document.getElementById('tp-text');

        if (hpBar) {
            const hpPercent = (this.playerData.hp / this.playerData.maxHp) * 100;
            hpBar.style.width = `${hpPercent}%`;
        }

        if (hpText) {
            hpText.textContent = `${Math.floor(this.playerData.hp)}/${Math.floor(this.playerData.maxHp)}`;
        }

        if (tpBar) {
            const tpPercent = (this.playerData.mana / this.playerData.maxMana) * 100;
            tpBar.style.width = `${tpPercent}%`;
        }

        if (tpText) {
            tpText.textContent = `${Math.floor(this.playerData.mana)}/${Math.floor(this.playerData.maxMana)}`;
        }
    }
    
    renderGlobalUI() {
        const ctx = this.ctx;
        
        // Rendu de la pause (si active) - en premier pour le fond
        if (this.isPaused) {
            // Fond semi-transparent (comme Game Over)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Texte "Pause" centré
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 64px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Pause', this.canvas.width / 2, this.canvas.height / 2);
        }
        
        // Rendu du récapitulatif des contrôles (petit cadre discret en haut à droite)
        // Toujours visible, même pendant la pause
        this.renderControlsRecap(ctx);
    }
    
    renderControlsRecap(ctx) {
        // Petit cadre discret en haut à droite
        const padding = 10;
        const lineHeight = 24;
        const fontSize = 13;
        const keyWidth = 30;
        const keyHeight = 20;
        const keySpacing = 8; // Espace entre les touches et le texte
        
        const controls = [
            { keys: ['E', 'Entrée'], text: 'Coup d\'épée' },
            { keys: ['A', '!'], text: 'Insulter' },
            { keys: ['P'], text: 'Pause' }
        ];
        
        // Calculer la largeur du cadre
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'left';
        let maxTextWidth = 0;
        controls.forEach(control => {
            const width = ctx.measureText(control.text).width;
            if (width > maxTextWidth) maxTextWidth = width;
        });
        
        // Largeur totale : touches (E/Entrée peut avoir 2 touches) + espace + texte
        const maxKeysPerLine = Math.max(...controls.map(c => c.keys.length));
        const keysTotalWidth = maxKeysPerLine * keyWidth + (maxKeysPerLine - 1) * 4; // 4px entre les touches
        const boxWidth = keysTotalWidth + keySpacing + maxTextWidth + padding * 2;
        const boxHeight = controls.length * lineHeight + padding * 2;
        const boxX = this.canvas.width - boxWidth - 10; // 10px de marge depuis le bord droit
        const boxY = 10; // 10px de marge depuis le haut
        
        // Fond du cadre (semi-transparent, discret)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        
        // Bordure fine
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        // Dessiner les contrôles avec touches
        ctx.textBaseline = 'middle';
        controls.forEach((control, index) => {
            const yPos = boxY + padding + index * lineHeight + keyHeight / 2;
            let xPos = boxX + padding;
            
            // Dessiner les touches de clavier
            control.keys.forEach((key, keyIndex) => {
                // Fond de la touche (gris clair)
                ctx.fillStyle = 'rgba(240, 240, 240, 0.9)';
                ctx.fillRect(xPos, yPos - keyHeight / 2, keyWidth, keyHeight);
                
                // Bordure de la touche (gris foncé)
                ctx.strokeStyle = 'rgba(180, 180, 180, 0.8)';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(xPos, yPos - keyHeight / 2, keyWidth, keyHeight);
                
                // Ombre en bas à droite (pour effet 3D)
                ctx.fillStyle = 'rgba(150, 150, 150, 0.5)';
                ctx.fillRect(xPos + 1, yPos - keyHeight / 2 + keyHeight - 2, keyWidth - 2, 2);
                ctx.fillRect(xPos + keyWidth - 2, yPos - keyHeight / 2 + 1, 2, keyHeight - 2);
                
                // Texte de la touche
                ctx.fillStyle = 'rgba(50, 50, 50, 0.9)';
                ctx.font = `bold ${key === 'Entrée' ? 10 : 12}px Arial`;
                ctx.textAlign = 'center';
                
                // Gérer le texte "Entrée" qui est plus long
                let displayKey = key;
                if (key === 'Entrée') {
                    displayKey = 'Entr.';
                }
                
                ctx.fillText(displayKey, xPos + keyWidth / 2, yPos);
                
                xPos += keyWidth + 4; // 4px entre les touches multiples
            });
            
            // Texte descriptif
            xPos += keySpacing;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = `${fontSize}px Arial`;
            ctx.textAlign = 'left';
            ctx.fillText(control.text, xPos, yPos);
        });
    }
}

// Initialisation globale
let game = null;

window.addEventListener('DOMContentLoaded', () => {
    // SUPPRESSION de la protection qui bloque
    console.log('🎮 Initialisation du jeu...');
    
    game = new Game('gameCanvas');
    game.init().catch(err => {
        console.error('Erreur lors de l\'initialisation du jeu:', err);
    });
});

