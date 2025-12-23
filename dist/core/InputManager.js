export class InputManager {
    constructor() {
        this.keys = {};
        this.keydownHandlers = new Map();
        this.keyupHandlers = new Map();
        this.clickHandlers = new Set();
        this.setupEventListeners();
    }
    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }
    handleKeyDown(e) {
        this.keys[e.key] = true;
        const handlers = this.keydownHandlers.get(e.key);
        if (handlers) {
            handlers.forEach(handler => handler(e));
        }
    }
    handleKeyUp(e) {
        this.keys[e.key] = false;
        const handlers = this.keyupHandlers.get(e.key);
        if (handlers) {
            handlers.forEach(handler => handler(e));
        }
    }
    isKeyPressed(key) {
        return !!this.keys[key];
    }
    onKeyDown(key, handler) {
        if (!this.keydownHandlers.has(key)) {
            this.keydownHandlers.set(key, new Set());
        }
        this.keydownHandlers.get(key).add(handler);
        return () => {
            this.keydownHandlers.get(key)?.delete(handler);
        };
    }
    onKeyUp(key, handler) {
        if (!this.keyupHandlers.has(key)) {
            this.keyupHandlers.set(key, new Set());
        }
        this.keyupHandlers.get(key).add(handler);
        return () => {
            this.keyupHandlers.get(key)?.delete(handler);
        };
    }
    onClick(element, handler) {
        this.clickHandlers.add(handler);
        element.addEventListener('click', handler);
        return () => {
            element.removeEventListener('click', handler);
            this.clickHandlers.delete(handler);
        };
    }
    getKeys() {
        return { ...this.keys };
    }
    cleanup() {
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        document.removeEventListener('keyup', this.handleKeyUp.bind(this));
        this.keydownHandlers.clear();
        this.keyupHandlers.clear();
        this.clickHandlers.clear();
        this.keys = {};
    }
}
//# sourceMappingURL=InputManager.js.map