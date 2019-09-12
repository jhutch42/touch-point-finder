const CLUSTER_DISTANCE_MAX = 250;

document.addEventListener('touchstart', (event) => {
    evaluateTouchData(event);
    event.preventDefault();
}, { passive: false });

document.addEventListener('touchmove', (event) => {
    evaluateTouchData(event);
    event.preventDefault();
}, { passive: false });

document.addEventListener('touchend', (event) => {
    evaluateTouchData(event);
    event.preventDefault();
}, { passive: false });

const touchPoints = [];
let clusters = [];

function createTouchPoints() {
    for (let i = 0; i < 10; i++) {

        const element = document.createElement('div');
        element.className = 'touchpoint';
        document.getElementById('touch-area').appendChild(element);

        touchPoints.push(
            {
                'element': element,
                'display': 'none',
                'x': -100,
                'y': -100,
                'clusterMember': false
            }
        );
    }

}

function evaluateTouchData(event) {
    const touchDataEntry = document.getElementById('touchDataEntry');
    touchDataEntry.innerHTML = event.touches.length;
    clearTouchPoints();

    Object.values(event.touches).forEach((touchPoint, index) => {
        const point = touchPoints[index];

        point.display = 'block';
        point.x = touchPoint.screenX;
        point.y = touchPoint.screenY;
    });

    drawTouchPoints();
    findClusters();
}

function drawTouchPoints() {
    Object.values(touchPoints).forEach(point => {
        point.element.style.display = point.display;

        if (point.display === 'none') {
            point.x = -100;
            point.y = -100;
        }
        point.element.style.left = `${point.x}px`;
        point.element.style.top = `${point.y}px`;
    });
}

function clearTouchPoints() {


    Object.values(touchPoints).forEach(point => {
        point.display = 'none';
        point.clusterMember = false;
    });
}

function findClusters() {
    // Only look for clusters greater than 3 in size
    let activePoints = [];
    const totalClusters = [];

    Object.values(touchPoints).forEach(point => {
        if (point.display === 'block') {
            activePoints.push(point);
        }
    });

    activePoints = activePoints.sort((a, b) => (a.x > b.x) ? 1 : -1);

    if (activePoints.length > 2) {
        while (activePoints.length > 0) {
            const currentPoint = activePoints.shift();

            if (!currentPoint.clusterMember) {
                const possibleCluster = [];
                possibleCluster.push(currentPoint);
                activePoints.forEach(point => {
                    if (Math.abs(currentPoint.x - point.x) <= CLUSTER_DISTANCE_MAX && Math.abs(currentPoint.y - point.y) <= CLUSTER_DISTANCE_MAX) {
                        possibleCluster.push(point);
                    }
                });

                if (possibleCluster.length > 2) {
                    // cluster found
                    possibleCluster.forEach(point => point.clusterMember = true);
                    totalClusters.push(possibleCluster);
                }
            }
        }
    }

    document.getElementById('clusterDataEntry').innerHTML = totalClusters.length;
    findClusterCenter(totalClusters);
}

function findClusterCenter(totalClusters) {

    totalClusters.forEach(cluster => {

        const values = {
            minX: cluster[0].x,
            minY: cluster[0].y,
            maxX: cluster[0].x,
            maxY: cluster[0].y
        }

        cluster.forEach(point => {
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
            cluster.lines.forEach(line => document.getElementById('touch-area').removeChild(line));
        });
    }

    clusters = totalClusters;
    highlightClusters(clusters);
    connectClustersWithLines(clusters);
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
}


function connectClustersWithLines(clusters) {
    clusters.forEach(cluster => {
        cluster.lines = [];
        const points = cluster;

        while (points.length > 1) {
            pointA = points.shift();
            x = pointA.x;
            y = pointA.y;

            points.forEach(pointB => {

                const xDistance = getXDistance(pointA, pointB);
                const yDistance = getYDistance(pointA, pointB);
                const width = getHypotenuse(xDistance, yDistance);
                const theta = getTheta(xDistance, yDistance, getQuadrant(pointA, pointB));

                const parentDiv = document.getElementById('touch-area');
                const line = document.createElement('div');

                parentDiv.appendChild(line);

                line.className = 'connecting-line';
                line.style.width = `${width}px`;
                line.style.left = `${pointA.x}px`;
                line.style.top = `${pointA.y}px`;
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

window.onload = createTouchPoints;
