import { Scene } from './Scene';
import type { Renderer } from '../core/Renderer';
import type { Keys } from '../types';
import type { Game } from '../core/Game';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import { RenderingSystem } from '../systems/RenderingSystem';
import { wrapText } from '../utils/TextUtils';
import { SpriteSheet } from '../utils/SpriteSheet';
import { Animation } from '../utils/Animation';
import { PLAYER_CONFIG } from '../config/constants';

type RiddleState = 'dialogue' | 'riddle' | 'result';

export class RiddleScene extends Scene {
    private game: Game;
    private player: Player | null = null;
    private npc: NPC | null = null;
    private transitionActive: boolean = true;
    private transitionText: string = "Après une bien trop longue marche";
    private waitingForInput: boolean = false;
    private transitionComplete: boolean = false;
    private transitionArrowBlinkTimer: number = 0;
    private dialogueActive: boolean = false;
    private dialogueIndex: number = 0;
    private dialogueLines: string[] = [
        "Meuh ! Tremble devant le terrible gardien du terrible donjon de la terrible Amar !",
        "*ton soudainement enjouée* Tu veux bien jouer avec moi :) ?",
        "Je te propose un deal : réponds correctement à ma devinette et je te laisse franchir les portes du donjon (*marmonne* de toute façon Amar ne me paye pas assez pour ces conneries...)",
        "Si tu te trompes, tu devras te retourner, te défroquer, te pencher et... *rire machiavélique*"
    ];
    private dialogueArrowBlinkTimer: number = 0;
    private dialogueCooldown: number = 0.3;
    private waitingForDialogueInput: boolean = false;
    private riddleState: RiddleState = 'dialogue';
    private riddleLines: string[] = [
        "Je me hisse chaque matin,",
        "Ou branlé par une main,",
        "Fièrement droit et large, jamais chagrin,",
        "Sauf lorsque je projette mon crachin.",
        "Qui suis-je ?"
    ];
    private answerChoices: string[] = [
        "Ta mère la catin",
        "Un drapeau",
        "Une queue de cheval"
    ];
    private correctAnswerIndex: number = 1;
    private selectedAnswerIndex: number = 0;
    private answerResult: 'correct' | 'incorrect' | null = null;
    private resultText: string = '';
    private gameOverText: string = "Tu t'es trompé ! Tu dois te retourner, te défroquer, te pencher et... *rire machiavélique*";
    private gameOver: boolean = false;
    private buttonPressed: boolean = false;
    private bossTransitionActive: boolean = false;
    private bossTransitionTimer: number = 0;
    private bossTransitionDuration: number = 1.0;
    private castleX: number = 400;
    private castleY: number = 200;
    private castleWidth: number = 224;
    private castleHeight: number = 280;
    private _interactPressed: boolean = false;
    private cleanupInput: (() => void)[] = [];
    private renderingSystem: RenderingSystem;
    private clickHandler: ((e: MouseEvent) => void) | null = null;

    constructor(game: Game) {
        super();
        this.game = game;
        this.renderingSystem = new RenderingSystem(game.getRenderer());
        this.setupInput();
    }

