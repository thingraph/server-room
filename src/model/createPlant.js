import * as THREE from 'three';
import { SUBTRACTION, INTERSECTION, ADDITION, Brush, Evaluator } from 'three-bvh-csg';
import { textureLoader } from "../Common";

export function createPlant(json) {
    const position = json.position || [0, 0, 0];
    const rotation = json.rotation || [0, 0, 0];

    const style = json.style || 1;

    const nomalMap = textureLoader.load("./assets/env/metal_normalmap.jpg");
    nomalMap.wrapS = THREE.RepeatWrapping;
    nomalMap.wrapT = THREE.RepeatWrapping;
    nomalMap.repeat.set(10, 5);

    const group = new THREE.Group();
    if (style === 1) {
        const width = 30;
        const height = 30;
        const flowerpot = createFlowerpot(width * 0.5, width * 0.4, height * 2, nomalMap);
        group.add(flowerpot);
        const image = textureLoader.load("./assets/plant/plant.png");
        image.colorSpace = THREE.SRGBColorSpace;
        createBasePlant(width * 1.5, height + 20, 35, image, group);
    } else if (style === 2) {
        const width = 30;
        const height = 120;
        const flowerpot = createFlowerpot(width * 0.6, width * 0.4, height / 5, nomalMap);
        group.add(flowerpot);
        const image = textureLoader.load("./assets/plant/plant2.png");
        image.colorSpace = THREE.SRGBColorSpace;
        createBasePlant(width * 2, height, 60, image, group);
    }

    group.position.set(...position);
    group.rotation.set(...rotation);

    return group;
}


function createFlowerpot(w, h, d, normalMap) {
    // 花盆
    const cylinderGeo = new THREE.CylinderGeometry(w, h, d, 20, 1);
    const cylinderVase = new Brush(cylinderGeo, new THREE.MeshPhongMaterial({ color: new THREE.Color(0xbbbbbb), specular: new THREE.Color(0xbbbbbb), normalMap: normalMap, normalScale: new THREE.Vector2(0.4, 0.4) }));
    cylinderVase.updateMatrixWorld();

    const cylinderHollow = cylinderVase.clone(true);
    cylinderHollow.scale.set(0.9, 1, 0.9);
    cylinderHollow.updateMatrixWorld();
    const cylinderMud = cylinderHollow.clone(true);
    cylinderMud.scale.set(0.9, 0.7, 0.9);
    cylinderMud.updateMatrixWorld();
    cylinderMud.material = new THREE.MeshPhongMaterial({ color: new THREE.Color(0x163511), specular: new THREE.Color(0x163511) })

    let result;
    const evaluator = new Evaluator();
    result = evaluator.evaluate(cylinderVase, cylinderHollow, SUBTRACTION, result);
    result = evaluator.evaluate(result, cylinderMud, ADDITION, result);
    return result;
}

function createBasePlant(w, h, y, map, parent) {
    // 植物
    const count = 5;
    for (let i = 0; i < count; i++) {
        const plantGeo = new THREE.PlaneGeometry(w, h);
        const plant = new THREE.Mesh(plantGeo, new THREE.MeshPhongMaterial({ alphaTest: 0.5, transparent: true, map: map, side: THREE.DoubleSide }))
        parent.add(plant);
        plant.position.y = y;
        plant.rotateY(Math.PI * i / count);
    }
}
