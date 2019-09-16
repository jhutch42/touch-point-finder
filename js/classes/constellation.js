class Constellation {

    constructor(points) {
        this.points = points;
        this.angles = decompose(this.points);
        this.knownConstellationElement = this.drawToKnownConstellationsArea();
    }


    compare(points) {

        const anglesB = decompose(points);
        const testAngles = [];
        anglesB.forEach(angle => testAngles.push({ angle: angle, found: false }));
        testAngles.forEach(element => {
            let notFoundYet = true;
            if (notFoundYet) {
                this.angles.forEach(element_2 => {
                    if (Math.abs(element.angle - element_2) < angleThreshold) {
                        if (!element.found) {
                            element.found = true;  // Mark this as found
                            notFoundYet = false;   // Found the Angle
                        }
                    }
                });
            }
        });

        let count = 0;
        testAngles.forEach(angle => {
            if (angle.found) {
                count++;
            }
        });

        if (count === 3) {
            this.knownConstellationElement.style.backgroundColor = 'green';
        } else {
            this.knownConstellationElement.style.backgroundColor = 'white';
        }
        return count === 3;
    }

    drawToKnownConstellationsArea() {
        const element = document.createElement('div');
        const parent = document.getElementById('known-constellations-area');
        element.className = 'known-cluster-box';
        parent.appendChild(element);

        this.points.forEach(point => {
            const pointElement = document.createElement('div');
            pointElement.className = 'touchpoint';
            const position = this.scalePoint(element.getBoundingClientRect(), point);
            element.appendChild(pointElement);
            pointElement.style.left = `${position.x}px`;
            pointElement.style.top = `${position.y}px`;
            pointElement.style.width = 5 + 'px';
            pointElement.style.height = 5 + 'px';
        });
        return element;
    }

    scalePoint(parentBounds, point) {
        const maxWidth = window.innerWidth;
        const maxHeight = window.innerHeight;
        const boxWidth = parentBounds.width;
        const boxHeight = parentBounds.height;
        const widthPercentage = boxWidth / maxWidth;
        const heightPercentage = boxHeight / maxHeight;
        const x = point.x * widthPercentage;
        const y = point.y * heightPercentage;

        return {x: x, y: y};
    }

}