    private setupInput(): void {
        const preventInsults = (e: KeyboardEvent) => {
            if (e.key === 'a' || e.key === 'A' || e.key === '!') {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
        };

        const cleanup1 = this.game.getInputManager().onKeyDown('a', preventInsults);
        const cleanup2 = this.game.getInputManager().onKeyDown('A', preventInsults);
        const cleanup3 = this.game.getInputManager().onKeyDown('!', preventInsults);
        const cleanup4 = this.game.getInputManager().onKeyUp('a', preventInsults);
        const cleanup5 = this.game.getInputManager().onKeyUp('A', preventInsults);
        const cleanup6 = this.game.getInputManager().onKeyUp('!', preventInsults);

        const cleanup7 = this.game.getInputManager().onKeyDown('Enter', (e) => {
            if (this.transitionActive && !this.transitionComplete && this.waitingForInput) {
                e.preventDefault();
                this.transitionComplete = true;
                this.transitionActive = false;
                this.waitingForInput = false;
            } else if (this.dialogueActive && this.riddleState === 'dialogue' && this.waitingForDialogueInput && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                this.dialogueCooldown = 0.3;
                this.waitingForDialogueInput = false;
                this.dialogueIndex++;
                if (this.dialogueIndex >= this.dialogueLines.length) {
                    this.riddleState = 'riddle';
                    this.selectedAnswerIndex = 0;
                    this.dialogueCooldown = 0;
                    this.waitingForDialogueInput = false;
                }
            } else if (this.dialogueActive && this.riddleState === 'riddle' && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                this.checkAnswer();
            } else if (this.dialogueActive && this.riddleState === 'result' && this.waitingForDialogueInput && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                if (this.answerResult === 'correct') {
                    this.dialogueActive = false;
                    this.bossTransitionActive = true;
                    this.bossTransitionTimer = 0;
                } else {
                    this.dialogueActive = false;
                    this.gameOver = true;
                }
            } else if (!this.dialogueActive && !this.transitionActive && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                if (this.isPlayerNearNPC()) {
                    this.dialogueActive = true;
                    this.dialogueIndex = 0;
                    this.dialogueCooldown = 0.3;
                    this.waitingForDialogueInput = false;
                }
            }
        });

        const cleanup8 = this.game.getInputManager().onKeyDown('e', (e) => {
            if (this.transitionActive && !this.transitionComplete && this.waitingForInput) {
                e.preventDefault();
                this.transitionComplete = true;
                this.transitionActive = false;
                this.waitingForInput = false;
            } else if (this.dialogueActive && this.riddleState === 'dialogue' && this.waitingForDialogueInput && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                this.dialogueCooldown = 0.3;
                this.waitingForDialogueInput = false;
                this.dialogueIndex++;
                if (this.dialogueIndex >= this.dialogueLines.length) {
                    this.riddleState = 'riddle';
                    this.selectedAnswerIndex = 0;
                    this.dialogueCooldown = 0;
                    this.waitingForDialogueInput = false;
                }
            } else if (this.dialogueActive && this.riddleState === 'riddle' && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                this.checkAnswer();
            } else if (this.dialogueActive && this.riddleState === 'result' && this.waitingForDialogueInput && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                if (this.answerResult === 'correct') {
                    this.dialogueActive = false;
                    this.bossTransitionActive = true;
                    this.bossTransitionTimer = 0;
                } else {
                    this.dialogueActive = false;
                    this.gameOver = true;
                }
            } else if (!this.dialogueActive && !this.transitionActive && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                if (this.isPlayerNearNPC()) {
                    this.dialogueActive = true;
                    this.dialogueIndex = 0;
                    this.dialogueCooldown = 0.3;
                    this.waitingForDialogueInput = false;
                }
            }
        });

        const cleanup9 = this.game.getInputManager().onKeyDown('ArrowUp', (e) => {
            if (this.dialogueActive && this.riddleState === 'riddle') {
                e.preventDefault();
                this.selectedAnswerIndex = (this.selectedAnswerIndex - 1 + this.answerChoices.length) % this.answerChoices.length;
            }
        });

        const cleanup10 = this.game.getInputManager().onKeyDown('ArrowDown', (e) => {
            if (this.dialogueActive && this.riddleState === 'riddle') {
                e.preventDefault();
                this.selectedAnswerIndex = (this.selectedAnswerIndex + 1) % this.answerChoices.length;
            }
        });

        const cleanup11 = this.game.getInputManager().onKeyUp('Enter', () => {
            this._interactPressed = false;
        });

        const cleanup12 = this.game.getInputManager().onKeyUp('e', () => {
            this._interactPressed = false;
        });

        this.cleanupInput.push(cleanup1, cleanup2, cleanup3, cleanup4, cleanup5, cleanup6, cleanup7, cleanup8, cleanup9, cleanup10, cleanup11, cleanup12);

        const canvas = this.game.getRenderer().getCanvas();
        this.clickHandler = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleClick(x, y);
        };
        canvas.addEventListener('click', this.clickHandler);
    }

