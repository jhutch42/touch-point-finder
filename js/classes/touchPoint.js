class TouchPoint {
    constructor(element, x, y, identifier, active) {
        this.x = x;
        this.y = y;
        this.clusterMember = false;
        this.element = element;
        this.identifier = identifier;
        this.membership = [];
    }

    destroy() {
        document.getElementById('touch-area').removeChild(this.element);
    }

    addMembership(key) {
        this.membership.push(key);
    }

    removeMembership(key) {
        const index = this.membership.indexOf(key);
        this.membership.splice(index, 1);
    }
}