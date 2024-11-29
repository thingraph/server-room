import * as THREE from 'three';
import { createDoor, createDoubleDoor, createWindow } from './createDoor.js';
import { Earcut } from 'three/src/extras/Earcut.js';
import { textureLoader } from "../Common";

const envMap = textureLoader.load("./assets/env/envmap2.jpg");
envMap.mapping = THREE.EquirectangularReflectionMapping;
envMap.colorSpace = THREE.SRGBColorSpace;

export function createWall(json) {
    const position = json.position || [0, 0, 0];

    const wallHeight = json.height || 260;
    const wallDepth = json.depth || 30;
    let wallData = json.data || [];
    const isCCW = isClockWise(wallData);
    if (!isCCW) {
        wallData = wallData.reverse();
    }
    const closedWall = json.closed;

    const topColor = json.topColor || 0xdbdee5;
    const bottomColor = json.bottomColor || 0xffffff;
    const insideColor = json.insideColor || 0xEFEFEF;
    const outsideColor = json.outsideColor || 0xDCE8E9;

    const outsideTexture = json.outsideTexture || {};
    const insideTexture = json.insideTexture || {};
    const floorTexture = json.floorTexture || {};
    const roofTexture = json.roofTexture || {};

    const outsideWallImage = textureLoader.load(outsideTexture.map || "./assets/wall/wall.png");
    outsideWallImage.wrapS = THREE.RepeatWrapping;
    outsideWallImage.wrapT = THREE.RepeatWrapping;
    outsideWallImage.repeat.set(...outsideTexture.repeat || [5, 1]);

    const insideWallImage = textureLoader.load(insideTexture.map || "./assets/env/inside_lightmap.jpg");
    insideWallImage.wrapS = THREE.RepeatWrapping;
    insideWallImage.wrapT = THREE.RepeatWrapping;
    insideWallImage.repeat.set(...insideTexture.repeat || [5, 1]);

    const insideLightmap = textureLoader.load(json.insideLightMap || "./assets/env/inside_lightmap.jpg");
    insideLightmap.flipY = false;
    insideLightmap.colorSpace = THREE.SRGBColorSpace;

    const outsideLightmap = textureLoader.load(json.outsideLightMap || "./assets/env/outside_lightmap.jpg");
    outsideLightmap.colorSpace = THREE.SRGBColorSpace;
    // outsideLightmap.flipY = false;

    // 玻璃墙
    const transparent = json.transparent || false;

    const floorMap = textureLoader.load(floorTexture.map || "./assets/wall/floor.jpg");
    floorMap.wrapS = THREE.RepeatWrapping;
    floorMap.wrapT = THREE.RepeatWrapping;
    floorMap.repeat.set(...floorTexture.repeat || [5, 5]);
    const roofMap = textureLoader.load(roofTexture.map || "./assets/wall/floor.jpg");
    roofMap.wrapS = THREE.RepeatWrapping;
    roofMap.wrapT = THREE.RepeatWrapping;
    roofMap.repeat.set(...roofTexture.repeat || [5, 5]);

    const children = json.children || [];

    const wall = new THREE.Group();
    const materialSide = THREE.FrontSide;

    const offset = wallDepth / 2;

    const edges = [];
    let firstEdge, prevEdge;
    for (let i = 0; i < wallData.length; i++) {
        const start = wallData[i];
        const isLast = i + 1 === wallData.length;
        if (!closedWall && isLast) {
            break;
        }
        const end = wallData[(i + 1) % wallData.length];

        const edge = {
            current: [start, end],
            children: [],
        }
        for (let c = 0; c < children.length; c++) {
            const child = children[c];
            const pos = child.position;
            if (pointOnLine([pos[0], pos[2]], start, end)) {
                let obj;
                if (child.type === "SingleDoor") {
                    obj = createDoor(child);
                } else if (child.type === "DoubleDoor") {
                    obj = createDoubleDoor(child);
                } else if (child.type === "Window") {
                    obj = createWindow(child);
                }
                if (obj) {
                    const box = new THREE.Box3().setFromObject(obj);
                    const size = box.getSize(new THREE.Vector3());
                    edge.children.push({
                        size,
                        position: obj.position
                    });
                    const angle = getAngle(1, 0, end[0] - start[0], end[1] - start[1]);
                    obj.rotateY(angle);
                    wall.add(obj);
                }
            }
        }
        if (i === 0) {
            firstEdge = edge;
        } else {
            edge.prev = prevEdge;
            prevEdge.next = edge;
            if (i + 1 == wallData.length) {
                firstEdge.prev = edge;
                edge.next = firstEdge;
            }
        }
        prevEdge = edge;
        edges.push(edge);
    }
    console.log(edges);

    const floorPoints = [];
    for (let i = 0; i < edges.length; i++) {
        const current = edges[i];

        const interiorStartVec = getHalfAngleVector(current.prev, current, offset);
        const interiorEndVec = getHalfAngleVector(current, current.next, offset);

        const exteriorStartVec = getHalfAngleVector(current.prev, current, offset);
        const exteriorEndVec = getHalfAngleVector(current, current.next, offset);

        const v1Start = current.current[0];
        const v1End = current.current[1];

        const interiorStart = [v1Start[0] - interiorStartVec[0], v1Start[1] - interiorStartVec[1]];
        const interiorEnd = [v1End[0] - interiorEndVec[0], v1End[1] - interiorEndVec[1]];

        const exteriorStart = [v1Start[0] + exteriorStartVec[0], v1Start[1] + exteriorStartVec[1]];
        const exteriorEnd = [v1End[0] + exteriorEndVec[0], v1End[1] + exteriorEndVec[1]];

        // build wall
        // inner wall   reverse point
        const innerMat = new THREE.MeshPhongMaterial({ color: insideColor, specular: new THREE.Color(0.06, 0.06, 0.06), side: materialSide, map: insideWallImage, lightMap: insideLightmap, transparent });
        wall.add(createMesh([interiorEnd, interiorStart], wallHeight, current.children, innerMat));
        // outer wall
        const outerMat = new THREE.MeshPhongMaterial({ color: outsideColor, specular: new THREE.Color(0.06, 0.06, 0.06), side: materialSide, map: outsideWallImage, lightMap: outsideLightmap, transparent });
        wall.add(createMesh([exteriorStart, exteriorEnd], wallHeight, current.children, outerMat));
        if (transparent) {
            innerMat.envMap = envMap;
            outerMat.envMap = envMap;
        }

        // bottom wall
        wall.add(createPlaneMesh([interiorStart, interiorEnd, exteriorEnd, exteriorStart], 0, new THREE.MeshBasicMaterial({ color: bottomColor, side: materialSide })));
        // top wall
        wall.add(createPlaneMesh([interiorStart, interiorEnd, exteriorEnd, exteriorStart].reverse(), wallHeight, new THREE.MeshBasicMaterial({ color: topColor, side: materialSide })));

        // // 内踢脚线
        // wall.add(createMesh([interiorEnd, interiorStart], 30, current.children, new THREE.MeshBasicMaterial({ color: 0x333640, side: materialSide, aoMap: insideLightmap, aoMapIntensity: 1 })));
        // // 外踢脚线
        // wall.add(createMesh([exteriorStart, exteriorEnd], 30, current.children, new THREE.MeshBasicMaterial({ color: 0x333640, side: materialSide, aoMap: outsideLightmap, aoMapIntensity: 1 })));

        floorPoints.push(exteriorStart);
    }
    // floor
    const floor = createPlaneMesh(floorPoints, 0, new THREE.MeshBasicMaterial({ color: bottomColor, side: THREE.DoubleSide, map: floorMap }));
    floor.receiveShadow = true;
    wall.add(floor);
    // roof
    wall.add(createPlaneMesh(floorPoints, wallHeight, new THREE.MeshBasicMaterial({ color: bottomColor, side: THREE.BackSide, map: roofMap })));

    // console.log(wall);
    return wall;
}