    async init(): Promise<void> {
        this.cleanup();
        this.setupInput();

        this.gameOver = false;
        this.dialogueActive = false;
        this.riddleState = 'dialogue';
        this.dialogueIndex = 0;
        this.selectedAnswerIndex = 0;
        this.answerResult = null;
        this.resultText = '';
        this.bossTransitionActive = false;
        this.bossTransitionTimer = 0;
        this.transitionActive = true;
        this.transitionComplete = false;
        this.waitingForInput = false;

        const size = this.game.getRenderer().getBaseSize();
        this.player = new Player(size.width / 2 - 80, size.height / 2 - 150, this.game);

        const npcX = size.width / 2;
        const npcY = size.height / 2 - 80;
        this.npc = new NPC(npcX, npcY, this.game, true);
        this.npc.width = 96;
        this.npc.height = 128;

        await this.loadSheepmanSprite();
    }

    private async loadSheepmanSprite(): Promise<void> {
        if (!this.npc) return;

        return new Promise<void>((resolve, reject) => {
            (this.npc as any)._loading = true;
            (this.npc as any).spriteLoaded = false;
            (this.npc as any).spriteSheet = null;
            (this.npc as any).animations = {};
            (this.npc as any).currentAnimation = null;

            const img = new Image();
            img.onload = () => {
                if (img.complete && img.naturalWidth > 0) {
                    (this.npc as any).spriteSheet = new SpriteSheet(img, 48, 64);
                    (this.npc as any).spriteSheet.framesPerRow = Math.floor(img.width / 48);
                    (this.npc as any).animations = {
                        idle: new Animation((this.npc as any).spriteSheet, [6], 1, true)
                    };
                    (this.npc as any).currentAnimation = (this.npc as any).animations.idle;
                    (this.npc as any).currentAnimation.play();
                    (this.npc as any).spriteLoaded = true;
                    (this.npc as any)._loading = false;
                    resolve();
                }
            };
            img.onerror = () => {
                (this.npc as any)._loading = false;
                reject();
            };
            img.src = 'assets/images/sprites/npc/PNG/48x64/sheepman.png';
        });
    }

    private isPlayerNearNPC(): boolean {
        if (!this.player || !this.npc) return false;
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        const npcCenterX = this.npc.x + this.npc.width / 2;
        const npcCenterY = this.npc.y + this.npc.height / 2;
        const dx = playerCenterX - npcCenterX;
        const dy = playerCenterY - npcCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 80;
    }

    private checkAnswer(): void {
        if (this.selectedAnswerIndex === this.correctAnswerIndex) {
            this.answerResult = 'correct';
            this.riddleState = 'result';
            this.resultText = "Zut, moi qui voulait t'enc... Heu bonne chance face à Amar ! Meuh !";
            this.waitingForDialogueInput = false;
            this.dialogueCooldown = 0.3;
        } else {
            this.answerResult = 'incorrect';
            this.riddleState = 'result';
            this.waitingForDialogueInput = false;
            this.dialogueCooldown = 0.3;
        }
    }

