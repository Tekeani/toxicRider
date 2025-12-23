import type { Keys } from '../types';

export class InputManager {
    private keys: Keys = {};
    private keydownHandlers: Map<string, Set<(e: KeyboardEvent) => void>> = new Map();
    private keyupHandlers: Map<string, Set<(e: KeyboardEvent) => void>> = new Map();
    private clickHandlers: Set<(e: MouseEvent) => void> = new Set();

    constructor() {
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    private handleKeyDown(e: KeyboardEvent): void {
        this.keys[e.key] = true;
        const handlers = this.keydownHandlers.get(e.key);
        if (handlers) {
            handlers.forEach(handler => handler(e));
        }
    }

    private handleKeyUp(e: KeyboardEvent): void {
        this.keys[e.key] = false;
        const handlers = this.keyupHandlers.get(e.key);
        if (handlers) {
            handlers.forEach(handler => handler(e));
        }
    }

    isKeyPressed(key: string): boolean {
        return !!this.keys[key];
    }

    onKeyDown(key: string, handler: (e: KeyboardEvent) => void): () => void {
        if (!this.keydownHandlers.has(key)) {
            this.keydownHandlers.set(key, new Set());
        }
        this.keydownHandlers.get(key)!.add(handler);
        return () => {
            this.keydownHandlers.get(key)?.delete(handler);
        };
    }

    onKeyUp(key: string, handler: (e: KeyboardEvent) => void): () => void {
        if (!this.keyupHandlers.has(key)) {
            this.keyupHandlers.set(key, new Set());
        }
        this.keyupHandlers.get(key)!.add(handler);
        return () => {
            this.keyupHandlers.get(key)?.delete(handler);
        };
    }

    onClick(element: HTMLElement, handler: (e: MouseEvent) => void): () => void {
        this.clickHandlers.add(handler);
        element.addEventListener('click', handler);
        return () => {
            element.removeEventListener('click', handler);
            this.clickHandlers.delete(handler);
        };
    }

    getKeys(): Keys {
        return { ...this.keys };
    }

    cleanup(): void {
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        document.removeEventListener('keyup', this.handleKeyUp.bind(this));
        this.keydownHandlers.clear();
        this.keyupHandlers.clear();
        this.clickHandlers.clear();
        this.keys = {};
    }
}

