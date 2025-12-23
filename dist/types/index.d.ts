export interface PlayerData {
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
    strength: number;
    toxicity: number;
    endurance: number;
}
export interface EnemyConfig {
    hp: number;
    speed: number;
    damage: number;
}
export interface WaveConfig {
    type: keyof typeof import('../config/constants').ENEMY_TYPES;
    count: number;
}
export interface Size {
    width: number;
    height: number;
}
export interface Position {
    x: number;
    y: number;
}
export interface Rectangle extends Position, Size {
}
export interface Keys {
    [key: string]: boolean;
}
export type Direction = 'left' | 'right' | 'up' | 'down';
//# sourceMappingURL=index.d.ts.map