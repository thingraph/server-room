import * as THREE from 'three';
import { SUBTRACTION, INTERSECTION, ADDITION, Brush, Evaluator } from 'three-bvh-csg';
import { textureLoader } from "../Common";


const RACK_WIDTH = 60;
const RACK_INNER_WIDTH = 45.5;
const envMap = textureLoader.load("./assets/env/envmap.jpg");
envMap.mapping = THREE.EquirectangularReflectionMapping;
envMap.colorSpace = THREE.SRGBColorSpace;
const lightMap = textureLoader.load("./assets/env/outside_lightmap.jpg");

export function createRack(json) {
    const position = json.position || [0, 0, 0];
    const rotation = json.rotation || [0, 0, 0];

    const rackWidth = json.width || RACK_WIDTH;
    const rackHeight = json.height || 200;  // 42U机柜  4.445*45
    const rackDepth = json.depth || 80;
    const doorDepth = 2;
    const rackSideImage = textureLoader.load(json.sideMap || "./assets/rack/rack_side.jpg");
    const rackTopImage = textureLoader.load(json.topMap || "./assets/rack/rack_top.jpg");
    const rackFrameImage = textureLoader.load(json.frameMap || "./assets/rack/rack42u.png");

    const insideSideImage = textureLoader.load("./assets/rack/inside_side.jpg");
    const insideTopImage = textureLoader.load("./assets/rack/inside_top.jpg");

    const rackFrontDoorImage = textureLoader.load(json.frontDoorMap || "./assets/rack/rack_door_front.jpg");
    const rackBackDoorImage = textureLoader.load(json.backDoorMap || "./assets/rack/rack_door_back.jpg");

    const rackBackImage = textureLoader.load(json.rackBack || "./assets/rack/rack_back.jpg");

    const rack = new THREE.Group();
    rack.position.set(...position);
    rack.rotation.set(...rotation);

    let cube1, cube2;
    {
        // 柜体
        const geometry = new THREE.BoxGeometry(rackWidth, rackHeight, rackDepth);
        cube1 = new Brush(
            geometry,
            [
                new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), specular: new THREE.Color(0xe5e5e5), map: rackSideImage, envMap, reflectivity: 0.5 }),// 右面
                new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), specular: new THREE.Color(0xe5e5e5), map: rackSideImage, envMap, reflectivity: 0.5 }), // 左面
                new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), specular: new THREE.Color(0xe5e5e5), map: rackTopImage, envMap, reflectivity: 0.5 }), // 上面
                new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), specular: new THREE.Color(0xe5e5e5), map: rackTopImage, envMap, reflectivity: 0.5 }), // 下面
                new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), specular: new THREE.Color(0xe5e5e5), map: rackFrameImage, envMap, reflectivity: 0.5 }), // 前面
                new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), specular: new THREE.Color(0xe5e5e5), map: rackFrameImage, envMap, reflectivity: 0.5 }), // 后面
            ]
        )
        cube1.updateMatrixWorld();
        // cube1 = new THREE.Mesh(geometry, material);
        // scene.add(cube1);
    }

    {
        // 机柜洞
        const geometry = new THREE.BoxGeometry(RACK_INNER_WIDTH, rackHeight - doorDepth * 2 /* 187.69 */, rackDepth);
        cube2 = new Brush(
            geometry,
            [
                new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), specular: new THREE.Color(0xe5e5e5), map: insideSideImage, lightMap, envMap, reflectivity: 0.5 }),// 右面
                new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), specular: new THREE.Color(0xe5e5e5), map: insideSideImage, lightMap, envMap, reflectivity: 0.5 }), // 左面
                new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), specular: new THREE.Color(0xe5e5e5), map: insideTopImage, lightMap, envMap, reflectivity: 0.5 }), // 上面
                new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), specular: new THREE.Color(0xe5e5e5), map: insideTopImage, lightMap, envMap, reflectivity: 0.5 }), // 下面
                new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff), lightMap }), // 前面
                new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff), lightMap }), // 后面
            ]
        )
        cube2.updateMatrixWorld();
        // cube2 = new THREE.Mesh(geometry, material);
        // scene.add(cube2);
    }

    let result;
    const evaluator = new Evaluator();
    result = evaluator.evaluate(cube1, cube2, SUBTRACTION, result);
    result.name = "rack-body";
    result.userData.name = "rack-body";
    rack.add(result);

    {
        const geometry = new THREE.BoxGeometry(rackWidth, rackHeight, doorDepth);
        const rackDoor = new THREE.Mesh(geometry, [
            new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), map: insideTopImage, envMap, reflectivity: 0.5 }),// 右面
            new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), map: insideTopImage, envMap, reflectivity: 0.5 }), // 左面
            new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), map: insideTopImage, envMap, reflectivity: 0.5 }), // 上面
            new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), map: insideTopImage, envMap, reflectivity: 0.5 }), // 下面
            new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), map: rackFrontDoorImage, envMap, reflectivity: 0.7, shininess: 100 }),
            new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), map: rackBackDoorImage, envMap, reflectivity: 0.7, shininess: 100 }),
        ]);
        rackDoor.name = "rack-front-door";
        rackDoor.position.z = rackDepth / 2 + 1;
        rackDoor.userData.animation = "rotation:right:-135:1000:0:bounceOut";
        rackDoor.userData.name = "rack-front-door";
        rack.add(rackDoor);

        const rackDoorBack = rackDoor.clone();
        rackDoorBack.material = [
            new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), map: insideTopImage, envMap, reflectivity: 0.5 }),// 右面
            new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), map: insideTopImage, envMap, reflectivity: 0.5 }), // 左面
            new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), map: insideTopImage, envMap, reflectivity: 0.5 }), // 上面
            new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), map: insideTopImage, envMap, reflectivity: 0.5 }), // 下面
            new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), map: rackBackImage, envMap, reflectivity: 0.7, shininess: 100 }),
            new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffffff), map: rackBackImage, envMap, reflectivity: 0.7, shininess: 100 }),
        ]
        rackDoorBack.name = "rack-back-door";
        rackDoorBack.position.z = -rackDepth / 2 - 1;
        rackDoorBack.userData.animation = "rotation:left:-135:1000:0:bounceOut";
        rackDoorBack.userData.name = "rack-back-door";
        rack.add(rackDoorBack);
    }

    return rack;
}