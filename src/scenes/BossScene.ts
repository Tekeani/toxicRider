import { Scene } from './Scene';
import type { Renderer } from '../core/Renderer';
import type { Keys } from '../types';
import type { Game } from '../core/Game';
import { Player } from '../entities/Player';
import { RenderingSystem } from '../systems/RenderingSystem';
import { wrapText } from '../utils/TextUtils';
import { PLAYER_CONFIG } from '../config/constants';

type BattleState = 'intro_dialogue' | 'boss_talk' | 'player_choice' | 'result' | 'game_over' | 'victory_dialogue' | 'victory_free' | 'defeat_dialogue';

interface BossPhrase {
    text: string;
    answers: Array<{ text: string; correct: boolean }>;
}

export class BossScene extends Scene {
    private game: Game;
    private player: Player | null = null;
    private bossHp: number = 50;
    private bossMaxHp: number = 50;
    private currentTurn: number = 0;
    private selectedAnswerIndex: number = 0;
    private battleState: BattleState = 'intro_dialogue';
    private bossSprite: HTMLImageElement | null = null;
    private bikeSprite: HTMLImageElement | null = null;
    private bossSpriteLoaded: boolean = false;
    private bikeSpriteLoaded: boolean = false;
    private cageX: number = 100;
    private cageY: number = 50;
    private cageWidth: number = 150;
    private cageHeight: number = 100;
    private bossX: number = 200;
    private bossY: number = 0;
    private introDialogueLines: string[] = ["Je suis la puissante Amar"];
    private victoryDialogueLines: string[] = ["Aaaaargh ! Je suis vaincue ! Je ne peux plus m'interposer entre toi et ton véritable amour ! *s'effondre*"];
    private defeatDialogueLines: string[] = ["HA-HA ! Je le savais ! Tu m'aimes ! Allons donc vivre ensemble, nous marier et adopter plein de mignons petits chats ! Sans oublier tous les beaux voyages que je nous prévois. Viens !"];
    private bossPhrases: BossPhrase[] = [
        {
            text: "Je t'aime !",
            answers: [
                { text: "Moi aussi je m'aime !", correct: true },
                { text: "Moi aussi je t'aime !", correct: false },
                { text: "Tu es la femme de ma vie !", correct: false }
            ]
        },
        {
            text: "Partons en voyage demain !",
            answers: [
                { text: "Achetons nos billets et c'est parti !", correct: false },
                { text: "Je rêve de visiter le monde à tes côté !", correct: false },
                { text: "J'aime rester chez moi !", correct: true }
            ]
        },
        {
            text: "Je veux vivre avec toi !",
            answers: [
                { text: "Achetons une petite maison de Hobbit et let's go !", correct: false },
                { text: "Je ne suis pas prêt", correct: true },
                { text: "Chez toi ou chez moi mon amour ?", correct: false }
            ]
        },
        {
            text: "Il y a un super jeu vidéo que j'aimerai faire avec toi !",
            answers: [
                { text: "Je ne joue pas avec les noobs", correct: true },
                { text: "Lequel, que je l'installe de ce pas ?", correct: false },
                { text: "Bien sûr mon amour, et après on pourra en tester plein d'autres toute notre vie !", correct: false }
            ]
        },
        {
            text: "On est quoi toi et moi ?",
            answers: [
                { text: "Tu es l'amour de ma vie voyons !", correct: false },
                { text: "Pourquoi vouloir à tout prix mettre une étiquette et se prendre la tête ?", correct: true },
                { text: "Tu es mon âme sœur !", correct: false }
            ]
        }
    ];
    private introDialogueComplete: boolean = false;
    private victoryDialogueComplete: boolean = false;
    private defeatDialogueComplete: boolean = false;
    private cageVisible: boolean = true;
    private waitingForDialogueInput: boolean = true;
    private dialogueArrowBlinkTimer: number = 0;
    private heartPulseTime: number = 0;
    private resultMessage: string | null = null;
    private resultTimer: number = 0;
    private resultDuration: number = 2.0;
    private cageFadeOutProgress: number = 0;
    private cageFadeOutSpeed: number = 0.02;
    private raceTransitionActive: boolean = false;
    private raceTransitionTimer: number = 0;
    private raceTransitionDuration: number = 1.0;
    private buttonPressed: boolean = false;
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
        const cleanup1 = this.game.getInputManager().onKeyDown('Enter', (e) => {
            if (this.battleState === 'intro_dialogue' && this.waitingForDialogueInput && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                this.introDialogueComplete = true;
                this.waitingForDialogueInput = false;
                this.battleState = 'boss_talk';
            } else if (this.battleState === 'victory_dialogue' && this.waitingForDialogueInput && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                this.victoryDialogueComplete = true;
                this.waitingForDialogueInput = false;
                this.cageFadeOutProgress = 0;
                this.battleState = 'victory_free';
            } else if (this.battleState === 'defeat_dialogue' && this.waitingForDialogueInput && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                this.defeatDialogueComplete = true;
                this.waitingForDialogueInput = false;
                this.battleState = 'game_over';
            } else if (this.battleState === 'victory_free' && !this.cageVisible && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                const bikeX = this.cageX + this.cageWidth / 2;
                const bikeY = this.cageY + this.cageHeight / 2;
                if (this.player) {
                    const playerCenterX = this.player.x + this.player.width / 2;
                    const playerCenterY = this.player.y + this.player.height / 2;
                    const distance = Math.sqrt(Math.pow(playerCenterX - bikeX, 2) + Math.pow(playerCenterY - bikeY, 2));
                    if (distance < 100) {
                        this.raceTransitionActive = true;
                        this.raceTransitionTimer = 0;
                    }
                }
            } else if (this.battleState === 'boss_talk' && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                this.battleState = 'player_choice';
                this.selectedAnswerIndex = 0;
            } else if (this.battleState === 'player_choice' && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                this.submitAnswer();
            }
        });