    update(deltaTime: number, keys: Keys): void {
        const inputKeys = this.game.getInputManager().getKeys();
        inputKeys['a'] = false;
        inputKeys['A'] = false;
        inputKeys['!'] = false;

        if (this.transitionActive && !this.transitionComplete) {
            this.transitionArrowBlinkTimer += deltaTime;
            if (!this.waitingForInput) {
                this.waitingForInput = true;
            }
            return;
        }

        if (this.gameOver) return;

        if (this.bossTransitionActive) {
            this.bossTransitionTimer += deltaTime;
            if (this.bossTransitionTimer >= this.bossTransitionDuration) {
                this.cleanup();
                this.game.nextScene();
            }
            return;
        }

        if (this.dialogueActive) {
            this.dialogueArrowBlinkTimer += deltaTime;
            if (this.riddleState === 'dialogue' || this.riddleState === 'result') {
                this.dialogueCooldown -= deltaTime;
                if (this.dialogueCooldown <= 0) {
                    this.waitingForDialogueInput = true;
                }
            }
            if (this.player && (this.player as any).currentAnimation) {
                (this.player as any).currentAnimation.update(deltaTime);
            }
            if (this.npc && (this.npc as any).currentAnimation) {
                (this.npc as any).currentAnimation.update(deltaTime);
            }
            return;
        }

        if (this.player) {
            const size = this.game.getRenderer().getBaseSize();
            const speedPerSecond = this.player.speed * 60;
            let newX = this.player.x;
            let newY = this.player.y;
            let isMoving = false;

            if (keys['ArrowUp'] || keys['z'] || keys['Z']) {
                newY -= speedPerSecond * deltaTime;
                this.player.direction = 'up';
                isMoving = true;
            }
            if (keys['ArrowDown'] || keys['w'] || keys['W']) {
                newY += speedPerSecond * deltaTime;
                this.player.direction = 'down';
                isMoving = true;
            }
            if (keys['ArrowRight'] || keys['s'] || keys['S']) {
                newX += speedPerSecond * deltaTime;
                this.player.direction = 'right';
                isMoving = true;
            }
            if (keys['ArrowLeft'] || keys['q'] || keys['Q']) {
                newX -= speedPerSecond * deltaTime;
                this.player.direction = 'left';
                isMoving = true;
            }

            (this.player as any).isMoving = isMoving;
            newX = Math.max(0, Math.min(size.width - this.player.width, newX));
            newY = Math.max(0, Math.min(size.height - this.player.height, newY));
            this.player.x = newX;
            this.player.y = newY;

            if ((this.player as any).currentAnimation) {
                (this.player as any).currentAnimation.update(deltaTime);
            }
        }

        if (this.npc) {
            this.npc.update(deltaTime);
        }
    }

    render(renderer: Renderer): void {
        const size = renderer.getBaseSize();
        const ctx = renderer.getContext();

        if (this.transitionActive && !this.transitionComplete) {
            this.renderTransition(renderer, size);
            return;
        }

        renderer.clear();
        ctx.imageSmoothingEnabled = false;

        this.renderBackground(renderer, size);
        this.renderCastle(renderer, size);

        if (this.npc) {
            this.renderingSystem.renderEntity(this.npc);
        }

        if (this.player) {
            this.renderingSystem.renderEntity(this.player);
        }

        if (this.gameOver) {
            this.renderGameOver(renderer, size);
            return;
        }

        if (this.dialogueActive) {
            this.renderDialogue(renderer, size);
        }

        if (this.bossTransitionActive) {
            const fadeProgress = Math.min(1, this.bossTransitionTimer / this.bossTransitionDuration);
            renderer.fillStyle = `rgba(0, 0, 0, ${fadeProgress})`;
            renderer.fillRect(0, 0, size.width, size.height);
        }
    }

