export const PLAYER_CONFIG = {
    SPEED: 3,
    INITIAL_HP: 50,
    INITIAL_MANA: 30,
    INITIAL_TOXICITY: 30,
    INITIAL_STRENGTH: 10,
    INITIAL_ENDURANCE: 60
};

export const ENEMY_TYPES = {
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
} as const;

export const WAVES_CONFIG = {
    WAVE_1: {
        type: 'WEAK' as const,
        count: 3
    },
    WAVE_2: {
        type: 'STRONG' as const,
        count: 4
    },
    WAVE_3: {
        type: 'BALANCED' as const,
        count: 5
    }
} as const;

export const COLORS = {
    PLAYER: '#00ff00',
    ENEMY: '#ff0000',
    NPC: '#ffff00',
    BACKGROUND: '#87CEEB'
} as const;

export const CANVAS_CONFIG = {
    BASE_WIDTH: 1024,
    BASE_HEIGHT: 768,
    MIN_WIDTH: 640,
    MIN_HEIGHT: 480,
    ASPECT_RATIO: 1024 / 768
};

