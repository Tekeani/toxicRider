import { Scene } from './Scene';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { RenderingSystem } from '../systems/RenderingSystem';
import { TileMap } from '../utils/TileMap';
import { WAVES_CONFIG, PLAYER_CONFIG } from '../config/constants';
export class RoguelikeScene extends Scene {
    constructor(game) {
        super();
        this.player = null;
        this.enemies = [];
        this.currentWave = 0;
        this.waves = [WAVES_CONFIG.WAVE_1, WAVES_CONFIG.WAVE_2, WAVES_CONFIG.WAVE_3];
        this.allWavesComplete = false;
        this.tileMap = null;
        this.tilesLoaded = false;
        this.attackFeedbacks = [];
        this.insults = [];
        this.insultList = [
            "T'as vu tes bras ?!",
            "Et dis pas merci !",
            "Go kill yourself !",
            "Retourne chez toi si t'es pas content !",
            "Encore un a%@b# !!!",
            "T'es pas la chips la plus croustillante du paquet...",
            "Mais concentrez-vous bande de noobs !",
            "C'est toi le problème !",
            "Toi ta gueule !"
        ];
        this.usedInsults = [];
        this.waveStartTimer = 0;
        this.waveStartDelay = 5;
        this.enemyAttackCooldown = 0;
        this.enemyAttackIndex = 0;
        this._attackPressed = false;
        this._toxicityPressed = false;
        this.upgradeMenuActive = false;
        this.gameOver = false;
        this.buttonPressed = false;
        this.upgradeButtonPressed = { hp: false, toxicity: false };
        this.cleanupInput = [];
        this.clickHandler = null;
        this.game = game;
        this.renderingSystem = new RenderingSystem(game.getRenderer());
        this.setupInput();
    }
    setupInput() {
        const cleanup1 = this.game.getInputManager().onKeyDown('e', (e) => {
            if (!this._attackPressed && this.player && !this.upgradeMenuActive && !this.player.isAttacking) {
                this._attackPressed = true;
                this.player.attack();
            }
        });
        const cleanup2 = this.game.getInputManager().onKeyDown('E', (e) => {
            if (!this._attackPressed && this.player && !this.upgradeMenuActive && !this.player.isAttacking) {
                this._attackPressed = true;
                this.player.attack();
            }
        });
        const cleanup3 = this.game.getInputManager().onKeyDown('Enter', (e) => {
            if (!this._attackPressed && this.player && !this.upgradeMenuActive && !this.player.isAttacking) {
                this._attackPressed = true;
                this.player.attack();
            }
        });
        const cleanup4 = this.game.getInputManager().onKeyUp('e', () => {
            this._attackPressed = false;
        });
        const cleanup5 = this.game.getInputManager().onKeyUp('E', () => {
            this._attackPressed = false;
        });
        const cleanup6 = this.game.getInputManager().onKeyUp('Enter', () => {
            this._attackPressed = false;
        });
        const cleanup7 = this.game.getInputManager().onKeyDown('a', () => {
            if (!this._toxicityPressed && this.player && !this.upgradeMenuActive) {
                this._toxicityPressed = true;
                this.useToxicity();
            }
        });
        const cleanup8 = this.game.getInputManager().onKeyDown('A', () => {
            if (!this._toxicityPressed && this.player && !this.upgradeMenuActive) {
                this._toxicityPressed = true;
                this.useToxicity();
            }
        });
        const cleanup9 = this.game.getInputManager().onKeyDown('!', () => {
            if (!this._toxicityPressed && this.player && !this.upgradeMenuActive) {
                this._toxicityPressed = true;
                this.useToxicity();
            }
        });
        const cleanup10 = this.game.getInputManager().onKeyUp('a', () => {
            this._toxicityPressed = false;
        });
        const cleanup11 = this.game.getInputManager().onKeyUp('A', () => {
            this._toxicityPressed = false;
        });
        const cleanup12 = this.game.getInputManager().onKeyUp('!', () => {
            this._toxicityPressed = false;
        });
        const cleanup13 = this.game.getInputManager().onKeyDown('1', () => {
            if (this.upgradeMenuActive)
                this.upgradeStat('hp');
        });
        const cleanup14 = this.game.getInputManager().onKeyDown('2', () => {
            if (this.upgradeMenuActive)
                this.upgradeStat('toxicity');
        });
        const cleanup15 = this.game.getInputManager().onKeyDown('3', () => {
            if (this.upgradeMenuActive)
                this.upgradeStat('endurance');
        });
        this.cleanupInput.push(cleanup1, cleanup2, cleanup3, cleanup4, cleanup5, cleanup6, cleanup7, cleanup8, cleanup9, cleanup10, cleanup11, cleanup12, cleanup13, cleanup14, cleanup15);
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
        this.tileMap = new TileMap(32);
        this.tileMap.generateMap = function () {
            for (let y = 0; y < Math.ceil(size.height / 32); y++) {
                this.map[y] = [];
                for (let x = 0; x < Math.ceil(size.width / 32); x++) {
                    this.map[y][x] = Math.random() > 0.9 ? 1 : 0;
                }
            }
        };
        this.tileMap.generateMap();
        try {
            await this.tileMap.loadTiles('assets/images/tilesets/mana_forest/big_tree.png');
            this.tilesLoaded = true;
        }
        catch (e) {
            this.tilesLoaded = false;
        }
        this.player = new Player(size.width / 2 - 80, size.height / 2 - 150, this.game);
        this.waveStartTimer = this.waveStartDelay;
        this.currentWave = 0;
        this.enemies = [];
        this.attackFeedbacks = [];
        this.insults = [];
        this.usedInsults = [];
        this.gameOver = false;
        this.allWavesComplete = false;
        this.upgradeMenuActive = false;
    }
    spawnWave() {
        if (this.currentWave >= this.waves.length) {
            this.allWavesComplete = true;
            return;
        }
        const size = this.game.getRenderer().getBaseSize();
        let waveType = 'STRONG';
        let waveCount = 3;
        let customHp = null;
        if (this.currentWave === 0) {
            waveType = 'STRONG';
            waveCount = 3;
        }
        else if (this.currentWave === 1) {
            waveType = 'STRONG';
            waveCount = 3;
            customHp = 40;
        }
        else if (this.currentWave === 2) {
            waveType = 'STRONG';
            waveCount = 4;
            customHp = 50;
        }
        this.enemies = [];
        for (let i = 0; i < waveCount; i++) {
            const angle = (Math.PI * 2 * i) / waveCount;
            const distance = 300;
            const x = size.width / 2 + Math.cos(angle) * distance;
            const y = size.height / 2 + Math.sin(angle) * distance;
            const enemy = new Enemy(x, y, waveType, this.game);
            if (customHp !== null) {
                enemy.hp = customHp;
                enemy.maxHp = customHp;
            }
            this.enemies.push(enemy);
        }
    }
    playerAttack() {
        if (!this.player || !this.player.isAttacking)
            return;
        const player = this.player;
        const damage = 10;
        const contactRange = (player.width / 2) + 48;
        if (player.getDamageApplied())
            return;
        let targetEnemy = null;
        let closestDistance = Infinity;
        for (const enemy of this.enemies) {
            if (enemy.isAlive) {
                const playerCenterX = player.x + player.width / 2;
                const playerCenterY = player.y + player.height / 2;
                const enemyCenterX = enemy.x + enemy.width / 2;
                const enemyCenterY = enemy.y + enemy.height / 2;
                const dx = enemyCenterX - playerCenterX;
                const dy = enemyCenterY - playerCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= contactRange && distance < closestDistance) {
                    closestDistance = distance;
                    targetEnemy = enemy;
                }
            }
        }
        if (targetEnemy) {
            targetEnemy.takeDamage(damage);
            this.attackFeedbacks.push({
                text: `-${damage}`,
                x: targetEnemy.x + targetEnemy.width / 2,
                y: targetEnemy.y,
                color: '#ff0000',
                timer: 60
            });
        }
        player.setDamageApplied(true);
    }
    useToxicity() {
        if (!this.player || !this.player.useToxicity())
            return;
        const player = this.player;
        const damage = 30;
        const range = 400;
        if (this.usedInsults.length >= this.insultList.length) {
            this.usedInsults = [];
        }
        const availableInsults = this.insultList.filter(insult => !this.usedInsults.includes(insult));
        const randomIndex = Math.floor(Math.random() * availableInsults.length);
        const randomInsult = availableInsults[randomIndex];
        this.usedInsults.push(randomInsult);
        let closestEnemy = null;
        let closestDistance = Infinity;
        for (const enemy of this.enemies) {
            if (enemy.isAlive) {
                const playerCenterX = player.x + player.width / 2;
                const playerCenterY = player.y + player.height / 2;
                const enemyCenterX = enemy.x + enemy.width / 2;
                const enemyCenterY = enemy.y + enemy.height / 2;
                const dx = enemyCenterX - playerCenterX;
                const dy = enemyCenterY - playerCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= range && distance < closestDistance) {
                    closestDistance = distance;
                    closestEnemy = enemy;
                }
            }
        }
        let targetX = player.x + 100;
        let targetY = player.y;
        if (closestEnemy) {
            targetX = closestEnemy.x + closestEnemy.width / 2;
            targetY = closestEnemy.y + closestEnemy.height / 2;
        }
        this.insults.push({
            text: randomInsult,
            startX: player.x + player.width / 2,
            startY: player.y - 30,
            targetX: targetX,
            targetY: targetY,
            x: player.x + player.width / 2,
            y: player.y - 30,
            timer: 90,
            progress: 0
        });
        if (closestEnemy) {
            closestEnemy.takeDamage(damage);
            this.attackFeedbacks.push({
                text: `-${damage}`,
                x: closestEnemy.x + closestEnemy.width / 2,
                y: closestEnemy.y,
                color: '#00ffff',
                timer: 60
            });
        }
    }
    upgradeStat(stat) {
        if (!this.upgradeMenuActive)
            return;
        const playerData = this.game.getPlayerData();
        playerData.hp = playerData.maxHp;
        playerData.mana = playerData.maxMana;
        if (stat === 'hp') {
            playerData.maxHp += 10;
            playerData.hp = playerData.maxHp;
        }
        else if (stat === 'toxicity') {
            playerData.maxMana += 10;
            playerData.mana = playerData.maxMana;
        }
        this.game.setPlayerData(playerData);
        if (this.player) {
            this.player.mana = playerData.mana;
            this.player.maxMana = playerData.maxMana;
        }
        this.upgradeMenuActive = false;
        this.upgradeButtonPressed = { hp: false, toxicity: false };
        this._toxicityPressed = false;
        this._attackPressed = false;
        this.currentWave++;
        if (this.currentWave >= this.waves.length) {
            setTimeout(() => {
                this.game.nextScene();
            }, 500);
            return;
        }
        this.waveStartTimer = this.waveStartDelay;
    }
    update(deltaTime, keys) {
        if (this.gameOver)
            return;
        if (!this.upgradeMenuActive) {
            if (this.waveStartTimer > 0) {
                this.waveStartTimer -= deltaTime;
                if (this.waveStartTimer <= 0) {
                    this.spawnWave();
                    this.waveStartTimer = 0;
                }
            }
        }
        if (this.player) {
            this.player.update(deltaTime, keys);
            if (this.player.isAttacking) {
                this.playerAttack();
            }
        }
        this.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                enemy.update(deltaTime);
            }
        });
        for (let i = 0; i < this.enemies.length; i++) {
            if (!this.enemies[i].isAlive)
                continue;
            for (let j = i + 1; j < this.enemies.length; j++) {
                if (!this.enemies[j].isAlive)
                    continue;
                const enemy1 = this.enemies[i];
                const enemy2 = this.enemies[j];
                if (enemy1.overlapsWith(enemy2)) {
                    const dx = enemy2.x - enemy1.x;
                    const dy = enemy2.y - enemy1.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                    const minDistance = (enemy1.width + enemy2.width) / 2;
                    const overlap = minDistance - distance;
                    if (overlap > 0) {
                        const separationX = (dx / distance) * overlap * 0.5;
                        const separationY = (dy / distance) * overlap * 0.5;
                        enemy1.x -= separationX;
                        enemy1.y -= separationY;
                        enemy2.x += separationX;
                        enemy2.y += separationY;
                        const size = this.game.getRenderer().getBaseSize();
                        const visibleHeight = Math.floor(size.height * 0.70);
                        const maxY = visibleHeight - enemy1.height;
                        enemy1.x = Math.max(0, Math.min(size.width - enemy1.width, enemy1.x));
                        enemy1.y = Math.max(0, Math.min(maxY, enemy1.y));
                        enemy2.x = Math.max(0, Math.min(size.width - enemy2.width, enemy2.x));
                        enemy2.y = Math.max(0, Math.min(maxY, enemy2.y));
                    }
                }
            }
        }
        if (this.enemies.length > 0 && this.waveStartTimer <= 0) {
            this.enemyAttackCooldown -= deltaTime;
            if (this.enemyAttackCooldown <= 0) {
                const aliveEnemies = this.enemies.filter(e => e.isAlive);
                if (aliveEnemies.length > 0) {
                    const attackingEnemy = aliveEnemies[this.enemyAttackIndex % aliveEnemies.length];
                    if (this.player && this.player.isAlive) {
                        const playerCenterX = this.player.x + this.player.width / 2;
                        const playerCenterY = this.player.y + this.player.height / 2;
                        const enemyCenterX = attackingEnemy.x + attackingEnemy.width / 2;
                        const enemyCenterY = attackingEnemy.y + attackingEnemy.height / 2;
                        const dx = playerCenterX - enemyCenterX;
                        const dy = playerCenterY - enemyCenterY;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const contactDistance = (this.player.width / 2 + attackingEnemy.width / 2) * 0.9;
                        if (distance < contactDistance) {
                            attackingEnemy.attack(this.player);
                        }
                    }
                    this.enemyAttackIndex = (this.enemyAttackIndex + 1) % aliveEnemies.length;
                    this.enemyAttackCooldown = 1.5;
                }
            }
        }
        this.enemies = this.enemies.filter(e => e.isAlive);
        if (this.player && !this.player.isAlive && !this.gameOver) {
            if (this.player.isDeathAnimationComplete()) {
                this.gameOver = true;
            }
        }
        if (this.enemies.length === 0 && !this.allWavesComplete && this.currentWave < this.waves.length && !this.upgradeMenuActive && this.waveStartTimer <= 0) {
            this.upgradeMenuActive = true;
        }
        this.attackFeedbacks = this.attackFeedbacks.filter(feedback => {
            feedback.timer--;
            feedback.y -= 1;
            return feedback.timer > 0;
        });
        this.insults = this.insults.filter(insult => {
            insult.timer--;
            insult.progress = Math.min(1, insult.progress + 0.02);
            const dx = insult.targetX - insult.startX;
            const dy = insult.targetY - insult.startY;
            insult.x = insult.startX + dx * insult.progress;
            insult.y = insult.startY + dy * insult.progress;
            return insult.timer > 0;
        });
    }
    render(renderer) {
        const size = renderer.getBaseSize();
        renderer.clear();
        this.renderBackground(renderer, size);
        this.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                this.renderingSystem.renderEnemy(enemy);
            }
        });
        if (this.waveStartTimer > 0) {
            this.renderCountdown(renderer, size);
        }
        if (this.player) {
            this.renderingSystem.renderEntity(this.player);
        }
        this.renderFeedbacks(renderer);
        this.renderInsults(renderer);
        if (this.upgradeMenuActive) {
            this.renderUpgradeMenu(renderer, size);
        }
        if (this.gameOver) {
            this.renderGameOver(renderer, size);
        }
    }
    renderBackground(renderer, size) {
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
    renderTrees(renderer) {
        const ctx = renderer.getContext();
        const trees = [
            { x: 150, y: 200 },
            { x: 400, y: 150 },
            { x: 750, y: 180 },
            { x: 250, y: 500 },
            { x: 600, y: 550 },
            { x: 900, y: 520 }
        ];
        trees.forEach(tree => {
            ctx.fillStyle = '#8B4513';
            const trunkWidth = 40;
            const trunkHeight = 80;
            ctx.fillRect(tree.x - trunkWidth / 2, tree.y - trunkHeight, trunkWidth, trunkHeight);
            ctx.fillStyle = '#006400';
            ctx.fillRect(tree.x - 40, tree.y - trunkHeight - 40, 80, 40);
            ctx.fillRect(tree.x - 30, tree.y - trunkHeight - 80, 60, 40);
            ctx.fillRect(tree.x - 20, tree.y - trunkHeight - 110, 40, 30);
        });
    }
    renderRocks(renderer) {
        const ctx = renderer.getContext();
        const rocks = [
            { x: 80, y: 100, size: 35 },
            { x: 250, y: 80, size: 30 },
            { x: 480, y: 200, size: 40 },
            { x: 680, y: 150, size: 32 },
            { x: 920, y: 120, size: 38 },
            { x: 180, y: 350, size: 35 },
            { x: 420, y: 500, size: 30 },
            { x: 720, y: 450, size: 40 },
            { x: 880, y: 550, size: 32 }
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
    renderCountdown(renderer, size) {
        const ctx = renderer.getContext();
        renderer.fillStyle = 'rgba(0, 0, 0, 0.7)';
        renderer.fillRect(0, 0, size.width, size.height);
        renderer.fillStyle = '#fff';
        renderer.font = 'bold 32px Arial';
        renderer.textAlign = 'center';
        renderer.textBaseline = 'middle';
        const countdown = Math.ceil(this.waveStartTimer);
        renderer.fillText(`Vague d'ennemis en approche`, size.width / 2, size.height / 2 - 40);
        renderer.fillText(`${countdown}`, size.width / 2, size.height / 2 + 20);
    }
    renderFeedbacks(renderer) {
        const ctx = renderer.getContext();
        this.attackFeedbacks.forEach(feedback => {
            renderer.fillStyle = feedback.color;
            renderer.font = '16px Courier New';
            renderer.textAlign = 'center';
            renderer.fillText(feedback.text, feedback.x, feedback.y);
        });
    }
    renderInsults(renderer) {
        const ctx = renderer.getContext();
        renderer.font = 'bold 18px Arial';
        renderer.textAlign = 'center';
        renderer.textBaseline = 'middle';
        this.insults.forEach(insult => {
            renderer.fillStyle = 'rgba(0, 0, 0, 0.7)';
            renderer.fillText(insult.text, insult.x + 2, insult.y + 2);
            renderer.fillStyle = '#ffaa00';
            renderer.fillText(insult.text, insult.x, insult.y);
        });
    }
    renderUpgradeMenu(renderer, size) {
        const ctx = renderer.getContext();
        renderer.fillStyle = 'rgba(0, 0, 0, 0.8)';
        renderer.fillRect(0, 0, size.width, size.height);
        renderer.fillStyle = '#ffffff';
        renderer.font = 'bold 36px Arial';
        renderer.textAlign = 'center';
        renderer.textBaseline = 'middle';
        renderer.fillText('Choisissez votre amélioration', size.width / 2, size.height / 2 - 120);
        const buttonWidth = 250;
        const buttonHeight = 60;
        const buttonSpacing = 30;
        const totalWidth = (buttonWidth * 2) + buttonSpacing;
        const startX = size.width / 2 - totalWidth / 2;
        const buttonY = size.height / 2 + 20;
        const hpButtonX = startX;
        const hpPressOffset = this.upgradeButtonPressed.hp ? 3 : 0;
        const hpGradient = ctx.createLinearGradient(hpButtonX, buttonY + hpPressOffset, hpButtonX + buttonWidth, buttonY + hpPressOffset);
        hpGradient.addColorStop(0, this.upgradeButtonPressed.hp ? '#cc3333' : '#ff4444');
        hpGradient.addColorStop(1, this.upgradeButtonPressed.hp ? '#aa2222' : '#ff6666');
        ctx.fillStyle = hpGradient;
        ctx.fillRect(hpButtonX, buttonY + hpPressOffset, buttonWidth, buttonHeight);
        renderer.strokeStyle = '#ffffff';
        renderer.lineWidth = 2;
        renderer.strokeRect(hpButtonX, buttonY + hpPressOffset, buttonWidth, buttonHeight);
        renderer.fillStyle = '#ffffff';
        renderer.font = 'bold 24px Arial';
        renderer.fillText('+10 Santé', hpButtonX + buttonWidth / 2, buttonY + hpPressOffset + buttonHeight / 2);
        const toxicityButtonX = startX + buttonWidth + buttonSpacing;
        const toxicityPressOffset = this.upgradeButtonPressed.toxicity ? 3 : 0;
        const toxicityGradient = ctx.createLinearGradient(toxicityButtonX, buttonY + toxicityPressOffset, toxicityButtonX + buttonWidth, buttonY + toxicityPressOffset);
        toxicityGradient.addColorStop(0, this.upgradeButtonPressed.toxicity ? '#33cc33' : '#44ff44');
        toxicityGradient.addColorStop(1, this.upgradeButtonPressed.toxicity ? '#22aa22' : '#66ff66');
        ctx.fillStyle = toxicityGradient;
        ctx.fillRect(toxicityButtonX, buttonY + toxicityPressOffset, buttonWidth, buttonHeight);
        renderer.strokeRect(toxicityButtonX, buttonY + toxicityPressOffset, buttonWidth, buttonHeight);
        renderer.fillText('+10 Toxicité', toxicityButtonX + buttonWidth / 2, buttonY + toxicityPressOffset + buttonHeight / 2);
    }
    renderGameOver(renderer, size) {
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
    handleClick(x, y) {
        const size = this.game.getRenderer().getBaseSize();
        if (this.upgradeMenuActive) {
            const buttonWidth = 250;
            const buttonHeight = 60;
            const buttonSpacing = 30;
            const totalWidth = (buttonWidth * 2) + buttonSpacing;
            const startX = size.width / 2 - totalWidth / 2;
            const buttonY = size.height / 2 + 20;
            const hpButtonX = startX;
            if (x >= hpButtonX && x <= hpButtonX + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
                this.upgradeButtonPressed.hp = true;
                setTimeout(() => {
                    this.upgradeButtonPressed.hp = false;
                    this.upgradeStat('hp');
                }, 150);
                return;
            }
            const toxicityButtonX = startX + buttonWidth + buttonSpacing;
            if (x >= toxicityButtonX && x <= toxicityButtonX + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
                this.upgradeButtonPressed.toxicity = true;
                setTimeout(() => {
                    this.upgradeButtonPressed.toxicity = false;
                    this.upgradeStat('toxicity');
                }, 150);
                return;
            }
        }
        if (!this.gameOver)
            return;
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonX = size.width / 2 - buttonWidth / 2;
        const buttonY = size.height / 2 + 50;
        if (x >= buttonX && x <= buttonX + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
            this.buttonPressed = true;
            setTimeout(() => {
                this.buttonPressed = false;
                this.restartWave();
            }, 150);
        }
    }
    restartWave() {
        this.gameOver = false;
        this.buttonPressed = false;
        this.upgradeMenuActive = false;
        this.upgradeButtonPressed = { hp: false, toxicity: false };
        this.allWavesComplete = false;
        const playerData = this.game.getPlayerData();
        playerData.hp = PLAYER_CONFIG.INITIAL_HP;
        playerData.maxHp = PLAYER_CONFIG.INITIAL_HP;
        playerData.mana = PLAYER_CONFIG.INITIAL_MANA;
        playerData.maxMana = PLAYER_CONFIG.INITIAL_MANA;
        this.game.setPlayerData(playerData);
        if (this.player) {
            this.player.isAlive = true;
            this.player.mana = PLAYER_CONFIG.INITIAL_MANA;
            this.player.maxMana = PLAYER_CONFIG.INITIAL_MANA;
            this.player.isAttacking = false;
            this.player.isBlocking = false;
            this.player.isTakingDamage = false;
            this.player.attackTimer = 0;
            this.player.damageTimer = 0;
            this.player.setDamageApplied(false);
            this.player.toxicityCooldown = 0;
        }
        const size = this.game.getRenderer().getBaseSize();
        this.currentWave = 0;
        this.enemies = [];
        this.attackFeedbacks = [];
        this.insults = [];
        this.usedInsults = [];
        this.enemyAttackIndex = 0;
        this.enemyAttackCooldown = 0;
        if (this.player) {
            this.player.x = size.width / 2 - 80;
            this.player.y = size.height / 2 - 150;
        }
        this.waveStartTimer = this.waveStartDelay;
    }
    cleanup() {
        this.cleanupInput.forEach(cleanup => cleanup());
        this.cleanupInput = [];
        if (this.clickHandler) {
            const canvas = this.game.getRenderer().getCanvas();
            canvas.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
        }
        this._attackPressed = false;
        this._toxicityPressed = false;
    }
}
//# sourceMappingURL=RoguelikeScene.js.map