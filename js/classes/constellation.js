class Constellation {

    constructor(points) {
        this.points = points;
        this.angles = decompose(this.points);
    }


    compare(points) {

        const anglesB = decompose(points);
        const testAngles = [];
        anglesB.forEach(angle => testAngles.push({ angle: angle, found: false }));
        testAngles.forEach(element => {
            let notFoundYet = true;
            if (notFoundYet) {
                this.angles.forEach(element_2 => {
                    if (Math.abs(element.angle - element_2) < 3) {
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
        return count === 3;
    }

}
