import { InputManager } from './InputManager';
import { Renderer } from './Renderer';
import { GameLoop } from './GameLoop';
import type { PlayerData } from '../types';
import { PLAYER_CONFIG } from '../config/constants';
import type { Scene } from '../scenes/Scene';

export class Game {
    private renderer: Renderer;
    private inputManager: InputManager;
    private gameLoop: GameLoop;
    private currentScene: Scene | null = null;
    private scenes: Scene[] = [];
    private playerData: PlayerData;
    private isPaused: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        this.renderer = new Renderer(canvas);
        this.inputManager = new InputManager();
        this.playerData = {
            hp: PLAYER_CONFIG.INITIAL_HP,
            maxHp: PLAYER_CONFIG.INITIAL_HP,
            mana: PLAYER_CONFIG.INITIAL_MANA,
            maxMana: PLAYER_CONFIG.INITIAL_MANA,
            strength: PLAYER_CONFIG.INITIAL_STRENGTH,
            toxicity: PLAYER_CONFIG.INITIAL_TOXICITY,
            endurance: PLAYER_CONFIG.INITIAL_ENDURANCE
        };
        this.gameLoop = new GameLoop(
            (deltaTime) => this.update(deltaTime),
            () => this.render()
        );
        this.setupInput();
    }

    private setupInput(): void {
        this.inputManager.onKeyDown('p', () => {
            this.togglePause();
        });
        this.inputManager.onKeyDown('P', () => {
            this.togglePause();
        });
    }

    togglePause(): void {
        this.isPaused = !this.isPaused;
    }

    async init(scenes: Scene[]): Promise<void> {
        this.scenes = scenes;
        if (this.scenes.length > 0) {
            this.currentScene = this.scenes[0];
            await this.currentScene.init();
        }
        this.gameLoop.start();
    }

    private update(deltaTime: number): void {
        if (!this.currentScene || this.isPaused) return;
        const keys = this.inputManager.getKeys();
        this.currentScene.update(deltaTime, keys);
        this.updateUI();
    }

    private render(): void {
        this.renderer.clear();
        if (this.currentScene) {
            this.currentScene.render(this.renderer);
        }
        if (this.isPaused) {
            this.renderPause();
        }
    }

    private renderPause(): void {
        const size = this.renderer.getBaseSize();
        this.renderer.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.renderer.fillRect(0, 0, size.width, size.height);
        this.renderer.fillStyle = '#ffffff';
        this.renderer.font = 'bold 64px Arial';
        this.renderer.textAlign = 'center';
        this.renderer.textBaseline = 'middle';
        this.renderer.fillText('Pause', size.width / 2, size.height / 2);
    }

    private updateUI(): void {
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

    setScene(sceneIndex: number): void {
        if (sceneIndex < 0 || sceneIndex >= this.scenes.length) return;
        if (this.currentScene) {
            this.currentScene.cleanup();
        }
        this.currentScene = this.scenes[sceneIndex];
        this.currentScene.init();
    }

    nextScene(): void {
        const currentIndex = this.scenes.indexOf(this.currentScene!);
        if (currentIndex >= 0 && currentIndex < this.scenes.length - 1) {
            this.setScene(currentIndex + 1);
        }
    }

    getRenderer(): Renderer {
        return this.renderer;
    }

    getInputManager(): InputManager {
        return this.inputManager;
    }

    getPlayerData(): PlayerData {
        return { ...this.playerData };
    }

    setPlayerData(data: Partial<PlayerData>): void {
        this.playerData = { ...this.playerData, ...data };
    }

    getCurrentScene(): Scene | null {
        return this.currentScene;
    }

    stop(): void {
        this.gameLoop.stop();
        if (this.currentScene) {
            this.currentScene.cleanup();
        }
        this.inputManager.cleanup();
    }
}
