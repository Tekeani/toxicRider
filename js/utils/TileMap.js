class TileMap {
    constructor(width, height, tileSize = 32) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.map = [];
        this.tileset = null;
        this.tilesLoaded = false;
    }

    async loadTileset(imagePath) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.tileset = img;
                this.tilesLoaded = true;
                console.log('Tileset chargé !');
                resolve();
            };
            img.onerror = () => {
                console.error(`Impossible de charger ${imagePath}:`, new Event('error'));
                this.tilesLoaded = false;
                reject();
            };
            img.src = imagePath;
        });
    }

    generateMap() {
        // Génération simple d'une carte
        for (let y = 0; y < this.height; y++) {
            this.map[y] = [];
            for (let x = 0; x < this.width; x++) {
                // 0 = sol, 1 = obstacle
                this.map[y][x] = Math.random() > 0.9 ? 1 : 0;
            }
        }
    }

    isObstacle(x, y, width, height) {
        const startTileX = Math.floor(x / this.tileSize);
        const startTileY = Math.floor(y / this.tileSize);
        const endTileX = Math.floor((x + width) / this.tileSize);
        const endTileY = Math.floor((y + height) / this.tileSize);

        for (let ty = startTileY; ty <= endTileY; ty++) {
            for (let tx = startTileX; tx <= endTileX; tx++) {
                if (ty >= 0 && ty < this.height && tx >= 0 && tx < this.width) {
                    if (this.map[ty] && this.map[ty][tx] === 1) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    render(ctx) {
        if (!this.tilesLoaded || !this.tileset) {
            // Rendu de fallback
            ctx.fillStyle = '#90EE90';
            ctx.fillRect(0, 0, this.width * this.tileSize, this.height * this.tileSize);
            return;
        }

        // Rendu simple de la carte
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.map[y] ? this.map[y][x] : 0;
                if (tile === 0) {
                    ctx.fillStyle = '#90EE90';
                } else {
                    ctx.fillStyle = '#654321';
                }
                ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
            }
        }
    }
}

