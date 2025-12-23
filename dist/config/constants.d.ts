export declare const PLAYER_CONFIG: {
    SPEED: number;
    INITIAL_HP: number;
    INITIAL_MANA: number;
    INITIAL_TOXICITY: number;
    INITIAL_STRENGTH: number;
    INITIAL_ENDURANCE: number;
};
export declare const ENEMY_TYPES: {
    readonly WEAK: {
        readonly hp: 20;
        readonly speed: 1.5;
        readonly damage: 5;
    };
    readonly STRONG: {
        readonly hp: 30;
        readonly speed: 2;
        readonly damage: 5;
    };
    readonly BALANCED: {
        readonly hp: 40;
        readonly speed: 1.8;
        readonly damage: 5;
    };
};
export declare const WAVES_CONFIG: {
    readonly WAVE_1: {
        readonly type: "WEAK";
        readonly count: 3;
    };
    readonly WAVE_2: {
        readonly type: "STRONG";
        readonly count: 4;
    };
    readonly WAVE_3: {
        readonly type: "BALANCED";
        readonly count: 5;
    };
};
export declare const COLORS: {
    readonly PLAYER: "#00ff00";
    readonly ENEMY: "#ff0000";
    readonly NPC: "#ffff00";
    readonly BACKGROUND: "#87CEEB";
};
export declare const CANVAS_CONFIG: {
    BASE_WIDTH: number;
    BASE_HEIGHT: number;
    MIN_WIDTH: number;
    MIN_HEIGHT: number;
    ASPECT_RATIO: number;
};
//# sourceMappingURL=constants.d.ts.map