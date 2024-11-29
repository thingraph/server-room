import * as THREE from 'three';
import { SUBTRACTION, INTERSECTION, ADDITION, Brush, Evaluator } from 'three-bvh-csg';
import { textureLoader } from "../Common";

const envMap = textureLoader.load("./assets/env/envmap.jpg");
envMap.mapping = THREE.EquirectangularReflectionMapping;
envMap.colorSpace = THREE.SRGBColorSpace;

const specularMap = textureLoader.load("./assets/env/white.png")

// 单开门
export function createDoor(json) {
    const width = json.width || 205;
    const height = json.height || 180;
    const depth = json.depth || 30;
    const position = json.position || [0, 0, 0];
    const frameColor = json.frameColor || 0xFEFEFE;
    const frameEdge = 10,
        frameBottomEdge = 2;
    const image = textureLoader.load(json.map || "./assets/door/door1.png");
    const group = new THREE.Group();
    group.position.set(...position);

    // 门套
    const cutGeo = new THREE.BoxGeometry(width - frameEdge, height - frameEdge / 2 - frameBottomEdge, depth + 2);
    const cutMat = new THREE.MeshPhongMaterial({ color: frameColor });
    const cutMesh = new Brush(cutGeo, cutMat);
    // scene.add(cutMesh);
    let result;
    const evaluator = new Evaluator();
    result = evaluator.evaluate(cutMesh, new Brush(new THREE.BoxGeometry(width - frameEdge - 4, height - frameEdge / 2 - frameBottomEdge - 4, depth + 2), cutMat), SUBTRACTION, result);
    group.add(result);

    // 门
    const doorGeo = new THREE.BoxGeometry((width - frameEdge) - 2, height - frameEdge / 2 - frameBottomEdge - 2, 2);
    const uvs = [
        0, 1, 0.333, 1, 0, 0.5, 0.333, 0.5,  //右
        0, 1, 0.333, 1, 0, 0.5, 0.333, 0.5, // 左
        0, 1, 0.333, 1, 0, 0.5, 0.333, 0.5, // 上
        0, 1, 0.333, 1, 0, 0.5, 0.333, 0.5, // 下
        0.333, 0.5, 0.666, 0.5, 0.333, 0, 0.666, 0, // 前
        0.666, 1, 1, 1, 0.666, 0.5, 1, 0.5, // 后
    ]
    doorGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    const doorMesh = new Brush(doorGeo, new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), map: image, transparent: true, specularMap }));
    doorMesh.userData.animation = "rotation:left:-80:1000:0:bounceOut";
    group.add(doorMesh);

    return group;
}

// 双开门
export function createDoubleDoor(json) {
    const width = json.width || 205;
    const height = json.height || 213;
    const depth = json.depth || 26;
    const position = json.position || [0, 0, 0];
    const frameEdge = 10,
        frameBottomEdge = 5;
    const frameColor = json.frameColor || 0xFEFEFE;
    const leftImage = textureLoader.load(json.leftMap || "./assets/door/door-l.png");
    const rightImage = textureLoader.load(json.rightMap || "./assets/door/door-r.png");
    rightImage.flipY = true;
    const group = new THREE.Group();
    group.position.set(...position);

    // 门套
    const cutGeo = new THREE.BoxGeometry(width - frameEdge, height - frameEdge / 2 - frameBottomEdge, depth + 2);
    const cutMat = new THREE.MeshPhongMaterial({ color: frameColor });
    const cutMesh = new Brush(cutGeo, cutMat);
    // scene.add(cutMesh);
    let result;
    const evaluator = new Evaluator();
    result = evaluator.evaluate(cutMesh, new Brush(new THREE.BoxGeometry(width - frameEdge - 4, height - frameEdge / 2 - frameBottomEdge - 4, depth + 2), cutMat), SUBTRACTION, result);
    group.add(result);

    const uvs = [
        0, 1, 0.333, 1, 0, 0.5, 0.333, 0.5,  //右
        0, 1, 0.333, 1, 0, 0.5, 0.333, 0.5, // 左
        0, 1, 0.333, 1, 0, 0.5, 0.333, 0.5, // 上
        0, 1, 0.333, 1, 0, 0.5, 0.333, 0.5, // 下
        0.333, 0.5, 0.666, 0.5, 0.333, 0, 0.666, 0, // 前
        0.666, 1, 1, 1, 0.666, 0.5, 1, 0.5, // 后
    ]
    // 左门
    const doorLeftGeo = new THREE.BoxGeometry((width - frameEdge) / 2 - 2, height - frameEdge / 2 - frameBottomEdge - 2, 2);
    doorLeftGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    const doorLeftMesh = new Brush(doorLeftGeo, new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), map: leftImage, transparent: true, specularMap }));
    doorLeftMesh.userData.animation = "rotation:left:-80:1000:0:bounceOut";
    doorLeftMesh.position.set(-(width - frameEdge) / 4 + 1, 0, 0);
    group.add(doorLeftMesh);

    // 右门
    const doorRightGeo = new THREE.BoxGeometry((width - frameEdge) / 2 - 2, height - frameEdge / 2 - frameBottomEdge - 2, 2);
    doorRightGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    const doorRightMesh = new Brush(doorRightGeo, new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), map: rightImage, transparent: true, specularMap }));
    doorRightMesh.position.set((width - frameEdge) / 4 - 1, 0, 0);
    doorRightMesh.userData.animation = "rotation:right:80:1000:0:bounceOut";
    group.add(doorRightMesh);

    return group;
}

// 窗户
export function createWindow(json) {
    const width = json.width || 120;
    const height = json.height || 150;
    const depth = json.depth || 36;
    const position = json.position || [0, 0, 0];
    const image = textureLoader.load(json.map || "./assets/window/window.png");
    const group = new THREE.Group();
    group.position.set(...position);

    const frameEdge = 1;
    const frameColor = json.frameColor || 0xFEFEFE;
    // 窗套
    const cutGeo = new THREE.BoxGeometry(width - frameEdge + 2, height - frameEdge / 2 + 2, depth + 2);
    const cutMat = new THREE.MeshPhongMaterial({ color: frameColor });
    const cutMesh = new Brush(cutGeo, cutMat);
    // scene.add(cutMesh);
    let result;
    const evaluator = new Evaluator();
    result = evaluator.evaluate(cutMesh, new Brush(new THREE.BoxGeometry(width - frameEdge - 1, height - frameEdge / 2 - 1, depth + 2), cutMat), SUBTRACTION, result);
    group.add(result);

    // 窗
    const windowGeo = new THREE.BoxGeometry(width, height, 2);
    const uvs = [
        0, 1, 1, 1, 0, 0, 1, 0,  //右
        0, 1, 1, 1, 0, 0, 1, 0, // 左
        0, 1, 1, 1, 0, 0, 1, 0, // 上
        0, 1, 1, 1, 0, 0, 1, 0, // 下
        0, 1, 1, 1, 0, 0, 1, 0, // 前
        0, 1, 1, 1, 0, 0, 1, 0, // 后
    ]
    windowGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    const windowMesh = new THREE.Mesh(windowGeo, new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), map: image, transparent: true, shininess: 100, reflectivity: 2, envMap }));
    group.add(windowMesh);

    return group;
}