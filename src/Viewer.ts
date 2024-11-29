import { Easing, Group, Tween } from "@tweenjs/tween.js";
import CameraControls from "camera-controls";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/Addons.js";
import { createWorld } from "./createWorld";
import { loadingManager } from "./Common";
import { Loading } from "./loading/loading";

import { createRack } from "./model/createRack.js";

CameraControls.install({ THREE });

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(1, 1);

THREE.Cache.enabled = true;

export class Viewer {
  protected container: HTMLElement;
  public width: number;
  public height: number;

  protected clock = new THREE.Clock();
  protected camera?: THREE.PerspectiveCamera;
  protected scene?: THREE.Scene;
  protected renderer?: THREE.WebGLRenderer;
  protected cameraControls?: CameraControls;

  private blurMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.05,
    color: new THREE.Color(0x000000),
    // depthTest: false,
  });

  protected tween = new Group();

  constructor(container: HTMLElement) {
    const loading = new Loading();
    loading.hide();
    loadingManager.onProgress = () => {
      loading.show();
      // this.render();
    };
    loadingManager.onLoad = () => {
      loading.hide();
      this.render();
    };

    this.container = container;
    const boundRect = this.container.getBoundingClientRect();
    this.width = boundRect.width;
    this.height = boundRect.height;
    this.init();
    this.loadData();
  }

  private init() {
    this.initRender();
    this.initScene();
    this.initCamera();
    this.initControls();
    this.initLights();
    this.initEvents();
    this.render();
    this.clock.start();
    this.animate();
  }

  protected initRender() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      logarithmicDepthBuffer: true,
    });
    // renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    // this.renderer.setAnimationLoop(this.animate.bind(this));
    this.container.appendChild(this.renderer.domElement);
  }

  protected initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.width / this.height,
      1,
      100000
    );
    this.camera.position.set(-4000, 2500, -4000);
    this.camera.lookAt(0, 0, 0);

    this.cameraControls?.saveState();
  }

  protected initControls() {
    this.cameraControls = new CameraControls(
      this.camera!,
      this.renderer!.domElement
    );
  }

  protected initScene() {
    if (!this.renderer) {
      return;
    }
    this.scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.01,
      1,
      10000
    ).texture;
    this.scene.background = new THREE.Color(0xeeeeee);

    // For test
    // const helper = new THREE.GridHelper(10000, 100);
    // helper.position.y = -5;
    // this.scene.add(helper);
    // this.scene.add(new THREE.AxesHelper(100000));
  }

  protected initLights() {
    const light1 = new THREE.AmbientLight(0xffffff, 3);
    light1.name = "ambient_light";
    this.scene?.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 1);
    light2.position.set(0.5, 0, 0.866).multiplyScalar(300); // ~60º
    light2.name = "main_light";
    this.scene?.add(light2);
  }

  render() {
    this.renderer?.render(this.scene!, this.camera!);
  }

  animate() {
    const delta = this.clock.getDelta();
    this.tween.update();
    const hasControlsUpdated = this.cameraControls!.update(delta);
    requestAnimationFrame(this.animate.bind(this));
    if (hasControlsUpdated) {
      this.render();
    }
  }

  protected initEvents() {
    window.addEventListener("resize", this.handle_resize.bind(this), false);
    this.container.addEventListener(
      "dblclick",
      this.handle_dblclick.bind(this)
    );

    let mouseMoved = false;
    this.container.addEventListener("pointerdown", () => {
      mouseMoved = false;
    });
    this.container.addEventListener("pointermove", () => {
      mouseMoved = true;
    });
    this.container.addEventListener("pointerup", (e: MouseEvent) => {
      e.preventDefault();
      const isRightClick = e.button === 2;
      if (!mouseMoved && isRightClick) {
        this.handle_mouseRight();
      }
    });
  }

  private handle_resize() {
    const boundRect = this.container.getBoundingClientRect();
    this.width = boundRect.width;
    this.height = boundRect.height;
    this.camera!.aspect = this.width / this.height;
    this.camera!.updateProjectionMatrix();
    this.renderer!.setSize(this.width, this.height);
    this.render();
  }

  private handle_mouseRight() {
    this.clearHighlight();
    this.cameraControls?.reset(true);
  }

  private handle_dblclick(event: MouseEvent) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, this.camera!);
    const intersects = raycaster.intersectObject(this.scene!, true);
    if (intersects.length > 0) {
      const object = intersects[0].object;
      console.log(object);
      console.log("points:", intersects[0].point.toArray());
      if (object.userData.animation) {
        const animatInfo = object.userData.animation.split(":");
        const anchor = animatInfo[1];
        const rotationAngle = parseInt(animatInfo[2]);
        const during = parseInt(animatInfo[3]);
        if (this.isRack(object)) {
          const frontDoor = object.parent?.getObjectByName("rack-front-door");
          if (frontDoor) {
            const box = new THREE.Box3().setFromObject(frontDoor);
            const lookAt = box.getCenter(new THREE.Vector3());
            const direction = frontDoor
              .getWorldDirection(new THREE.Vector3())
              .normalize();
            const size = box.getSize(new THREE.Vector3());
            const radius = size.length() / 2;
            const distance =
              this.cameraControls?.getDistanceToFitSphere(radius);
            const position = lookAt
              .clone()
              .add(direction.multiplyScalar(distance!));

            // 飞向机柜门正面
            this.cameraControls
              ?.setLookAt(
                position.x,
                position.y,
                position.z,
                lookAt.x,
                lookAt.y,
                lookAt.z,
                true
              )
              .then(() => {
                this.animateRotate(
                  object as THREE.Mesh,
                  anchor,
                  rotationAngle,
                  during
                );
              });
          }

          // 虚化其他物体
          object.parent!.removeFromParent();
          this.highlightScene();
          this.scene?.add(object.parent!);
        } else {
          this.animateRotate(
            object as THREE.Mesh,
            anchor,
            rotationAngle,
            during
          );
        }
      } else {
        this.cameraControls?.moveTo(...intersects[0].point.toArray(), true);
      }
    }
  }

  protected isRack(object: THREE.Object3D) {
    return object.userData.name?.includes("rack");
  }

  highlightScene() {
    this.scene?.traverseVisible((obj: THREE.Object3D) => {
      if (obj instanceof THREE.Mesh) {
        // @ts-ignore
        obj.__originalMaterial = obj.material;
        obj.material = this.blurMaterial;
      }
    });
  }

  clearHighlight() {
    this.scene?.traverseVisible((obj: THREE.Object3D) => {
      // @ts-ignore
      if (obj.__originalMaterial) {
        // @ts-ignore
        obj.material = obj.__originalMaterial;
      }
    });
    this.render();
  }

  protected animateRotate(
    object: THREE.Mesh,
    anchor: string,
    angle: number,
    during: number
  ) {
    const size = new THREE.Vector3();
    object.geometry.computeBoundingBox();
    object.geometry.boundingBox!.getSize(size);
    const pivotPoint = new THREE.Vector3();
    const rotationAxis = new THREE.Vector3();

    if (anchor === "left") {
      pivotPoint.set(-size.x / 2, 0, 0);
      rotationAxis.set(0, 1, 0);
    } else if (anchor === "right") {
      pivotPoint.set(size.x / 2, 0, 0);
      rotationAxis.set(0, 1, 0);
    }
    pivotPoint.applyMatrix4(object.matrix);
    rotationAxis.applyMatrix4(
      new THREE.Matrix4().extractRotation(object.matrix)
    );

    const from = 0;
    let to = 1;
    if (object.userData.animated) {
      to = -1;
    }
    object.userData.animated = !object.userData.animated;
    let lastValue = 0;

    new Tween({ x: from }, this.tween)
      .to({ x: to }, during)
      .easing(Easing.Bounce.Out)
      .onUpdate((v) => {
        const tm = new THREE.Matrix4().setPosition(pivotPoint);
        const rm = new THREE.Matrix4();
        rm.makeRotationAxis(
          rotationAxis,
          THREE.MathUtils.degToRad(-angle) * (v.x - lastValue)
        );
        tm.multiply(rm);
        const tmm = new THREE.Matrix4().setPosition(
          pivotPoint.clone().negate()
        );
        tm.multiply(tmm);
        object.applyMatrix4(tm);

        // 更新渲染
        this.render();

        lastValue = v.x;
      })
      .start();
  }

  loadData() {
    createWorld(this.scene!);
    this.createRack(this.scene!);
    // this.createPathFlight();
    this.render();
  }

  private createRack(scene: THREE.Scene) {
    // 机柜
    const rackMap = {
      sideMap: "/assets/rack2/r1srack.jpg",
      topMap: "/assets/rack2/r1track.jpg",
      frameMap: "/assets/rack2/r1frack42.png",
      frontDoorMap: "/assets/rack2/r1frack.jpg",
      backDoorMap: "/assets/rack2/r1brack.jpg",
      rackBack: "/assets/rack2/r1brack.jpg",
    };
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 20; j++) {
        const rack = createRack({
          ...rackMap,
          position: [-1680 + 230 * i, 100, -1400 + 60 * j],
          rotation: [0, -Math.PI / 2, 0],
        });
        scene.add(rack);
      }
    }

    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 20; j++) {
        const rack = createRack({
          ...rackMap,
          position: [500 + 230 * i, 100, -1400 + 60 * j],
          rotation: [0, -Math.PI / 2, 0],
        });
        scene.add(rack);
      }
    }
  }

  // @ts-ignore
  private createPathFlight() {
    const points = [
      [-2108.1056622497044, 0, -1768.2852733169518],
      [-2090.8022641659068, 0, -8.999541340935856],
      [252.92217113182915, 0, -21.646393904821025],
      [2579.693282778835, 0, -16.824099103697677],
      [2488.183270612835, 0, 1271.4025633512294],
      [321.0467169543589, 0, 1261.9262629538507],
      [-2131.2017368499573, 0, 1230.3146832488842],
    ];
    const vectors = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    const curve = new THREE.CatmullRomCurve3(vectors);

    const tubeGeometry = new THREE.TubeGeometry(
      curve,
      100,
      20,
      5,
      false
    );
    const material = new THREE.MeshLambertMaterial( { color: 0xff00ff } );
    const mesh = new THREE.Mesh(tubeGeometry, material);
    this.scene?.add(mesh);
  }
}
