import { COLORS } from '../config/constants';
export class RenderingSystem {
    constructor(renderer) {
        this.renderer = renderer;
    }
    renderEntity(entity) {
        const spriteSheet = entity.getSpriteSheet();
        const animation = entity.getCurrentAnimation();
        if (!spriteSheet || !animation) {
            this.renderer.fillStyle = COLORS.PLAYER;
            this.renderer.fillRect(entity.x, entity.y, entity.width, entity.height);
            return;
        }
        const frameIndex = animation.getCurrentFrameIndex();
        const spriteSheetObj = animation.getSpriteSheet();
        const frameWidth = spriteSheetObj.frameWidth;
        const frameHeight = spriteSheetObj.frameHeight;
        const framesPerRow = spriteSheetObj.framesPerRow;
        const row = Math.floor(frameIndex / framesPerRow);
        const col = frameIndex % framesPerRow;
        const sx = col * frameWidth;
        const sy = row * frameHeight;
        const maxSourceX = spriteSheetObj.image.width - frameWidth;
        const maxSourceY = spriteSheetObj.image.height - frameHeight;
        const clampedSourceX = Math.max(0, Math.min(sx, maxSourceX));
        const clampedSourceY = Math.max(0, Math.min(sy, maxSourceY));
        this.renderer.save();
        this.renderer.imageSmoothingEnabled = false;
        if (entity.shouldFlipX()) {
            this.renderer.translate(entity.x + entity.width, entity.y);
            this.renderer.scale(-1, 1);
            this.renderer.drawImage(spriteSheetObj.image, clampedSourceX, clampedSourceY, frameWidth, frameHeight, 0, 0, entity.width, entity.height);
        }
        else {
            this.renderer.drawImage(spriteSheetObj.image, clampedSourceX, clampedSourceY, frameWidth, frameHeight, entity.x, entity.y, entity.width, entity.height);
        }
        this.renderer.restore();
    }
    renderEnemy(enemy) {
        const spriteSheet = enemy.getSpriteSheet();
        if (!spriteSheet) {
            this.renderer.fillStyle = COLORS.ENEMY;
            this.renderer.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            return;
        }
        const spriteIndex = enemy.getSpriteIndex();
        const spriteWidth = enemy.getSpriteWidth();
        const spriteHeight = enemy.getSpriteHeight();
        const spriteRow = Math.floor(spriteIndex / 8);
        const spriteCol = spriteIndex % 8;
        const sx = spriteCol * spriteWidth;
        const sy = spriteRow * spriteHeight;
        this.renderer.save();
        this.renderer.imageSmoothingEnabled = false;
        if (enemy.shouldFlipX()) {
            this.renderer.translate(enemy.x + enemy.width, enemy.y);
            this.renderer.scale(-1, 1);
            this.renderer.drawImage(spriteSheet.image, sx, sy, spriteWidth, spriteHeight, 0, 0, enemy.width, enemy.height);
        }
        else {
            this.renderer.drawImage(spriteSheet.image, sx, sy, spriteWidth, spriteHeight, enemy.x, enemy.y, enemy.width, enemy.height);
        }
        this.renderer.restore();
    }
    renderImage(image, x, y, width, height) {
        this.renderer.drawImage(image, x, y, width, height);
    }
    renderRect(x, y, width, height, color) {
        this.renderer.fillStyle = color;
        this.renderer.fillRect(x, y, width, height);
    }
    renderText(text, x, y, font, color, align = 'left') {
        this.renderer.fillStyle = color;
        this.renderer.font = font;
        this.renderer.textAlign = align;
        this.renderer.fillText(text, x, y);
    }
}
//# sourceMappingURL=RenderingSystem.js.map