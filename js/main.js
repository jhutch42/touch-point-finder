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
    console.log(clusters);
}, { passive: false });

document.getElementById('create-constellation').addEventListener('touchstart', createConstellation);
document.getElementById('decompose').addEventListener('touchstart', () => {
    decomposeConstellation(clusters[0]);
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
                if (getClusterByKey(key)){
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
}

function findDeadPoints(touches) {
    if (touches.length !== Object.keys(touchPoints).length) {
        console.log('dead');
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
        if (clusters.length === 1) {
            button.style.display = 'block';
            display.innerHTML = Object.keys(clusters[0].points).length;
        } else {
            button.style.display = 'none';
            display.innerHTML = 0;
        }
    }
}

function decomposeConstellation(cluster) {
    let angles = [];

    Object.values(cluster.points).forEach((point, index) => {
        for (let i = 0; i < Object.keys(cluster.points).length; i++) {
            let pointA = getTouchPointByIdentifier(point);
            if (i !== index) {
                let pointB = getTouchPointByIdentifier(cluster.points[i]);
                angles.push({
                    main: index,
                    sub: i,
                    theta: getThetaRaw(getXDistance(pointA, pointB), getYDistance(pointA, pointB))
                });
            }
        }
    });


    if (state === CREATE_CONSTELLATION) {
        constellations.push(angles);
        state = NORMAL;
        document.getElementById('create-constellation-data').style.display = 'none';
    } else {
        findMatch(angles, cluster);
    }
}

function findMatch(angles, cluster) {

    if (constellations.length > 0) {
        constellations.forEach(constellation => {
            let match = true;
            Object.values(angles).forEach(angleA => {
                if (!containsAngle(constellation, angleA)) {
                    match = false;
                }
            });
            if (match) {
                cluster.circleElement.style.borderColor = 'green';
            }
        });
    }
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

function getThetaRaw(adjacent, opposite) {
    // tangent of opposite over adjacent
    return radToDegrees(Math.atan(opposite / adjacent));
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

