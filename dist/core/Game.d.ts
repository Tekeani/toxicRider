import { InputManager } from './InputManager';
import { Renderer } from './Renderer';
import type { PlayerData } from '../types';
import type { Scene } from '../scenes/Scene';
export declare class Game {
    private renderer;
    private inputManager;
    private gameLoop;
    private currentScene;
    private scenes;
    private playerData;
    private isPaused;
    constructor(canvas: HTMLCanvasElement);
    private setupInput;
    togglePause(): void;
    init(scenes: Scene[]): Promise<void>;
    private update;
    private render;
    private renderPause;
    private updateUI;
    setScene(sceneIndex: number): void;
    nextScene(): void;
    getRenderer(): Renderer;
    getInputManager(): InputManager;
    getPlayerData(): PlayerData;
    setPlayerData(data: Partial<PlayerData>): void;
    getCurrentScene(): Scene | null;
    stop(): void;
}
//# sourceMappingURL=Game.d.ts.map