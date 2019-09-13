class TouchPoint {
    constructor(element, x, y, identifier, active) {
        this.x = x;
        this.y = y;
        this.clusterMember = false;
        this.element = element;
        this.identifier = identifier;
        this.active = active;
    }

    destroy() {
        document.getElementById('touch-area').removeChild(this.element);
    }
}