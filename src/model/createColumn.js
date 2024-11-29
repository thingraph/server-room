import * as THREE from 'three';
import { textureLoader } from "../Common";

export function createColumn(json) {
    const position = json.position || [0, 0, 0];
    const rotation = json.rotation || [0, 0, 0];

    const width = json.width || 30;
    const height = json.height || 240;
    const depth = json.depth || 30;

    const color = json.color || 0xE8E8E8;
    const map = textureLoader.load(json.map || "./assets/column/column10.jpg");
    const lightMap = textureLoader.load("./assets/column/column_lightmap4.jpg");

    const boxGeo = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(boxGeo, [
        new THREE.MeshPhongMaterial({ color, map, lightMap }), //右
        new THREE.MeshPhongMaterial({ color, map, lightMap }), //左
        new THREE.MeshBasicMaterial({ color }), //上
        new THREE.MeshBasicMaterial({ color }), //下
        new THREE.MeshPhongMaterial({ color, map, lightMap }), //前
        new THREE.MeshPhongMaterial({ color, map, lightMap}), //后
    ]);

    mesh.position.set(...position);
    mesh.rotation.set(...rotation);

    return mesh;
}