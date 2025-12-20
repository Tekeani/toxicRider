// Configuration du joueur
const PLAYER_CONFIG = {
    SPEED: 3,
    INITIAL_HP: 50,
    INITIAL_MANA: 30,
    INITIAL_TOXICITY: 30,
    INITIAL_STRENGTH: 10,
    INITIAL_ENDURANCE: 60
};

// Types d'ennemis
const ENEMY_TYPES = {
    WEAK: {
        hp: 20,
        speed: 1.5,
        damage: 5
    },
    STRONG: {
        hp: 30,
        speed: 2,
        damage: 5
    },
    BALANCED: {
        hp: 40,
        speed: 1.8,
        damage: 5
    }
};

// Configuration des vagues
const WAVES_CONFIG = {
    WAVE_1: {
        type: 'WEAK',
        count: 3
    },
    WAVE_2: {
        type: 'STRONG',
        count: 4
    },
    WAVE_3: {
        type: 'BALANCED',
        count: 5
    }
};

// Couleurs
const COLORS = {
    PLAYER: '#00ff00',
    ENEMY: '#ff0000',
    NPC: '#ffff00',
    BACKGROUND: '#87CEEB'
};



