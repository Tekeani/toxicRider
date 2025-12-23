export class TileMap {
    constructor(tileSize = 32) {
        this.map = [];
        this.tileSize = 32;
        this.tilesImage = null;
        this.tilesLoaded = false;
        this.tileSize = tileSize;
    }
    async loadTiles(imagePath) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.tilesImage = img;
                this.tilesLoaded = true;
                resolve();
            };
            img.onerror = () => {
                reject();
            };
            img.src = imagePath;
        });
    }
    isObstacle(x, y, width, height) {
        const tileX1 = Math.floor(x / this.tileSize);
        const tileY1 = Math.floor(y / this.tileSize);
        const tileX2 = Math.floor((x + width) / this.tileSize);
        const tileY2 = Math.floor((y + height) / this.tileSize);
        for (let ty = tileY1; ty <= tileY2; ty++) {
            for (let tx = tileX1; tx <= tileX2; tx++) {
                if (ty >= 0 && ty < this.map.length && tx >= 0 && tx < this.map[ty].length) {
                    if (this.map[ty][tx] === 1) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}
//# sourceMappingURL=TileMap.js.map