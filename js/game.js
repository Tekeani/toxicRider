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
        this.setupInput();
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    async init() {
        if (this.gameLoopRunning) {
            console.warn('Game loop déjà en cours');
            return;
        }

        // Initialiser les phases
        this.phases = [
            new Phase0_Cinematic(this),
            new Phase1_Roguelike(this)
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

            // Mise à jour
            if (this.currentPhase) {
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

