import { Game } from './core/Game';
import { CinematicScene } from './scenes/CinematicScene';
import { RoguelikeScene } from './scenes/RoguelikeScene';
import { RiddleScene } from './scenes/RiddleScene';
import { BossScene } from './scenes/BossScene';
import { RaceScene } from './scenes/RaceScene';
const canvas = document.getElementById('gameCanvas');
if (!canvas) {
    throw new Error('Canvas element not found');
}
const game = new Game(canvas);
async function initGame() {
    const scenes = [
        new CinematicScene(game),
        new RoguelikeScene(game),
        new RiddleScene(game),
        new BossScene(game),
        new RaceScene(game)
    ];
    await game.init(scenes);
}
window.addEventListener('DOMContentLoaded', () => {
    initGame().catch((error) => {
        console.error('Error initializing game:', error);
    });
});
//# sourceMappingURL=main.js.map