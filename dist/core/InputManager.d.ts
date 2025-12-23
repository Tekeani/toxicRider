import type { Keys } from '../types';
export declare class InputManager {
    private keys;
    private keydownHandlers;
    private keyupHandlers;
    private clickHandlers;
    constructor();
    private setupEventListeners;
    private handleKeyDown;
    private handleKeyUp;
    isKeyPressed(key: string): boolean;
    onKeyDown(key: string, handler: (e: KeyboardEvent) => void): () => void;
    onKeyUp(key: string, handler: (e: KeyboardEvent) => void): () => void;
    onClick(element: HTMLElement, handler: (e: MouseEvent) => void): () => void;
    getKeys(): Keys;
    cleanup(): void;
}
//# sourceMappingURL=InputManager.d.ts.map