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
            return;
        }

        this.gameLoopRunning = true;
        let lastTime = performance.now();

        const gameLoop = (time) => {
            if (!this.gameLoopRunning) {
                return;
            }

            const deltaTime = (time - lastTime) / 1000;
            lastTime = time;

            // Mise à jour
            if (this.currentPhase) {
                this.currentPhase.update(deltaTime, this.keys);
            }

            // Rendu
            if (this.currentPhase) {
                this.currentPhase.render(this.ctx);
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
        this.phaseIndex++;
        if (this.phaseIndex < this.phases.length) {
            this.currentPhase = this.phases[this.phaseIndex];
            this.currentPhase.init();
        } else {
            console.log('Toutes les phases sont terminées');
            // Fin du jeu ou retour au menu
        }
    }

    updateUI() {
        const hpBar = document.getElementById('hp-bar');
        const tpBar = document.getElementById('tp-bar');

        if (hpBar) {
            const hpPercent = (this.playerData.hp / this.playerData.maxHp) * 100;
            hpBar.style.width = `${hpPercent}%`;
        }

        if (tpBar) {
            const tpPercent = (this.playerData.mana / this.playerData.maxMana) * 100;
            tpBar.style.width = `${tpPercent}%`;
        }
    }
}

// Initialisation globale
let game = null;

window.addEventListener('DOMContentLoaded', () => {
    if (window._gameScriptLoaded) {
        console.warn('Game déjà initialisé');
        return;
    }
    window._gameScriptLoaded = true;

    game = new Game('gameCanvas');
    game.init().catch(err => {
        console.error('Erreur lors de l\'initialisation du jeu:', err);
    });
});