        const cleanup2 = this.game.getInputManager().onKeyDown('e', (e) => {
            if (this.battleState === 'intro_dialogue' && this.waitingForDialogueInput && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                this.introDialogueComplete = true;
                this.waitingForDialogueInput = false;
                this.battleState = 'boss_talk';
            } else if (this.battleState === 'victory_dialogue' && this.waitingForDialogueInput && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                this.victoryDialogueComplete = true;
                this.waitingForDialogueInput = false;
                this.cageFadeOutProgress = 0;
                this.battleState = 'victory_free';
            } else if (this.battleState === 'defeat_dialogue' && this.waitingForDialogueInput && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                this.defeatDialogueComplete = true;
                this.waitingForDialogueInput = false;
                this.battleState = 'game_over';
            } else if (this.battleState === 'victory_free' && !this.cageVisible && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                const bikeX = this.cageX + this.cageWidth / 2;
                const bikeY = this.cageY + this.cageHeight / 2;
                if (this.player) {
                    const playerCenterX = this.player.x + this.player.width / 2;
                    const playerCenterY = this.player.y + this.player.height / 2;
                    const distance = Math.sqrt(Math.pow(playerCenterX - bikeX, 2) + Math.pow(playerCenterY - bikeY, 2));
                    if (distance < 100) {
                        this.raceTransitionActive = true;
                        this.raceTransitionTimer = 0;
                    }
                }
            } else if (this.battleState === 'boss_talk' && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                this.battleState = 'player_choice';
                this.selectedAnswerIndex = 0;
            } else if (this.battleState === 'player_choice' && !this._interactPressed) {
                e.preventDefault();
                this._interactPressed = true;
                this.submitAnswer();
            }
        });

        const cleanup3 = this.game.getInputManager().onKeyDown('ArrowUp', (e) => {
            if (this.battleState === 'player_choice') {
                e.preventDefault();
                this.selectedAnswerIndex = (this.selectedAnswerIndex - 1 + 3) % 3;
            }
        });

