class Constellation {

    constructor(points) {
        this.points = points;
        this.angles = decompose(this.points);
    }


    compare(points) {

        const anglesB = decompose(points);
        console.log(anglesB);
        let found = null;
        anglesB.forEach(element => {
            found = false;
            this.angles.forEach(element_2 => {
                if (Math.abs(element - element_2) < 2) {
                    found = true;
                }
            });
            if (!found) {
                return found;
            }
        });
        return found;
    }

}
