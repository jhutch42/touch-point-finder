class TouchPoint {
    constructor(element, x, y, identifier) {
        this.x = x;
        this.y = y;
        this.clusterMember = false;
        this.element = element;
        this.identifier = identifier;
    }

    destroy() {
        document.getElementById('touch-area').removeChild(this.element);
    }
}