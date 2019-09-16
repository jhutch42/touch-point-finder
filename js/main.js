const CLUSTER_DISTANCE_MAX = 350;
const TOUCHPOINT_SIZE = 20;
const NORMAL = 0;
const CREATE_CONSTELLATION = 1;
const ANGLE_THRESHOLD = 5;

let clusterKey = 0;

let state = NORMAL;
let point = null;

document.addEventListener('touchstart', (event) => {
    addTouchEvents(event);
    evaluateTouchData(event);
    event.preventDefault();
}, { passive: false });

document.addEventListener('touchmove', (event) => {
    updateTouchEvents(event);
    evaluateTouchData(event);
    updateClusters();
    event.preventDefault();
}, { passive: false });

document.addEventListener('touchend', (event) => {
    removeTouches(event.changedTouches);
    printTouchLength(event);
    evaluateTouchData(event);
}, { passive: false });

document.getElementById('create-constellation').addEventListener('touchstart', createConstellation);
document.getElementById('decompose').addEventListener('touchstart', () => {
    decomposeConstellation();
});

const touchPoints = {};
let clusters = [];
const constellations = [];


function updateTouchEvents(event) {
    Object.values(event.changedTouches).forEach(touch => {
        getTouchPointByIdentifier(touch.identifier).x = touch.screenX;
        getTouchPointByIdentifier(touch.identifier).y = touch.screenY;
    });
}

function updateClusters() {
    clusters.forEach(cluster => cluster.updateCluster());
}


function addTouchEvents(event) {
    if (!event.type === 'touchstart') {
        return false;
    } else {
        Object.values(event.changedTouches).forEach(touch => {
            if (getTouchPointByIdentifier(touch.identifier) === undefined) {
                const element = document.createElement('div');
                element.className = 'touchpoint';
                document.getElementById('touch-area').appendChild(element);
                touchPoints[touch.identifier] = new TouchPoint(element, touch.screenX, touch.screenY, touch.identifier, true);
            }
        });
    }
}

function getTouchPointByIdentifier(id) {
    return touchPoints[id];
}

function removeTouches(changedTouches) {
    Object.values(changedTouches).forEach(touch => {
        const point = getTouchPointByIdentifier(touch.identifier);
        if (point !== undefined) {
            point.membership.forEach(key => {
                if (getClusterByKey(key)) {
                    getClusterByKey(key).destroy();
                }
            });
            point.destroy();
            delete touchPoints[touch.identifier];
        }
    });
}

function printTouchLength(event) {
    const touchDataEntry = document.getElementById('touchDataEntry');
    touchDataEntry.innerHTML = event.touches.length;
}

function evaluateTouchData(event) {
    findDeadPoints(event.touches);
    printTouchLength(event);
    drawTouchPoints();
    findClusters();
    findMatch();
}

function findDeadPoints(touches) {
    if (touches.length !== Object.keys(touchPoints).length) {
        console.log('dead points');
    }
}


function drawTouchPoints() {
    Object.values(touchPoints).forEach(point => {
        if (point !== undefined) {
            point.element.style.left = `${point.x}px`;
            point.element.style.top = `${point.y}px`;
        }
    });
}

function findClusters() {
    // Only look for clusters greater than 3 in size
    let activePoints = [];

    Object.values(touchPoints).forEach(point => {
        if (point !== undefined && point.membership.length === 0) {
            activePoints.push(point);
        }
    });

    activePoints = activePoints.sort((a, b) => (a.x > b.x) ? 1 : -1);

    while (activePoints.length > 0) {

        const currentPoint = activePoints.shift();
        const possibleCluster = [];

        possibleCluster.push(currentPoint);

        activePoints.forEach(point => {
            if (Math.abs(currentPoint.x - point.x) <= CLUSTER_DISTANCE_MAX && Math.abs(currentPoint.y - point.y) <= CLUSTER_DISTANCE_MAX) {
                possibleCluster.push(point);
            }
        });

        if (possibleCluster.length > 2) {
            clusterKey++;
            // cluster found
            const obj = {};
            possibleCluster.forEach((point, index) => {
                obj[index] = point.identifier;
                point.addMembership(clusterKey);
            });
            clusters.push(new Cluster(possibleCluster, obj, clusterKey));
        }
    }


    document.getElementById('clusterDataEntry').innerHTML = clusters.length;

    if (state === CREATE_CONSTELLATION) {
        const button = document.getElementById('decompose');
        const display = document.getElementById('number-of-points-in-constellation');
        if (clusters.length > 0) {
            button.style.display = 'block';
            display.innerHTML = clusters.length;
        } else {
            button.style.display = 'none';
            display.innerHTML = 0;
        }
    }
}

