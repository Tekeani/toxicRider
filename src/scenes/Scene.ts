import type { Renderer } from '../core/Renderer';
import type { Keys } from '../types';

export abstract class Scene {
    abstract init(): Promise<void> | void;
    abstract update(deltaTime: number, keys: Keys): void;
    abstract render(renderer: Renderer): void;
    abstract cleanup(): void;
}

