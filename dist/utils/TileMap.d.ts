export declare class TileMap {
    map: number[][];
    tileSize: number;
    private tilesImage;
    tilesLoaded: boolean;
    constructor(tileSize?: number);
    loadTiles(imagePath: string): Promise<void>;
    isObstacle(x: number, y: number, width: number, height: number): boolean;
}
//# sourceMappingURL=TileMap.d.ts.map