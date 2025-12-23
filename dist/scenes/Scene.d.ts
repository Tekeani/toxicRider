import type { Renderer } from '../core/Renderer';
import type { Keys } from '../types';
export declare abstract class Scene {
    abstract init(): Promise<void> | void;
    abstract update(deltaTime: number, keys: Keys): void;
    abstract render(renderer: Renderer): void;
    abstract cleanup(): void;
}
//# sourceMappingURL=Scene.d.ts.map