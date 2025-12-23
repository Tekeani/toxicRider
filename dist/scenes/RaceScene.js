import { Scene } from './Scene';
import { Enemy } from '../entities/Enemy';
import { RenderingSystem } from '../systems/RenderingSystem';
import { wrapText } from '../utils/TextUtils';
import { PLAYER_CONFIG } from '../config/constants';
export class RaceScene extends Scene {
    constructor(game) {
        super();
        this.gameState = 'racing';
        this.raceTime = 0;
        this.raceDuration = 30;
        this.finished = false;
        this.gameOver = false;
        this.bikeX = 0;
        this.bikeY = 0;
        this.bikeWidth = 80;
        this.bikeHeight = 80;
        this.bikeSpeed = 300;
        this.BIKE_SPRITE_SIZE = 32;
        this.bikeCurrentFrame = 0;
        this.bikeSpriteSheet = null;
        this.roadWidth = 400;
        this.roadX = 0;
        this.roadScrollSpeed = 500;
        this.roadScrollOffset = 0;
        this.trees = [];
        this.rocks = [];
        this.enemies = [];
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 2.0;
        this.confetti = [];
        this.fireworks = [];
        this.fireworkTimer = 0;
        this.fireworkInterval = 1.0;
        this.buttonPressed = false;
        this.cleanupInput = [];
        this.clickHandler = null;
        this.game = game;
        this.renderingSystem = new RenderingSystem(game.getRenderer());
        this.setupInput();
    }
    setupInput() {
        const canvas = this.game.getRenderer().getCanvas();
        this.clickHandler = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleClick(x, y);
        };
        canvas.addEventListener('click', this.clickHandler);
    }
    async init() {
        this.cleanup();
        this.setupInput();
        const size = this.game.getRenderer().getBaseSize();
        this.gameState = 'racing';
        this.raceTime = 0;
        this.finished = false;
        this.gameOver = false;
        this.bikeX = size.width / 2;
        this.bikeY = size.height * 0.55;
        this.bikeCurrentFrame = 0;
        this.roadScrollOffset = 0;
        this.enemies = [];
        this.enemySpawnTimer = 0;
        this.confetti = [];
        this.fireworks = [];
        this.fireworkTimer = 0;
        this.buttonPressed = false;
        this.roadX = (size.width - this.roadWidth) / 2;
        await Enemy.loadSharedSprite();
        this.initDecor();
        this.generateBikeSpriteSheet();
    }
    generateBikeSpriteSheet() {
        const SPRITE_SIZE = this.BIKE_SPRITE_SIZE;
        const DIRECTIONS = 2;
        const canvas = document.createElement("canvas");
        canvas.width = SPRITE_SIZE * DIRECTIONS;
        canvas.height = SPRITE_SIZE;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        const BLACK = "#000000";
        const DARK_GRAY = "#222222";
        const drawMotorcycle = (ctx, x, y, direction) => {
            ctx.fillStyle = BLACK;
            ctx.fillRect(x + 14, y + 24, 4, 6);
            ctx.fillStyle = DARK_GRAY;
            ctx.fillRect(x + 12, y + 8, 8, 16);
            ctx.fillStyle = BLACK;
            ctx.fillRect(x + 13, y + 12, 6, 6);
            ctx.fillRect(x + 14, y + 10, 4, 2);
            ctx.save();
            ctx.translate(x + 16, y + 4);
            const tiltAngle = direction === 0 ? -0.4 : 0.4;
            ctx.rotate(tiltAngle);
            ctx.translate(-2, -3);
            ctx.fillStyle = BLACK;
            ctx.fillRect(0, 0, 4, 6);
            ctx.restore();
            ctx.save();
            ctx.translate(x + 16, y + 7);
            const handlebarTilt = direction === 0 ? -0.4 : 0.4;
            ctx.rotate(handlebarTilt);
            ctx.translate(-6, -1);
            ctx.fillStyle = DARK_GRAY;
            ctx.fillRect(0, 0, 12, 2);
            ctx.restore();
        };
        for (let i = 0; i < DIRECTIONS; i++) {
            drawMotorcycle(ctx, i * SPRITE_SIZE, 0, i);
        }
        this.bikeSpriteSheet = canvas;
    }
    initDecor() {
        this.trees = [];
        this.rocks = [];
        for (let i = 0; i < 20; i++) {
            if (Math.random() < 0.5) {
                this.trees.push({
                    x: Math.random() < 0.5 ? this.roadX - 60 - Math.random() * 100 : this.roadX + this.roadWidth + 60 + Math.random() * 100,
                    y: -i * 200 - Math.random() * 200,
                    size: 40 + Math.random() * 30
                });
            }
            else {
                this.rocks.push({
                    x: Math.random() < 0.5 ? this.roadX - 40 - Math.random() * 80 : this.roadX + this.roadWidth + 40 + Math.random() * 80,
                    y: -i * 150 - Math.random() * 150,
                    size: 20 + Math.random() * 20
                });
            }
        }
    }
    spawnEnemy() {
        const enemyX = this.roadX + 50 + Math.random() * (this.roadWidth - 100);
        const enemyY = -50;
        const enemy = new Enemy(enemyX, enemyY, 'STRONG', this.game);
        enemy.loadSprite().then(() => { });
        this.enemies.push(enemy);
    }
    createVictoryEffects() {
        const size = this.game.getRenderer().getBaseSize();
        for (let i = 0; i < 100; i++) {
            this.confetti.push({
                x: Math.random() * size.width,
                y: -10 - Math.random() * 100,
                vx: (Math.random() - 0.5) * 200,
                vy: 100 + Math.random() * 200,
                color: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'][Math.floor(Math.random() * 6)],
                size: 5 + Math.random() * 5,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 5
            });
        }
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const size = this.game.getRenderer().getBaseSize();
                const fireworkX = 100 + Math.random() * (size.width - 200);
                const fireworkY = 100 + Math.random() * 300;
                this.createFirework(fireworkX, fireworkY);
            }, i * 500);
        }
    }
    createFirework(x, y) {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'];
        const numParticles = 30;
        for (let i = 0; i < numParticles; i++) {
            const angle = (Math.PI * 2 / numParticles) * i;
            const speed = 100 + Math.random() * 100;
            this.fireworks.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 3 + Math.random() * 3,
                life: 1.0,
                lifeDecay: 0.01 + Math.random() * 0.02
            });
        }
    }
    updateVictoryEffects(deltaTime) {
        const size = this.game.getRenderer().getBaseSize();
        this.confetti.forEach(confetti => {
            confetti.x += confetti.vx * deltaTime;
            confetti.y += confetti.vy * deltaTime;
            confetti.vy += 300 * deltaTime;
            confetti.rotation += confetti.rotationSpeed * deltaTime;
        });
        this.confetti = this.confetti.filter(c => {
            if (c.y > size.height + 50) {
                c.y = -10 - Math.random() * 100;
                c.x = Math.random() * size.width;
                c.vx = (Math.random() - 0.5) * 200;
                c.vy = 100 + Math.random() * 200;
            }
            return true;
        });
        this.fireworks.forEach(firework => {
            firework.x += firework.vx * deltaTime;
            firework.y += firework.vy * deltaTime;
            firework.vy += 100 * deltaTime;
            firework.life -= firework.lifeDecay;
        });
        this.fireworks = this.fireworks.filter(f => f.life > 0);
        this.fireworkTimer += deltaTime;
        if (this.fireworkTimer >= 1.0) {
            this.fireworkTimer = 0;
            const size = this.game.getRenderer().getBaseSize();
            const fireworkX = 100 + Math.random() * (size.width - 200);
            const fireworkY = 100 + Math.random() * 300;
            this.createFirework(fireworkX, fireworkY);
        }
    }
    update(deltaTime, keys) {
        if (this.gameState === 'racing') {
            this.raceTime += deltaTime;
            if (this.raceTime >= this.raceDuration) {
                this.finished = true;
                this.gameState = 'victory';
                this.createVictoryEffects();
                return;
            }
            const isMovingLeft = keys['ArrowLeft'] || keys['q'] || keys['Q'];
            const isMovingRight = keys['ArrowRight'] || keys['d'] || keys['D'];
            if (isMovingLeft) {
                this.bikeX -= this.bikeSpeed * deltaTime;
                this.bikeCurrentFrame = 0;
            }
            else if (isMovingRight) {
                this.bikeX += this.bikeSpeed * deltaTime;
                this.bikeCurrentFrame = 1;
            }
            const size = this.game.getRenderer().getBaseSize();
            const roadLeft = this.roadX + 20;
            const roadRight = this.roadX + this.roadWidth - 20;
            this.bikeX = Math.max(roadLeft, Math.min(roadRight, this.bikeX));
            this.roadScrollOffset += this.roadScrollSpeed * deltaTime;
            this.trees.forEach(tree => {
                tree.y += this.roadScrollSpeed * deltaTime;
            });
            this.rocks.forEach(rock => {
                rock.y += this.roadScrollSpeed * deltaTime;
            });
            this.trees = this.trees.filter(tree => {
                if (tree.y > size.height + 100) {
                    tree.y = -200 - Math.random() * 200;
                    tree.x = Math.random() < 0.5 ? this.roadX - 60 - Math.random() * 100 : this.roadX + this.roadWidth + 60 + Math.random() * 100;
                }
                return true;
            });
            this.rocks = this.rocks.filter(rock => {
                if (rock.y > size.height + 100) {
                    rock.y = -150 - Math.random() * 150;
                    rock.x = Math.random() < 0.5 ? this.roadX - 40 - Math.random() * 80 : this.roadX + this.roadWidth + 40 + Math.random() * 80;
                }
                return true;
            });
            this.enemySpawnTimer += deltaTime;
            if (this.enemySpawnTimer >= this.enemySpawnInterval) {
                this.enemySpawnTimer = 0;
                this.spawnEnemy();
            }
            this.enemies.forEach(enemy => {
                enemy.y += this.roadScrollSpeed * deltaTime;
            });
            this.enemies = this.enemies.filter(enemy => enemy.y < size.height + 100);
            const bikeLeft = this.bikeX - this.bikeWidth / 2;
            const bikeRight = this.bikeX + this.bikeWidth / 2;
            const bikeTop = this.bikeY - this.bikeHeight / 2;
            const bikeBottom = this.bikeY + this.bikeHeight / 2;
            this.enemies.forEach((enemy) => {
                if (!enemy.isAlive)
                    return;
                const enemyLeft = enemy.x - enemy.width / 2;
                const enemyRight = enemy.x + enemy.width / 2;
                const enemyTop = enemy.y - enemy.height / 2;
                const enemyBottom = enemy.y + enemy.height / 2;
                if (bikeRight > enemyLeft && bikeLeft < enemyRight && bikeBottom > enemyTop && bikeTop < enemyBottom) {
                    this.gameOver = true;
                    this.gameState = 'game_over';
                }
            });
            if (this.raceTime >= this.raceDuration && !this.finished) {
                this.finished = true;
                this.gameState = 'victory';
                this.createVictoryEffects();
            }
        }
        else if (this.gameState === 'victory') {
            this.updateVictoryEffects(deltaTime);
        }
    }
    render(renderer) {
        if (this.gameState === 'game_over') {
            this.renderGameOver(renderer);
        }
        else if (this.gameState === 'racing') {
            this.renderRace(renderer);
        }
        else if (this.gameState === 'victory') {
            this.renderVictory(renderer);
        }
    }
    renderRace(renderer) {
        const size = renderer.getBaseSize();
        const ctx = renderer.getContext();
        renderer.clear();
        renderer.fillStyle = '#4a7c3f';
        renderer.fillRect(0, 0, this.roadX, size.height);
        renderer.fillRect(this.roadX + this.roadWidth, 0, size.width - (this.roadX + this.roadWidth), size.height);
        renderer.fillStyle = '#444444';
        renderer.fillRect(this.roadX, 0, this.roadWidth, size.height);
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 4;
        ctx.setLineDash([30, 30]);
        ctx.lineDashOffset = -this.roadScrollOffset;
        ctx.beginPath();
        ctx.moveTo(this.roadX + this.roadWidth / 2, 0);
        ctx.lineTo(this.roadX + this.roadWidth / 2, size.height);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.roadX, 0);
        ctx.lineTo(this.roadX, size.height);
        ctx.moveTo(this.roadX + this.roadWidth, 0);
        ctx.lineTo(this.roadX + this.roadWidth, size.height);
        ctx.stroke();
        ctx.fillStyle = '#2d5016';
        this.trees.forEach(tree => {
            ctx.fillRect(tree.x - 5, tree.y, 10, tree.size);
            ctx.fillStyle = '#3d7c2f';
            ctx.beginPath();
            ctx.arc(tree.x, tree.y, tree.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2d5016';
        });
        ctx.fillStyle = '#555555';
        this.rocks.forEach(rock => {
            ctx.beginPath();
            ctx.arc(rock.x, rock.y, rock.size / 2, 0, Math.PI * 2);
            ctx.fill();
        });
        this.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                this.renderingSystem.renderEnemy(enemy);
            }
        });
        this.renderBike(renderer, size);
        if (this.raceTime >= this.raceDuration - 1) {
            renderer.fillStyle = '#ffffff';
            renderer.font = 'bold 48px Arial';
            renderer.textAlign = 'center';
            renderer.fillText('ARRIVÉE', size.width / 2, 100);
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 5;
            ctx.setLineDash([20, 10]);
            ctx.beginPath();
            ctx.moveTo(this.roadX, 150);
            ctx.lineTo(this.roadX + this.roadWidth, 150);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    renderBike(renderer, size) {
        const ctx = renderer.getContext();
        if (this.bikeSpriteSheet) {
            ctx.imageSmoothingEnabled = false;
            const sx = this.bikeCurrentFrame * this.BIKE_SPRITE_SIZE;
            const sy = 0;
            const sWidth = this.BIKE_SPRITE_SIZE;
            const sHeight = this.BIKE_SPRITE_SIZE;
            const dx = this.bikeX - this.bikeWidth / 2;
            const dy = this.bikeY - this.bikeHeight / 2;
            ctx.drawImage(this.bikeSpriteSheet, sx, sy, sWidth, sHeight, dx, dy, this.bikeWidth, this.bikeHeight);
            ctx.imageSmoothingEnabled = true;
        }
        else {
            renderer.fillStyle = '#333333';
            renderer.fillRect(this.bikeX - this.bikeWidth / 2, this.bikeY - this.bikeHeight / 2, this.bikeWidth, this.bikeHeight);
        }
    }
    renderVictory(renderer) {
        const size = renderer.getBaseSize();
        const ctx = renderer.getContext();
        renderer.fillStyle = 'rgba(0, 0, 0, 0.85)';
        renderer.fillRect(0, 0, size.width, size.height);
        this.confetti.forEach(confetti => {
            ctx.save();
            ctx.translate(confetti.x, confetti.y);
            ctx.rotate(confetti.rotation);
            ctx.fillStyle = confetti.color;
            ctx.fillRect(-confetti.size / 2, -confetti.size / 2, confetti.size, confetti.size);
            ctx.restore();
        });
        this.fireworks.forEach(firework => {
            ctx.save();
            ctx.globalAlpha = firework.life;
            ctx.fillStyle = firework.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = firework.color;
            ctx.beginPath();
            ctx.arc(firework.x, firework.y, firework.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        renderer.fillStyle = 'rgba(0, 0, 0, 0.7)';
        renderer.fillRect(0, 0, size.width, size.height);
        const dialogWidth = Math.min(800, Math.max(500, size.width * 0.75));
        const dialogHeight = Math.min(280, Math.max(150, size.height * 0.35));
        const dialogX = (size.width - dialogWidth) / 2;
        const dialogY = size.height * 0.15;
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
        const message = "Bravo ! Tu fais officiellement partie du gang des vrais mâles alphas. Chevaliers de l'ombre qui combattent pour conserver leur liberté et répandre leur toxicité !";
        const lines = wrapText(ctx, message, dialogWidth - 60);
        lines.forEach((line, i) => {
            renderer.fillText(line, dialogX + 20, dialogY + 20 + (i * 25));
        });
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonX = size.width / 2 - buttonWidth / 2;
        const buttonY = dialogY + dialogHeight + 30 + (this.buttonPressed ? 3 : 0);
        renderer.fillStyle = this.buttonPressed ? '#222222' : '#333333';
        renderer.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        renderer.strokeStyle = '#ffffff';
        renderer.lineWidth = 2;
        renderer.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        renderer.fillStyle = '#ffffff';
        renderer.font = 'bold 24px Arial';
        renderer.textAlign = 'center';
        renderer.fillText('Quitter', size.width / 2, buttonY + buttonHeight / 2);
    }
    renderGameOver(renderer) {
        const size = renderer.getBaseSize();
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
    handleClick(x, y) {
        const size = this.game.getRenderer().getBaseSize();
        if (this.gameState === 'game_over') {
            const buttonWidth = 200;
            const buttonHeight = 50;
            const buttonX = size.width / 2 - buttonWidth / 2;
            const buttonY = size.height / 2 + 50;
            if (x >= buttonX && x <= buttonX + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
                this.buttonPressed = true;
                setTimeout(() => {
                    this.buttonPressed = false;
                    this.init();
                }, 150);
            }
        }
        else if (this.gameState === 'victory') {
            const dialogWidth = Math.min(800, Math.max(500, size.width * 0.75));
            const dialogHeight = Math.min(280, Math.max(150, size.height * 0.35));
            const dialogY = size.height * 0.15;
            const buttonWidth = 200;
            const buttonHeight = 50;
            const buttonX = size.width / 2 - buttonWidth / 2;
            const buttonY = dialogY + dialogHeight + 30;
            if (x >= buttonX && x <= buttonX + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
                this.buttonPressed = true;
                setTimeout(() => {
                    this.buttonPressed = false;
                    this.cleanup();
                    const scenes = this.game.scenes;
                    if (scenes) {
                        scenes.forEach((scene) => {
                            if (scene && scene.cleanup && scene !== this) {
                                scene.cleanup();
                            }
                        });
                    }
                    const playerData = this.game.getPlayerData();
                    playerData.hp = PLAYER_CONFIG.INITIAL_HP;
                    playerData.maxHp = PLAYER_CONFIG.INITIAL_HP;
                    playerData.mana = PLAYER_CONFIG.INITIAL_MANA;
                    playerData.maxMana = PLAYER_CONFIG.INITIAL_MANA;
                    playerData.strength = PLAYER_CONFIG.INITIAL_STRENGTH;
                    playerData.toxicity = PLAYER_CONFIG.INITIAL_TOXICITY;
                    playerData.endurance = PLAYER_CONFIG.INITIAL_ENDURANCE;
                    this.game.setPlayerData(playerData);
                    this.game.stop();
                    window.location.reload();
                }, 150);
            }
        }
    }
    cleanup() {
        this.cleanupInput.forEach(cleanup => cleanup());
        this.cleanupInput = [];
        if (this.clickHandler) {
            const canvas = this.game.getRenderer().getCanvas();
            canvas.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
        }
    }
}
//# sourceMappingURL=RaceScene.js.map