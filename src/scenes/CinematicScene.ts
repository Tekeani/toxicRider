import { Scene } from './Scene';
import type { Renderer } from '../core/Renderer';
import type { Keys } from '../types';
import type { Game } from '../core/Game';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import { RenderingSystem } from '../systems/RenderingSystem';
import { wrapText } from '../utils/TextUtils';

type SceneState = 'logo' | 'knight_appear' | 'cat_coming' | 'dialogue' | 'cat_leaving';

export class CinematicScene extends Scene {
    private game: Game;
    private player: Player | null = null;
    private npc: NPC | null = null;
    private isComplete: boolean = false;
    private state: SceneState = 'logo';
    private logoY: number = -100;
    private logoSpeed: number = 90;
    private logoVisible: boolean = true;
    private knightAlpha: number = 0;
    private dialogueIndex: number = 0;
    private dialogueLines: string[] = [
        "Miaou ! Ah tu es là chevalier Damas ! Je te cherchais partout !",
        "La puissante Amar a enlevé ta bien-aimée et l'a enfermée dans son terrible donjon !",
        "Tu dois la libérer avant qu'il ne soit trop tard ! Bonne chance ! *hérisse ses poils de dos* pffft pffft !"
    ];
    private waitingForInput: boolean = false;
    private arrowBlinkTimer: number = 0;
    private dialogueCooldown: number = 0;
    private renderingSystem: RenderingSystem;
    private cleanupInput: (() => void)[] = [];

    constructor(game: Game) {
        super();
        this.game = game;
        this.renderingSystem = new RenderingSystem(game.getRenderer());
        this.setupInput();
    }

    private setupInput(): void {
        const cleanup1 = this.game.getInputManager().onKeyDown('e', () => {
            if (this.state === 'dialogue' && this.waitingForInput) {
                this.nextDialogue();
            }
        });
        const cleanup2 = this.game.getInputManager().onKeyDown('E', () => {
            if (this.state === 'dialogue' && this.waitingForInput) {
                this.nextDialogue();
            }
        });
        const cleanup3 = this.game.getInputManager().onKeyDown('Enter', () => {
            if (this.state === 'dialogue' && this.waitingForInput) {
                this.nextDialogue();
            }
        });
        this.cleanupInput.push(cleanup1, cleanup2, cleanup3);
    }

    async init(): Promise<void> {
        if (this.npc) return;

        const size = this.game.getRenderer().getBaseSize();
        if (!this.player) {
            this.player = new Player(size.width / 2 - 80, size.height / 2 - 150, this.game);
        }
        this.npc = new NPC(-50, size.height / 2 - 50, this.game);
    }

    private nextDialogue(): void {
        this.dialogueIndex++;
        this.waitingForInput = false;
        this.dialogueCooldown = 0.3;
        
        if (this.dialogueIndex >= this.dialogueLines.length) {
            this.state = 'cat_leaving';
            const size = this.game.getRenderer().getBaseSize();
            if (this.npc) {
                this.npc.setTarget(size.width + 50, size.height / 2 - 50);
            }
        }
    }

    update(deltaTime: number, keys: Keys): void {
        if (this.isComplete) return;

        const size = this.game.getRenderer().getBaseSize();

        if (this.state === 'logo') {
            this.logoY += this.logoSpeed * deltaTime;
            if (this.logoY >= size.height) {
                this.logoVisible = false;
                this.state = 'knight_appear';
                this.knightAlpha = 0;
            }
        }

        if (this.state === 'knight_appear') {
            this.knightAlpha += 5 * deltaTime;
            if (this.knightAlpha >= 1) {
                this.knightAlpha = 1;
                this.state = 'cat_coming';
                if (this.npc) {
                    this.npc.setTarget(size.width / 2 - 200, size.height / 2 - 50);
                }
            }
        }

        if (this.state === 'cat_coming' && this.npc) {
            this.npc.update(deltaTime);
            if (this.npc.hasReachedTarget) {
                this.state = 'dialogue';
                this.dialogueIndex = 0;
                this.waitingForInput = true;
                this.arrowBlinkTimer = 0;
                this.dialogueCooldown = 0.3;
            }
        } else if (this.state === 'dialogue') {
            this.arrowBlinkTimer += deltaTime;
            this.dialogueCooldown -= deltaTime;
            if (this.dialogueCooldown <= 0) {
                this.waitingForInput = true;
            }
            return;
        } else if (this.state === 'cat_leaving' && this.npc) {
            if (this.npc.hasReachedTarget && this.npc.x <= size.width + 50) {
                this.npc.hasReachedTarget = false;
                this.npc.setTarget(size.width + 100, this.npc.y);
            }
            this.npc.update(deltaTime);
            if (this.npc.x > size.width + 50) {
                this.isComplete = true;
                this.player = null;
                this.npc = null;
                this.game.nextScene();
            }
        }

        if (this.player) {
            this.player.update(deltaTime, {});
        }
    }

    render(renderer: Renderer): void {
        if (this.isComplete) return;

        const ctx = renderer.getContext();
        const size = renderer.getBaseSize();
        renderer.clear();

        this.renderBackground(renderer, size);

        if (this.state === 'logo' && this.logoVisible) {
            this.renderLogo(renderer, size);
        }

        if (this.player && this.state !== 'logo') {
            ctx.save();
            ctx.globalAlpha = this.knightAlpha;
            this.renderingSystem.renderEntity(this.player);
            ctx.restore();
        }

        if (this.npc && (this.state === 'cat_coming' || this.state === 'dialogue' || this.state === 'cat_leaving')) {
            this.renderingSystem.renderEntity(this.npc);
        }

        if (this.state === 'dialogue') {
            this.renderDialogue(renderer, size);
        }
    }

