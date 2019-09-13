const CLUSTER_DISTANCE_MAX = 120;
const TOUCHPOINT_SIZE = 20;
const NORMAL = 0;
const CREATE_CONSTELLATION = 1;
const ANGLE_THRESHOLD = 15;

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
    event.preventDefault();
}, { passive: false });

document.addEventListener('touchend', (event) => {
    removeTouches(event.changedTouches);
    printTouchLength(event);
    evaluateTouchData(event);
    if (event.touches.length === 0) {
        Object.values(touchPoints).forEach(point => {
            if (point !== undefined) {
                getTouchPointByIdentifier(point.identifier).destroy();
                touchPoints[point.identifier] = undefined;
            }
        });
        if (clusters.length > 0) {
            clusters.forEach(cluster => cluster.circleElement.style.display = 'none');
            clusters = [];
        }
    }
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

function removeClusters(clusters) {
    clusters.forEach(cluster => {
        if (cluster.circleElement) {
            cluster.circleElement.style.display = 'none';
        } 

        if (cluster.lines.length > 0) {
            cluster.lines.forEach(line => line.style.display = 'none');
        }
     });
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
                touchPoints[touch.identifier] = new TouchPoint(element, touch.screenX, touch.screenY, touch.identifier);
            }
        });
    }
}

function getTouchPointByIdentifier(id) {
    return touchPoints[id];
}

function removeTouches(changedTouches) {
    Object.values(changedTouches).forEach(touch => {
        getTouchPointByIdentifier(touch.identifier).destroy();
        touchPoints[touch.identifier] = undefined;
    });
}

function printTouchLength(event) {
    const touchDataEntry = document.getElementById('touchDataEntry');
    touchDataEntry.innerHTML = event.touches.length;
}

function evaluateTouchData(event) {
    printTouchLength(event);
    drawTouchPoints();
    findClusters();
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
        
        if (point !== undefined) {
            point.clusterMember = false;
            activePoints.push(point);
        }
    });

    const totalClusters = [];

    activePoints = activePoints.sort((a, b) => (a.x > b.x) ? 1 : -1);

    while (activePoints.length > 0) {
        const currentPoint = activePoints.shift();

        const possibleCluster = [];
        possibleCluster.push(currentPoint);
        activePoints.forEach(point => {
            if (!point.clusterMember) {
                if (Math.abs(currentPoint.x - point.x) <= CLUSTER_DISTANCE_MAX && Math.abs(currentPoint.y - point.y) <= CLUSTER_DISTANCE_MAX) {
                    possibleCluster.push(point);
                }
            }
        });

        if (possibleCluster.length === 3) {
            // cluster found
            const obj = {};
            possibleCluster.forEach((point, index) => {
                point.clusterMember = true;
                obj[index] = point.identifier;
            });
            totalClusters.push({ points: obj });
        }
    }


    document.getElementById('clusterDataEntry').innerHTML = totalClusters.length;
    findClusterCenter(totalClusters);
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

function findClusterCenter(totalClusters) {

    Object.values(totalClusters).forEach(cluster => {

        startingPoint = getTouchPointByIdentifier(cluster.points[0]);

        const values = {
            minX: startingPoint.x,
            minY: startingPoint.y,
            maxX: startingPoint.x,
            maxY: startingPoint.y
        }

        Object.values(cluster.points).forEach(id => {

            point = getTouchPointByIdentifier(id);


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

        cluster.details = {
            location: calcCenter(values),
            shape: calcWidthHeight(values)
        };
    });

    if (clusters.length > 0) {
        clusters.forEach(cluster => {
            document.getElementById('touch-area').removeChild(cluster.circleElement);
            // cluster.lines.forEach(line => document.getElementById('touch-area').removeChild(line));
        });
    }

    clusters = totalClusters;
    highlightClusters(clusters);
    //connectClustersWithLines(clusters);
    if (state === NORMAL) {
        clusters.forEach(cluster => decomposeConstellation(cluster));
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


function calcCenter(values) {
    return {
        x: 0.5 * (values.maxX + values.minX),
        y: 0.5 * (values.maxY + values.minY),
        left: values.minX,
        top: values.minY
    }
}

function calcWidthHeight(values) {
    return {
        width: Math.abs(values.maxX - values.minX),
        height: Math.abs(values.maxY - values.minY)
    }
}

function highlightClusters(clusters) {

    clusters.forEach(cluster => {
        const parentDiv = document.getElementById('touch-area');
        cluster.circleElement = document.createElement('div');
        parentDiv.appendChild(cluster.circleElement);
        cluster.circleElement.style.width = `${cluster.details.shape.width + 50}px`;
        cluster.circleElement.style.height = `${cluster.details.shape.height + 50}px`;
        cluster.circleElement.className = 'cluster-circle-element';
        cluster.circleElement.style.left = `${cluster.details.location.left - 25}px`;
        cluster.circleElement.style.top = `${cluster.details.location.top}px`;
    });
    console.log('test')
}


function connectClustersWithLines(clusters) {

    Object.values(clusters).forEach(cluster => {
        cluster.lines = [];

        const points = [];
        Object.values(cluster.points).forEach(point => points.push(point));

        while (points.length > 1) {

            pointA = points.shift();
            pointA = getTouchPointByIdentifier(pointA);

            x = pointA.x;
            y = pointA.y;

            points.forEach(pointB => {

                pointB = getTouchPointByIdentifier(pointB);

                const xDistance = getXDistance(pointA, pointB);
                const yDistance = getYDistance(pointA, pointB);
                const width = getHypotenuse(xDistance, yDistance);
                const theta = getTheta(xDistance, yDistance, getQuadrant(pointA, pointB));

                const parentDiv = document.getElementById('touch-area');
                const line = document.createElement('div');

                parentDiv.appendChild(line);

                line.className = 'connecting-line';
                line.style.width = `${width}px`;
                line.style.left = `${pointA.x + TOUCHPOINT_SIZE / 2}px`;
                line.style.top = `${pointA.y + TOUCHPOINT_SIZE / 2}px`;
                line.style.transform = `rotate(-${theta}deg)`;
                cluster.lines.push(line);
            });
        }
    });
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