function compuerTransform(transform, invTransform, start, end) {
    const angle = getAngle(1, 0, end[0] - start[0], end[1] - start[1]);
    const tt = new THREE.Matrix4();
    tt.makeTranslation(-start[0], 0, -start[1]);
    const tr = new THREE.Matrix4();
    tr.makeRotationY(-angle);
    transform.multiplyMatrices(tr, tt);
    invTransform.copy(transform).invert();
}

function createMesh(edge, height, holes, material) {
    let start = edge[0];
    let end = edge[1];

    const transform = new THREE.Matrix4();
    const invTransform = new THREE.Matrix4();
    compuerTransform(transform, invTransform, start, end);

    const points = [
        new THREE.Vector3(start[0], 0, start[1]),
        new THREE.Vector3(end[0], 0, end[1]),
        new THREE.Vector3(end[0], height, end[1]),
        new THREE.Vector3(start[0], height, start[1]),
    ].map(v => v.applyMatrix4(transform));

    // shape基于xy平面处理的 转到xy平面处理挖洞hole
    const shape = new THREE.Shape([
        new THREE.Vector2(points[0].x, points[0].y),
        new THREE.Vector2(points[1].x, points[1].y),
        new THREE.Vector2(points[2].x, points[2].y),
        new THREE.Vector2(points[3].x, points[3].y),
    ]);

    // holes
    for (let i = 0; i < holes.length; i++) {
        const hole = holes[i];

        const size = hole.size;
        const halfSize = new THREE.Vector3(size.x / 2, size.y / 2, size.z / 2);
        const pos = hole.position.clone().applyMatrix4(transform);
        const max = pos.clone().sub(halfSize);
        const min = pos.clone().add(halfSize);

        shape.holes.push(new THREE.Path([
            new THREE.Vector2(min.x, min.y),
            new THREE.Vector2(max.x, min.y),
            new THREE.Vector2(max.x, max.y),
            new THREE.Vector2(min.x, max.y)
        ]));
    }
    const geometry = new THREE.ShapeGeometry(shape);

    // invert 转换回来
    geometry.getAttribute("position").applyMatrix4(invTransform);

    const posAttribute = geometry.getAttribute("position");
    const uvs = [];
    const totalDistance = distance(start[0], start[1], end[0], end[1]);
    function vertexToUv(vertex) {
        var x = distance(start[0], start[1], vertex.x, vertex.z) / totalDistance;
        var y = vertex.y / height;
        return [x, y];
    }
    for (let i = 0, l = posAttribute.count; i < l; i++) {
        const v = new THREE.Vector3();
        v.fromBufferAttribute(posAttribute, i);
        uvs.push(...vertexToUv(v));
    }
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute("uv1", new THREE.Float32BufferAttribute(uvs, 2));

    geometry.computeVertexNormals();
    geometry.normalizeNormals();

    return new THREE.Mesh(geometry, material);
}