    private renderBackground(renderer: Renderer, size: { width: number; height: number }): void {
        const ctx = renderer.getContext();
        ctx.imageSmoothingEnabled = false;

        const green1 = '#90EE90';
        const green2 = '#32CD32';
        const tileSize = 32;

        for (let x = 0; x < size.width; x += tileSize) {
            for (let y = 0; y < size.height; y += tileSize) {
                const tileX = Math.floor(x / tileSize);
                const tileY = Math.floor(y / tileSize);
                renderer.fillStyle = (tileX + tileY) % 2 === 0 ? green1 : green2;
                renderer.fillRect(x, y, tileSize, tileSize);
            }
        }

        this.renderTrees(renderer);
        this.renderRocks(renderer);
    }

    private renderTrees(renderer: Renderer): void {
        const ctx = renderer.getContext();
        const trees = [
            {x: 150, y: 200},
            {x: 400, y: 150},
            {x: 750, y: 180},
            {x: 250, y: 500},
            {x: 600, y: 550},
            {x: 900, y: 520}
        ];

        trees.forEach(tree => {
            ctx.fillStyle = '#8B4513';
            const trunkWidth = 40;
            const trunkHeight = 80;
            ctx.fillRect(tree.x - trunkWidth/2, tree.y - trunkHeight, trunkWidth, trunkHeight);
            
            ctx.fillStyle = '#006400';
            ctx.fillRect(tree.x - 40, tree.y - trunkHeight - 40, 80, 40);
            ctx.fillRect(tree.x - 30, tree.y - trunkHeight - 80, 60, 40);
            ctx.fillRect(tree.x - 20, tree.y - trunkHeight - 110, 40, 30);
        });
    }

    private renderRocks(renderer: Renderer): void {
        const ctx = renderer.getContext();
        const rocks = [
            {x: 80, y: 100, size: 35},
            {x: 250, y: 80, size: 30},
            {x: 480, y: 200, size: 40},
            {x: 680, y: 150, size: 32},
            {x: 920, y: 120, size: 38},
            {x: 180, y: 350, size: 35},
            {x: 420, y: 500, size: 30},
            {x: 720, y: 450, size: 40},
            {x: 880, y: 550, size: 32}
        ];

        rocks.forEach(rock => {
            const grays = ['#696969', '#808080', '#A9A9A9', '#778899'];
            const grayIndex = Math.floor((rock.x + rock.y) / 50) % grays.length;
            ctx.fillStyle = grays[grayIndex];
            ctx.beginPath();
            ctx.ellipse(rock.x, rock.y, rock.size * 0.6, rock.size * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    private renderLogo(renderer: Renderer, size: { width: number; height: number }): void {
        const ctx = renderer.getContext();
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 64px "Courier New", monospace';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;

        ctx.strokeText('TOXIC RIDER', size.width / 2, this.logoY);
        ctx.fillText('TOXIC RIDER', size.width / 2, this.logoY);
        
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.strokeText('Réalisé par Marie Marchal pour son amoureux toxique', size.width / 2, this.logoY + 50);
        ctx.fillText('Réalisé par Marie Marchal pour son amoureux toxique', size.width / 2, this.logoY + 50);
        
        ctx.restore();
    }

    private renderDialogue(renderer: Renderer, size: { width: number; height: number }): void {
        const ctx = renderer.getContext();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.imageSmoothingEnabled = true;
        
        const dialogHeight = Math.min(120, Math.max(80, size.height * 0.15));
        const dialogWidth = Math.min(800, Math.max(500, size.width * 0.75));
        const dialogX = (size.width - dialogWidth) / 2;
        const dialogY = size.height * 0.5;
        
        renderer.fillStyle = '#000000';
        renderer.fillRect(dialogX, dialogY, dialogWidth, dialogHeight);
        
        renderer.strokeStyle = '#ffffff';
        renderer.lineWidth = 4;
        renderer.strokeRect(dialogX, dialogY, dialogWidth, dialogHeight);
        
        renderer.lineWidth = 1;
        renderer.strokeRect(dialogX + 3, dialogY + 3, dialogWidth - 6, dialogHeight - 6);
        
        if (this.dialogueIndex < this.dialogueLines.length) {
            renderer.fillStyle = '#ffffff';
            renderer.font = 'bold 18px Arial';
            renderer.textAlign = 'left';
            renderer.textBaseline = 'top';
            const text = this.dialogueLines[this.dialogueIndex];
            const lines = wrapText(ctx, text, dialogWidth - 60);
            lines.forEach((line, i) => {
                renderer.fillText(line, dialogX + 20, dialogY + 20 + (i * 24));
            });
        }
        
        if (this.waitingForInput) {
            const arrowVisible = Math.floor(this.arrowBlinkTimer * 2) % 2 === 0;
            if (arrowVisible) {
                renderer.fillStyle = '#ffffff';
                const arrowX = dialogX + dialogWidth - 30;
                const arrowY = dialogY + dialogHeight - 25;
                ctx.beginPath();
                ctx.moveTo(arrowX, arrowY);
                ctx.lineTo(arrowX - 8, arrowY - 8);
                ctx.lineTo(arrowX + 8, arrowY - 8);
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    cleanup(): void {
        this.cleanupInput.forEach(cleanup => cleanup());
        this.cleanupInput = [];
        this.player = null;
        this.npc = null;
    }
}

