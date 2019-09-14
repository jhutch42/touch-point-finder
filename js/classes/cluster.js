class Cluster {

    constructor(points, pointIdentifiers, clusterKey) {
        this.clusterKey = clusterKey;
        this.circleElement = this.createCircleElement();
        this.pointIdentifiers = pointIdentifiers;
        this.points = points;
        this.edgeValues = this.getEdgeValues();
        this.center = this.getCenter();
        this.width = this.getWidth();
        this.height = this.getHeight();
        this.left = this.edgeValues.minX;
        this.top = this.edgeValues.minY;
        this.lines = this.createLines();
        this.connectPointsWithLines();
        this.moveCircle();
    }

    updateCluster() {
        this.edgeValues = this.getEdgeValues();
        this.center = this.getCenter();
        this.width = this.getWidth();

        if (this.width < CLUSTER_DISTANCE_MAX) {
            this.height = this.getHeight();
            this.left = this.edgeValues.minX;
            this.top = this.edgeValues.minY;
            this.connectPointsWithLines();
            this.moveCircle();
        } else {
            this.destroy();
        }

        return this.width < CLUSTER_DISTANCE_MAX;

    }

    createCircleElement() {
        const e = document.createElement('div');
        document.getElementById('touch-area').appendChild(e);
        e.className = 'cluster-circle-element';
        return e;
    }

    moveCircle() {
        this.circleElement.style.width = `${this.width + 50}px`;
        this.circleElement.style.height = `${this.height + 50}px`;
        this.circleElement.className = 'cluster-circle-element';
        this.circleElement.style.left = `${this.left - 25}px`;
        this.circleElement.style.top = `${this.top}px`;
    }

    createLines() {

        const points = JSON.parse(JSON.stringify(this.points));
        const lines = [];

        while (points.length > 1) {
            points.shift();
            points.forEach(pointB => {
                const line = document.createElement('div');
                document.getElementById('touch-area').appendChild(line);
                lines.push(line);
            });
        }
        return lines;
    }

    connectPointsWithLines() {

        const lines = [];

        const points = JSON.parse(JSON.stringify(this.points));

        let index = 0;

        while (points.length > 1) {

            const pointA = points.shift();

            const x = pointA.x;
            const y = pointA.y;

            points.forEach(pointB => {
                const line = this.lines[index];
                const xDistance = getXDistance(pointA, pointB);
                const yDistance = getYDistance(pointA, pointB);
                const width = getHypotenuse(xDistance, yDistance);
                const theta = getTheta(xDistance, yDistance, getQuadrant(pointA, pointB));

                line.className = 'connecting-line';
                line.style.width = `${width}px`;
                line.style.left = `${pointA.x + TOUCHPOINT_SIZE / 2}px`;
                line.style.top = `${pointA.y + TOUCHPOINT_SIZE / 2}px`;
                line.style.transform = `rotate(-${theta}deg)`;
                index++;
            });
        }
    }

    getCenter() {
        return {
            x: 0.5 * (this.edgeValues.maxX + this.edgeValues.minX),
            y: 0.5 * (this.edgeValues.maxY + this.edgeValues.minY)
        }
    }

    getWidth() {
        return Math.abs(this.edgeValues.maxX - this.edgeValues.minX);
    }

    getHeight() {
        return Math.abs(this.edgeValues.maxY - this.edgeValues.minY);
    }


    getEdgeValues() {
        const values = {
            minX: this.points[0].x,
            minY: this.points[0].y,
            maxX: this.points[0].x,
            maxY: this.points[0].y
        }
        this.points.forEach(point => {
            if (point.x < values.minX) {
                values.minX = point.x;
            } else if (point.x > values.maxX) {
                values.maxX = point.x;
            }
            if (point.y < values.minY) {
                values.minY = point.y;
            } else if (point.y > values.maxY) {
                values.maxY = point.y;
            }
        });
        return values;
    }

    destroy() {
        console.log(this.clusterKey);
        this.lines.forEach(line => line.style.display = 'none');
        this.circleElement.style.display = 'none';
        console.log(this.lines);
        this.points.forEach(point => {
            if (point !== undefined) {
                point.clusterMember = false;
                point.membership.splice(point.membership.indexOf(this.clusterKey), 1);
            }
        });
        clusters.splice(clusters.indexOf(this), 1);
    }
}