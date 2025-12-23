import { Scene } from './Scene';
import type { Renderer } from '../core/Renderer';
import type { Keys } from '../types';
import type { Game } from '../core/Game';
export declare class CinematicScene extends Scene {
    private game;
    private player;
    private npc;
    private isComplete;
    private state;
    private logoY;
    private logoSpeed;
    private logoVisible;
    private knightAlpha;
    private dialogueIndex;
    private dialogueLines;
    private waitingForInput;
    private arrowBlinkTimer;
    private dialogueCooldown;
    private renderingSystem;
    private cleanupInput;
    constructor(game: Game);
    private setupInput;
    init(): Promise<void>;
    private nextDialogue;
    update(deltaTime: number, keys: Keys): void;
    render(renderer: Renderer): void;
    private renderBackground;
    private renderTrees;
    private renderRocks;
    private renderLogo;
    private renderDialogue;
    cleanup(): void;
}
//# sourceMappingURL=CinematicScene.d.ts.map