function decomposeConstellation() {
    clusters.forEach(cluster => constellations.push(new Constellation(cluster.points)));
}

function findMatch(cluster) {
    clusters.forEach(cluster => {
        constellations.forEach(constellation => {
            if (constellation.compare(cluster.points)) {
                cluster.circleElement.style.borderColor = 'green';
            } else {
                cluster.circleElement.style.borderColor = 'orange';
            }
        });
    });
}


function containsAngle(constellation, angleA) {
    let found = false;
    Object.values(constellation).forEach(angleB => {
        if (compareAngles(angleA.theta, angleB.theta, ANGLE_THRESHOLD)) {
            found = true;
        }
    });
    return found;
}

function compareAngles(a, b, threshold) {
    return (Math.abs(a - b) <= threshold);
}

function getQuadrant(a, b) {
    let quadrant = 0;
    if (a.x < b.x && a.y > b.y) {
        quadrant = 1;
    } else if (a.x > b.x && a.y > b.y) {
        quadrant = 2;
    } else if (a.x > b.x && a.y < b.y) {
        quadrant = 3;
    } else {
        quadrant = 4;
    }

    return quadrant;
}

function getTheta(adjacent, opposite, quadrant) {
    // tangent of opposite over adjacent
    let theta = Math.atan(opposite / adjacent);
    switch (quadrant) {
        case 2:
            theta = Math.PI - theta;
            break;
        case 3:
            theta += Math.PI;
            break;
        case 4:
            theta = 2 * Math.PI - theta;
            break;
    }
    return radToDegrees(theta);
}

function radToDegrees(theta) {
    return theta * 180 / Math.PI;
}

function getHypotenuse(adjacent, opposite) {
    return Math.sqrt(Math.pow(adjacent, 2) + Math.pow(opposite, 2));
}

function getXDistance(a, b) {
    return Math.abs(a.x - b.x);
}

function getYDistance(a, b) {
    return Math.abs(a.y - b.y);
}

function createConstellation() {
    document.getElementById('create-constellation-data').style.display = 'block';
    state = CREATE_CONSTELLATION;
}

function getClusterByKey(key) {
    let result = null;
    clusters.forEach(cluster => {
        if (cluster.clusterKey === key) {
            result = cluster;
        }
    });
    return result;
}

function decompose(input) {

    if (state === CREATE_CONSTELLATION) {
        document.getElementById('create-constellation-data').style.display = 'none';
        state = NORMAL;
    }
    
    if (input.length === 3) {
        let tempAngles = [];

        const points = JSON.parse(JSON.stringify(input));
        let theta = null;

        points.forEach(pointA => {
            points.forEach(pointB => {
                if (pointA.identifier !== pointB.identifier) {
                    const xDistance = getXDistance(pointA, pointB);
                    const yDistance = getYDistance(pointA, pointB);
                    theta = getTheta(xDistance, yDistance, getQuadrant(pointA, pointB));
                    tempAngles.push({ a: pointA.identifier, ax: pointA.x, b: pointB.identifier, bx: pointB.x, theta: theta });
                }
            });
        });

        tempAngles = tempAngles.sort((a, b) => (a.x > b.x) ? 1 : -1);
        let tempAngles2 = [];
        for (let i = 0; i < tempAngles.length; i += 2) {
            let calculatedAngle = Math.abs(tempAngles[i].theta - tempAngles[i + 1].theta);
            if (calculatedAngle > 180) {
                calculatedAngle = 360 - calculatedAngle;
            }
            tempAngles2.push(calculatedAngle);

        }
        return tempAngles2;
    }
}