        const cleanup4 = this.game.getInputManager().onKeyDown('ArrowDown', (e) => {
            if (this.battleState === 'player_choice') {
                e.preventDefault();
                this.selectedAnswerIndex = (this.selectedAnswerIndex + 1) % 3;
            }
        });

        const cleanup5 = this.game.getInputManager().onKeyUp('Enter', () => {
            this._interactPressed = false;
        });

        const cleanup6 = this.game.getInputManager().onKeyUp('e', () => {
            this._interactPressed = false;
        });

        this.cleanupInput.push(cleanup1, cleanup2, cleanup3, cleanup4, cleanup5, cleanup6);

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
        const size = this.game.getRenderer().getBaseSize();
        this.cageX = 100;
        this.cageY = 50;
        this.bossX = 200;
        this.bossY = size.height / 2 - 100;

        const playerX = this.bossX + 400;
        const playerY = this.bossY - 20;
        this.player = new Player(playerX, playerY, this.game);
        this.player.direction = 'left';
        await this.player.loadSprite();

        this.bossHp = 50;
        this.bossMaxHp = 50;
        this.currentTurn = 0;
        this.selectedAnswerIndex = 0;
        this.battleState = 'intro_dialogue';
        this.heartPulseTime = 0;
        this.resultMessage = null;
        this.resultTimer = 0;
        this.raceTransitionActive = false;
        this.raceTransitionTimer = 0;
        this.introDialogueComplete = false;
        this.victoryDialogueComplete = false;
        this.defeatDialogueComplete = false;
        this.cageVisible = true;
        this.waitingForDialogueInput = true;
        this.dialogueArrowBlinkTimer = 0;
        this.cageFadeOutProgress = 0;