    private renderTransition(renderer: Renderer, size: { width: number; height: number }): void {
        renderer.fillStyle = '#000000';
        renderer.fillRect(0, 0, size.width, size.height);
        renderer.fillStyle = '#ffffff';
        renderer.font = 'bold 36px Arial';
        renderer.textAlign = 'center';
        renderer.textBaseline = 'middle';
        renderer.fillText(this.transitionText, size.width / 2, size.height / 2 - 20);

        if (this.waitingForInput) {
            const arrowVisible = Math.floor(this.transitionArrowBlinkTimer * 2) % 2 === 0;
            if (arrowVisible) {
                const ctx = renderer.getContext();
                renderer.fillStyle = '#ffffff';
                const arrowX = size.width / 2;
                const arrowY = size.height / 2 + 30;
                ctx.beginPath();
                ctx.moveTo(arrowX, arrowY);
                ctx.lineTo(arrowX - 8, arrowY - 8);
                ctx.lineTo(arrowX + 8, arrowY - 8);
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    private renderBackground(renderer: Renderer, size: { width: number; height: number }): void {
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
    }

    private renderTrees(renderer: Renderer): void {
        const ctx = renderer.getContext();
        const trees = [
            {x: 150, y: 250},
            {x: 300, y: 200},
            {x: 724, y: 200},
            {x: 874, y: 250},
            {x: 150, y: 550},
            {x: 400, y: 600},
            {x: 624, y: 600},
            {x: 874, y: 550}
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

    private renderCastle(renderer: Renderer, size: { width: number; height: number }): void {
        const ctx = renderer.getContext();
        ctx.fillStyle = '#696969';
        const mainBodyHeight = 200;
        ctx.fillRect(this.castleX, this.castleY + 80, this.castleWidth, mainBodyHeight);

        const towerWidth = 60;
        const towerHeight = 200;
        ctx.fillRect(this.castleX - 30, this.castleY + 40, towerWidth, towerHeight);
        ctx.fillRect(this.castleX + this.castleWidth - 30, this.castleY + 40, towerWidth, towerHeight);

        const centerTowerWidth = 80;
        const centerTowerHeight = 240;
        const centerTowerX = this.castleX + this.castleWidth / 2 - centerTowerWidth / 2;
        ctx.fillRect(centerTowerX, this.castleY + 20, centerTowerWidth, centerTowerHeight);

        ctx.fillStyle = '#555555';
        const battlementWidth = 30;
        const battlementHeight = 25;
        for (let i = 0; i < Math.floor(this.castleWidth / battlementWidth); i++) {
            const x = this.castleX + i * battlementWidth;
            if (i % 2 === 0) {
                ctx.fillRect(x, this.castleY + 80, battlementWidth, battlementHeight);
            }
        }

        ctx.fillStyle = '#FFD700';
        const windowWidth = 20;
        const windowHeight = 30;
        ctx.fillRect(this.castleX - 15, this.castleY + 100, windowWidth, windowHeight);
        ctx.fillRect(this.castleX + this.castleWidth - 5, this.castleY + 100, windowWidth, windowHeight);

        ctx.fillStyle = '#2F1B14';
        const doorWidth = 60;
        const doorHeight = 120;
        const doorX = this.castleX + this.castleWidth / 2 - doorWidth / 2;
        const doorY = this.castleY + 240;
        ctx.fillRect(doorX, doorY, doorWidth, doorHeight);
    }

    private renderDialogue(renderer: Renderer, size: { width: number; height: number }): void {
        const ctx = renderer.getContext();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.imageSmoothingEnabled = true;

        const dialogWidth = Math.min(800, Math.max(500, size.width * 0.75));
        let dialogHeight: number;
        const dialogX = (size.width - dialogWidth) / 2;
        let dialogY: number;

        if (this.riddleState === 'riddle') {
            dialogHeight = 350;
            dialogY = size.height * 0.15;
        } else {
            dialogHeight = Math.min(120, Math.max(80, size.height * 0.15));
            dialogY = size.height * 0.5;
        }

        renderer.fillStyle = '#000000';
        renderer.fillRect(dialogX, dialogY, dialogWidth, dialogHeight);
        renderer.strokeStyle = '#ffffff';
        renderer.lineWidth = 4;
        renderer.strokeRect(dialogX, dialogY, dialogWidth, dialogHeight);
        renderer.lineWidth = 1;
        renderer.strokeRect(dialogX + 3, dialogY + 3, dialogWidth - 6, dialogHeight - 6);

        renderer.fillStyle = '#ffffff';
        renderer.font = 'bold 18px Arial';
        renderer.textAlign = 'left';
        renderer.textBaseline = 'top';

        if (this.riddleState === 'dialogue') {
            if (this.dialogueIndex < this.dialogueLines.length) {
                const text = this.dialogueLines[this.dialogueIndex];
                const lines = wrapText(ctx, text, dialogWidth - 60);
                lines.forEach((line, i) => {
                    renderer.fillText(line, dialogX + 20, dialogY + 20 + (i * 24));
                });
            }

            if (this.waitingForDialogueInput) {
                const arrowVisible = Math.floor(this.dialogueArrowBlinkTimer * 2) % 2 === 0;
                if (arrowVisible) {
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
        } else if (this.riddleState === 'riddle') {
            let yPos = dialogY + 20;
            renderer.fillText("Voici mon énigme :", dialogX + 20, yPos);
            yPos += 35;

            this.riddleLines.forEach((line) => {
                renderer.fillText(line, dialogX + 20, yPos);
                yPos += 30;
            });

            yPos += 20;
            this.answerChoices.forEach((choice, index) => {
                const isSelected = index === this.selectedAnswerIndex;
                const choiceY = yPos + 15;

                if (isSelected) {
                    renderer.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    renderer.fillRect(dialogX + 15, yPos, dialogWidth - 30, 30);
                }

                if (isSelected) {
                    renderer.fillStyle = '#ffffff';
                    const arrowX = dialogX + 25;
                    const arrowY = choiceY + 5;
                    ctx.beginPath();
                    ctx.moveTo(arrowX, arrowY);
                    ctx.lineTo(arrowX - 8, arrowY - 8);
                    ctx.lineTo(arrowX - 8, arrowY + 8);
                    ctx.closePath();
                    ctx.fill();
                }

                renderer.fillStyle = isSelected ? '#ffff00' : '#ffffff';
                renderer.font = 'bold 18px Arial';
                renderer.fillText(choice, dialogX + 45, choiceY);
                yPos += 40;
            });
        } else if (this.riddleState === 'result') {
            const resultText = this.answerResult === 'correct' ? this.resultText : this.gameOverText;
            const lines = wrapText(ctx, resultText, dialogWidth - 60);
            lines.forEach((line, i) => {
                renderer.fillText(line, dialogX + 20, dialogY + 20 + (i * 24));
            });

            if (this.waitingForDialogueInput) {
                const arrowVisible = Math.floor(this.dialogueArrowBlinkTimer * 2) % 2 === 0;
                if (arrowVisible) {
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
    }

    private renderGameOver(renderer: Renderer, size: { width: number; height: number }): void {
        const ctx = renderer.getContext();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.imageSmoothingEnabled = true;

        renderer.fillStyle = 'rgba(0, 0, 0, 0.8)';
        renderer.fillRect(0, 0, size.width, size.height);
        renderer.fillStyle = '#ff0000';
        renderer.font = 'bold 64px Arial';
        renderer.textAlign = 'center';
        renderer.textBaseline = 'middle';
        renderer.fillText('GAME OVER', size.width / 2, size.height / 2 - 100);

        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonX = size.width / 2 - buttonWidth / 2;
        const buttonY = size.height / 2 + 50 + (this.buttonPressed ? 3 : 0);
        renderer.fillStyle = this.buttonPressed ? '#222222' : '#333333';
        renderer.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        renderer.strokeStyle = '#ffffff';
        renderer.lineWidth = 2;
        renderer.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        renderer.fillStyle = '#ffffff';
        renderer.font = 'bold 24px Arial';
        renderer.fillText('Rejouer', size.width / 2, buttonY + buttonHeight / 2);
    }

    private handleClick(x: number, y: number): void {
        if (this.gameOver) {
            const size = this.game.getRenderer().getBaseSize();
            const buttonWidth = 200;
            const buttonHeight = 60;
            const buttonX = (size.width - buttonWidth) / 2;
            const buttonY = size.height / 2 + 50;

            if (x >= buttonX && x <= buttonX + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
                this.buttonPressed = true;
                setTimeout(() => {
                    this.buttonPressed = false;
                    this.cleanup();
                    this.game.setScene(1);
                    const scene = this.game.getCurrentScene() as any;
                    if (scene && scene.restartWave) {
                        scene.restartWave();
                    }
                }, 150);
            }
        }
    }

    cleanup(): void {
        this.cleanupInput.forEach(cleanup => cleanup());
        this.cleanupInput = [];
        if (this.clickHandler) {
            const canvas = this.game.getRenderer().getCanvas();
            canvas.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
        }
        this._interactPressed = false;
    }
}

