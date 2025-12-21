class Phase3_Boss {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        this.ctx = game.ctx;
    }
    
    async init() {
        console.log('🎮 Phase3_Boss.init() appelé');
        console.log('✅ Phase3_Boss initialisée (écran noir temporaire)');
    }
    
    update(deltaTime, keys) {
        // Phase temporaire - écran noir
    }
    
    render(ctx) {
        // Fond noir
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Texte temporaire
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Phase Boss', this.canvas.width / 2, this.canvas.height / 2);
        ctx.font = '24px Arial';
        ctx.fillText('(À venir)', this.canvas.width / 2, this.canvas.height / 2 + 60);
    }
    
    cleanup() {
        // Nettoyage si nécessaire
    }
}