        await this.loadSprites();
        this.setupInput();
    }

    private async loadSprites(): Promise<void> {
        return new Promise<void>((resolve) => {
            const bossImg = new Image();
            bossImg.onload = () => {
                this.bossSprite = bossImg;
                this.bossSpriteLoaded = true;

                const bikeImg = new Image();
                bikeImg.onload = () => {
                    if (bikeImg.complete && bikeImg.naturalWidth > 0) {
                        this.bikeSprite = bikeImg;
                        this.bikeSpriteLoaded = true;
                    }
                    resolve();
                };
                bikeImg.onerror = () => resolve();
                bikeImg.src = 'assets/images/sprites/vehicles/spr_bike_0.png';
            };
            bossImg.onerror = () => {
                const bikeImg = new Image();
                bikeImg.onload = () => {
                    if (bikeImg.complete && bikeImg.naturalWidth > 0) {
                        this.bikeSprite = bikeImg;
                        this.bikeSpriteLoaded = true;
                    }
                    resolve();
                };
                bikeImg.onerror = () => resolve();
                bikeImg.src = 'assets/images/sprites/vehicles/spr_bike_0.png';
            };
            bossImg.src = 'assets/images/sprites/boss/Heart.png';
        });
    }

    private submitAnswer(): void {
        const currentPhrase = this.bossPhrases[this.currentTurn];
        const selectedAnswer = currentPhrase.answers[this.selectedAnswerIndex];

        if (selectedAnswer.correct) {
            this.bossHp = Math.max(0, this.bossHp - 10);
            this.battleState = 'result';
            this.resultMessage = "C'est très efficace !";
            this.resultTimer = 0;

            if (this.bossHp <= 0) {
                this.battleState = 'victory_dialogue';
                this.waitingForDialogueInput = false;
            }
        } else {
            const playerData = this.game.getPlayerData();
            playerData.hp = Math.max(0, playerData.hp - 20);
            this.game.setPlayerData(playerData);
            this.battleState = 'result';
            this.resultMessage = "Cela ne semble pas assez toxique...";
            this.resultTimer = 0;

            if (playerData.hp <= 0) {
                this.battleState = 'defeat_dialogue';
                this.waitingForDialogueInput = false;
            }
        }
    }

    private nextTurn(): void {
        this.currentTurn++;

        if (this.currentTurn >= this.bossPhrases.length) {
            const playerData = this.game.getPlayerData();
            if (this.bossHp <= 0) {
                this.battleState = 'victory_dialogue';
                this.waitingForDialogueInput = false;
            } else if (playerData.hp <= 0) {
                this.battleState = 'defeat_dialogue';
                this.waitingForDialogueInput = false;
            } else {
                this.battleState = 'defeat_dialogue';
                this.waitingForDialogueInput = false;
            }
        } else {
            this.battleState = 'boss_talk';
            this.selectedAnswerIndex = 0;
        }
    }

    update(deltaTime: number, keys: Keys): void {
        this.heartPulseTime += deltaTime;
        this.dialogueArrowBlinkTimer += deltaTime;

        if (this.battleState === 'intro_dialogue') {
            if (this.player && (this.player as any).currentAnimation) {
                (this.player as any).currentAnimation.update(deltaTime);
            }
            return;
        }

        if (this.battleState === 'victory_dialogue' || this.battleState === 'defeat_dialogue') {
            if (!this.waitingForDialogueInput) {
                this.waitingForDialogueInput = true;
            }
            if (this.player && (this.player as any).currentAnimation) {
                (this.player as any).currentAnimation.update(deltaTime);
            }
            return;
        }

        if (this.battleState === 'game_over') {
            if (this.player && (this.player as any).currentAnimation) {
                (this.player as any).currentAnimation.update(deltaTime);
            }
            return;
        }

        if (this.battleState === 'victory_free') {
            if (this.raceTransitionActive) {
                this.raceTransitionTimer += deltaTime;
                if (this.raceTransitionTimer >= this.raceTransitionDuration) {
                    this.cleanup();
                    this.game.nextScene();
                }
                return;
            }

            if (this.cageVisible && this.cageFadeOutProgress < 1) {
                this.cageFadeOutProgress = Math.min(1, this.cageFadeOutProgress + this.cageFadeOutSpeed);
                if (this.cageFadeOutProgress >= 1) {
                    this.cageVisible = false;
                }
            }

            if (this.player) {
                this.player.update(deltaTime, keys);
            }
            return;
        }

        if (this.battleState === 'boss_talk' || this.battleState === 'player_choice' || this.battleState === 'result') {
            if (this.player && (this.player as any).currentAnimation) {
                (this.player as any).currentAnimation.update(deltaTime);
            }

            if (this.battleState === 'result') {
                this.resultTimer += deltaTime;
                if (this.resultTimer >= this.resultDuration) {
                    this.resultTimer = 0;
                    this.nextTurn();
                }
            }
            return;
        }
    }

    render(renderer: Renderer): void {
        const size = renderer.getBaseSize();
        renderer.clear();

        this.renderDungeonFloor(renderer, size);
        this.renderScene(renderer, size);

        if (this.battleState === 'game_over') {
            this.renderGameOver(renderer, size);
        } else if (this.battleState === 'victory_dialogue' || this.battleState === 'defeat_dialogue' || this.battleState === 'intro_dialogue' || 
                   this.battleState === 'boss_talk' || this.battleState === 'player_choice' || this.battleState === 'result') {
            this.renderDialogue(renderer, size);
        }

        if (this.raceTransitionActive) {
            const fadeProgress = Math.min(1, this.raceTransitionTimer / this.raceTransitionDuration);
            renderer.fillStyle = `rgba(0, 0, 0, ${fadeProgress})`;
            renderer.fillRect(0, 0, size.width, size.height);
        }
    }

    private renderDungeonFloor(renderer: Renderer, size: { width: number; height: number }): void {
        const ctx = renderer.getContext();
        renderer.fillStyle = '#2C2C2C';
        renderer.fillRect(0, 0, size.width, size.height);

        const brickWidth = 64;
        const brickHeight = 32;
        const brickColor = '#404040';
        const brickBorder = '#202020';

        for (let y = 0; y < size.height; y += brickHeight) {
            for (let x = 0; x < size.width; x += brickWidth) {
                const offsetX = (Math.floor(y / brickHeight) % 2 === 0) ? 0 : brickWidth / 2;
                renderer.fillStyle = brickColor;
                renderer.fillRect(x + offsetX, y, brickWidth - 2, brickHeight - 2);
                renderer.strokeStyle = brickBorder;
                renderer.lineWidth = 1;
                renderer.strokeRect(x + offsetX, y, brickWidth - 2, brickHeight - 2);
            }
        }
    }

    private renderScene(renderer: Renderer, size: { width: number; height: number }): void {
        const ctx = renderer.getContext();

        if (this.bikeSpriteLoaded && this.bikeSprite) {
            const bikeDisplayWidth = this.cageWidth * 0.9;
            const bikeDisplayHeight = (this.bikeSprite.height / this.bikeSprite.width) * bikeDisplayWidth;
            const bikeX = this.cageX + this.cageWidth / 2 - bikeDisplayWidth / 2;
            const bikeY = this.cageY + this.cageHeight / 2 - bikeDisplayHeight / 2;
            ctx.drawImage(this.bikeSprite, bikeX, bikeY, bikeDisplayWidth, bikeDisplayHeight);
        } else {
            renderer.fillStyle = '#666666';
            renderer.fillRect(this.cageX + this.cageWidth / 2 - 50, this.cageY + this.cageHeight / 2 - 30, 100, 60);
        }

        if (this.cageVisible || (this.battleState === 'victory_free' && this.cageFadeOutProgress < 1)) {
            ctx.save();
            if (this.battleState === 'victory_free') {
                ctx.globalAlpha = 1 - this.cageFadeOutProgress;
            }
            this.renderCage(renderer);
            ctx.restore();
        }

        if (this.battleState !== 'victory_free' && this.battleState !== 'victory_dialogue') {
            const bossSize = 64;
            const pulse = 1 + Math.sin(this.heartPulseTime * 3) * 0.1;

            ctx.save();
            ctx.translate(this.bossX, this.bossY);

            renderer.fillStyle = '#FFFFFF';
            renderer.font = 'bold 18px Arial';
            renderer.textAlign = 'center';
            renderer.textBaseline = 'bottom';
            renderer.fillText('Amar', 0, -bossSize / 2 - 20);

            const barWidth = 200;
            const barHeight = 20;
            const barX = -barWidth / 2;
            const barY = -bossSize / 2 + 2;

            renderer.fillStyle = '#333333';
            renderer.fillRect(barX, barY, barWidth, barHeight);
            renderer.strokeStyle = '#FFFFFF';
            renderer.lineWidth = 2;
            renderer.strokeRect(barX, barY, barWidth, barHeight);

            const hpPercent = this.bossHp / this.bossMaxHp;
            const hpBarWidth = barWidth * hpPercent;
            renderer.fillStyle = '#FF0000';
            renderer.fillRect(barX + 2, barY + 2, hpBarWidth - 4, barHeight - 4);

            renderer.fillStyle = '#FFFFFF';
            renderer.font = 'bold 14px Arial';
            renderer.fillText(`${this.bossHp} / ${this.bossMaxHp}`, 0, barY + barHeight / 2);

            ctx.restore();

            ctx.save();
            ctx.translate(this.bossX, this.bossY);
            ctx.scale(pulse, pulse);

            if (this.bossSpriteLoaded && this.bossSprite) {
                ctx.drawImage(this.bossSprite, -this.bossSprite.width / 2, -this.bossSprite.height / 2);
            } else {
                ctx.fillStyle = '#FF0000';
                ctx.beginPath();
                ctx.moveTo(0, 10);
                ctx.bezierCurveTo(-25, -10, -50, 0, -25, 40);
                ctx.lineTo(0, 60);
                ctx.lineTo(25, 40);
                ctx.bezierCurveTo(50, 0, 25, -10, 0, 10);
                ctx.closePath();
                ctx.fill();
            }

            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(-12, 8, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(12, 8, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 22, 12, 0.2, Math.PI - 0.2, false);
            ctx.stroke();

            ctx.restore();
        }

        if (this.player) {
            this.renderingSystem.renderEntity(this.player);
        }
    }

    private renderCage(renderer: Renderer): void {
        const ctx = renderer.getContext();
        const barSpacing = 20;
        const barWidth = 4;
        renderer.fillStyle = '#666666';

        for (let x = this.cageX; x <= this.cageX + this.cageWidth; x += barSpacing) {
            renderer.fillRect(x, this.cageY, barWidth, this.cageHeight);
        }

        renderer.fillRect(this.cageX, this.cageY, this.cageWidth, barWidth);
        renderer.fillRect(this.cageX, this.cageY + this.cageHeight - barWidth, this.cageWidth, barWidth);

        const cornerSize = 8;
        renderer.fillStyle = '#888888';
        renderer.fillRect(this.cageX, this.cageY, cornerSize, cornerSize);
        renderer.fillRect(this.cageX + this.cageWidth - cornerSize, this.cageY, cornerSize, cornerSize);
        renderer.fillRect(this.cageX, this.cageY + this.cageHeight - cornerSize, cornerSize, cornerSize);
        renderer.fillRect(this.cageX + this.cageWidth - cornerSize, this.cageY + this.cageHeight - cornerSize, cornerSize, cornerSize);
    }

    private renderDialogue(renderer: Renderer, size: { width: number; height: number }): void {
        const ctx = renderer.getContext();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.imageSmoothingEnabled = true;

        let dialogWidth = Math.min(800, Math.max(500, size.width * 0.75));
        let dialogHeight: number;
        const dialogX = (size.width - dialogWidth) / 2;
        let dialogY: number;

        if (this.battleState === 'player_choice') {
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

        if (this.battleState === 'intro_dialogue' || this.battleState === 'victory_dialogue' || this.battleState === 'defeat_dialogue') {
            let dialogueText = '';
            if (this.battleState === 'intro_dialogue') {
                dialogueText = this.introDialogueLines[0];
            } else if (this.battleState === 'victory_dialogue') {
                dialogueText = this.victoryDialogueLines[0];
            } else if (this.battleState === 'defeat_dialogue') {
                dialogueText = this.defeatDialogueLines[0];
            }

            const lines = wrapText(ctx, dialogueText, dialogWidth - 60);
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
        } else if (this.battleState === 'boss_talk') {
            const currentPhrase = this.bossPhrases[this.currentTurn];
            renderer.fillText(`Amar: ${currentPhrase.text}`, dialogX + 20, dialogY + 20);

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
        } else if (this.battleState === 'player_choice') {
            const currentPhrase = this.bossPhrases[this.currentTurn];
            renderer.fillText("Répondre :", dialogX + 20, dialogY + 20);

            let yPos = dialogY + 60;
            currentPhrase.answers.forEach((answer, index) => {
                const isSelected = index === this.selectedAnswerIndex;

                if (isSelected) {
                    renderer.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    renderer.fillRect(dialogX + 15, yPos, dialogWidth - 30, 30);
                }

                if (isSelected) {
                    renderer.fillStyle = '#ffffff';
                    const arrowX = dialogX + 25;
                    const arrowY = yPos + 15;
                    ctx.beginPath();
                    ctx.moveTo(arrowX, arrowY);
                    ctx.lineTo(arrowX - 8, arrowY - 8);
                    ctx.lineTo(arrowX - 8, arrowY + 8);
                    ctx.closePath();
                    ctx.fill();
                }

                renderer.fillStyle = isSelected ? '#ffff00' : '#ffffff';
                renderer.font = 'bold 18px Arial';
                renderer.fillText(answer.text, dialogX + 45, yPos + 15);
                yPos += 40;
            });
        } else if (this.battleState === 'result') {
            renderer.fillText(this.resultMessage || '...', dialogX + 20, dialogY + 20);
        }
    }

    private renderGameOver(renderer: Renderer, size: { width: number; height: number }): void {
        const ctx = renderer.getContext();
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
        if (this.battleState === 'game_over') {
            const size = this.game.getRenderer().getBaseSize();
            const buttonWidth = 200;
            const buttonHeight = 50;
            const buttonX = size.width / 2 - buttonWidth / 2;
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