function createPlaneMesh(points, height, material) {
    const vectors = points.map(p => new THREE.Vector3(p[0], height, p[1]));
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(vectors);
    const index = Earcut.triangulate(points.flat(), []);
    if (isClockWise(points)) {
        index.reverse();
    }
    geometry.setIndex(index);
    const uvs = generateUvByVectors(vectors);
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();
    return new THREE.Mesh(geometry, material);
}


function getAngle(x1, y1, x2, y2) {
    const tDot = x1 * x2 + y1 * y2;
    const tDet = x1 * y2 - y1 * x2;
    let tAngle = -Math.atan2(tDet, tDot);  // (-pi to pi)

    if (tAngle < 0) { // to 0 ~ pi
        tAngle += 2 * Math.PI;
    }
    return tAngle;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt(
        Math.pow(x2 - x1, 2) +
        Math.pow(y2 - y1, 2));
}

function getHalfAngleVector(edge1, edge2, offset) {
    let v1Start, v1End, v2Start, v2End;
    if (edge1) {
        v1Start = edge1.current[0];
        v1End = edge1.current[1];
    } else {
        const s = edge2.current[0];
        const e = edge2.current[1];

        v1Start = [s[0] - (e[0] - s[0]), s[1] - (e[1] - s[1])];
        v1End = edge2.current[0];
    }
    if (edge2) {
        v2Start = edge2.current[0];
        v2End = edge2.current[1];
    } else {
        const s = edge1.current[0];
        const e = edge1.current[1];

        v2Start = edge1.current[1];
        v2End = [e[0] + (e[0] - s[0]), e[1] + (e[1] - s[1])];
    }

    const theta = getAngle(v1Start[0] - v1End[0], v1Start[1] - v1End[1], v2End[0] - v1End[0], v2End[1] - v1End[1]);

    // cosine and sine of half angle
    var cs = Math.cos(theta / 2.0);
    var sn = Math.sin(theta / 2.0);

    // rotate v2
    var v2dx = v2End[0] - v2Start[0];
    var v2dy = v2End[1] - v2Start[1];

    var vx = v2dx * cs - v2dy * sn;
    var vy = v2dx * sn + v2dy * cs;

    // normalize
    var mag = distance(0, 0, vx, vy);
    var desiredMag = offset / sn;
    var scalar = desiredMag / mag;

    return [vx * scalar, vy * scalar];
}

function isClockWise(points) {
    const n = points.length;
    let a = 0.0;
    for (let p = n - 1, q = 0; q < n; p = q++) {
        a += points[p][0] * points[q][1] - points[q][0] * points[p][1];
    }
    return a * 0.5 < 0;
}

function pointOnLine(point, start, end) {
    const v1 = (point[0] - start[0]) * (end[1] - start[1]);
    const v2 = (end[0] - start[0]) * (point[1] - start[1]);
    if (v1 == v2  //叉乘 
        //保证Q点坐标在pi,pj之间 
        && Math.min(start[0], end[0]) <= point[0] && point[0] <= Math.max(start[0], end[0])
        && Math.min(start[1], end[1]) <= point[1] && point[1] <= Math.max(start[1], end[1]))
        return true;
    else
        return false;
}

function generateUvByVectors(vectors) {
    const box = new THREE.Box3().setFromPoints(vectors);
    const lenX = box.max.x - box.min.x;
    const lenZ = box.max.z - box.min.z;
    const uvs = [];
    for (let i = 0; i < vectors.length; i++) {
        const vertex = vectors[i];
        uvs.push(vertex.x / lenX, vertex.z / lenZ);
    }
    return uvs;
}