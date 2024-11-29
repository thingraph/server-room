import { createWall } from "./model/createWall.js";
import { createPlant } from "./model/createPlant.js";
import { createColumn } from "./model/createColumn.js";
import * as THREE from "three";

export function createWorld(scene: THREE.Scene) {
  // 创建墙
  [
    {
      type: "Wall",
      data: [
        [-2922, -1892],
        [2768, -1892],
        [2768, 2108],
        [-2922, 2108],
      ],
      outsideColor: "#e3e7ed",
      insideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
      },
      outsideTexture: {
        map: "./assets/wall/wall14.jpg",
        repeat: [50, 1],
      },
      floorTexture: {
        map: "./assets/wall/floor5.jpg",
        repeat: [15, 15],
      },
      roofTexture: {
        map: "./assets/wall/floor.jpg",
        repeat: [15, 15],
      },
      insideLightMap: "./assets/env/inside_lightmap9.jpg",
      outsideLightMap: "./assets/env/outside_lightmap9.jpg",
      closed: true,
      children: [
        {
          type: "DoubleDoor",
          width: 120,
          height: 180,
          depth: 36,
          frameColor: 0x333640,
          leftMap: "./assets/door/door15-l.jpg",
          rightMap: "./assets/door/door15-r.jpg",
          position: [-2070.497907096083, 90, 2108],
        },
        {
          type: "DoubleDoor",
          width: 120,
          height: 180,
          depth: 36,
          frameColor: 0x333640,
          leftMap: "./assets/door/door15-l.jpg",
          rightMap: "./assets/door/door15-r.jpg",
          position: [-2070.497907096083, 90, -1892],
        },
      ],
    },
    {
      type: "Wall",
      data: [
        [-1932, -1892],
        [-1932, -1592],
      ],
      insideLightMap: "./assets/env/inside_lightmap9.jpg",
      outsideLightMap: "./assets/env/outside_lightmap9.jpg",
      insideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
      },
      outsideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
        repeat: [10, 1],
      },
      closed: false,
    },
    {
      type: "Wall",
      data: [
        [-1932, 1121],
        [2237, 1121],
        [2237, 83],
      ],
      insideLightMap: "./assets/env/inside_lightmap9.jpg",
      outsideLightMap: "./assets/env/outside_lightmap9.jpg",
      insideTexture: {
        map: "./assets/wall/inner-wall13.jpg",
        repeat: [10, 1],
      },
      outsideTexture: {
        map: "./assets/wall/inner-wall13.jpg",
        repeat: [10, 1],
      },
      closed: false,
      children: [
        {
          type: "Window",
          width: 705,
          frameColor: 0x333640,
          position: [21.8733119497804, 120, 1121],
          map: "./assets/window/window3.png",
        },
        {
          type: "Window",
          width: 930,
          frameColor: 0x333640,
          position: [1696.6050674876196, 120, 1121],
          map: "./assets/window/window3.png",
        },
        {
          type: "Window",
          width: 470.91171148899,
          frameColor: 0x333640,
          position: [-1662.8616076650972, 120, 1121],
          map: "./assets/window/window3.png",
        },
        {
          type: "Window",
          width: 840.0829979159867,
          frameColor: 0x333640,
          position: [-871.5658491761828, 120, 1121],
          map: "./assets/window/window3.png",
        },
        {
          type: "Window",
          width: 561.6639519808001,
          frameColor: 0x333640,
          position: [794.5301772242469, 120, 1121],
          map: "./assets/window/window3.png",
        },
        {
          type: "Window",
          width: 898.9436385369619,
          frameColor: 0x333640,
          position: [2237, 120, 595.2598807357291],
          map: "./assets/window/window3.png",
        },
      ],
    },
    {
      type: "Wall",
      data: [
        [-1932, -127],
        [-1932, 1411],
      ],
      insideLightMap: "./assets/env/inside_lightmap9.jpg",
      outsideLightMap: "./assets/env/outside_lightmap9.jpg",
      insideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
        repeat: [10, 1],
      },
      outsideTexture: {
        map: "./assets/wall/inner-wall13.jpg",
        repeat: [10, 1],
      },
      closed: false,
      children: [
        {
          type: "DoubleDoor",
          width: 160,
          height: 180,
          depth: 36,
          frameColor: 0x333640,
          leftMap: "./assets/door/door14-l.png",
          rightMap: "./assets/door/door14-r.png",
          position: [-1932, 90, 1246.999975369071],
        },
        {
          type: "DoubleDoor",
          width: 160,
          height: 180,
          depth: 36,
          frameColor: 0x333640,
          leftMap: "./assets/door/door14-l.png",
          rightMap: "./assets/door/door14-r.png",
          position: [-1932, 90, -29.999992885074985],
        },
        {
          type: "Window",
          width: 854.0334046264043,
          frameColor: 0x333640,
          position: [-1932, 120, 609.9552231978],
          map: "./assets/window/window3.png",
        },
      ],
    },
    {
      type: "Wall",
      data: [
        [-1932, 1411],
        [-1932, 2108],
      ],
      insideLightMap: "./assets/env/inside_lightmap9.jpg",
      outsideLightMap: "./assets/env/outside_lightmap9.jpg",
      insideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
        repeat: [10, 1],
      },
      outsideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
        repeat: [10, 1],
      },
      closed: false,
    },
    {
      type: "Wall",
      data: [
        [240, -1592],
        [240, -1178],
      ],
      insideLightMap: "./assets/env/inside_lightmap9.jpg",
      outsideLightMap: "./assets/env/outside_lightmap9.jpg",
      insideTexture: {
        map: "./assets/wall/inner-wall11.jpg",
        repeat: [2, 1],
      },
      outsideTexture: {
        map: "./assets/wall/inner-wall11.jpg",
        repeat: [2, 1],
      },
      closed: false,
    },
    {
      type: "Wall",
      data: [
        [-438, 1411],
        [-438, 2108],
      ],
      insideLightMap: "./assets/env/inside_lightmap9.jpg",
      outsideLightMap: "./assets/env/outside_lightmap9.jpg",
      insideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
        repeat: [10, 1],
      },
      outsideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
        repeat: [4, 1],
      },
      closed: false,
    },
    {
      type: "Wall",
      data: [
        [-2222, 1067],
        [-2922, 1067],
      ],
      insideLightMap: "./assets/env/inside_lightmap9.jpg",
      outsideLightMap: "./assets/env/outside_lightmap9.jpg",
      insideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
        repeat: [10, 1],
      },
      outsideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
        repeat: [4, 1],
      },
      closed: false,
    },
    {
      type: "Wall",
      data: [
        [-2222, 64],
        [-2922, 64],
      ],
      insideLightMap: "./assets/env/inside_lightmap9.jpg",
      outsideLightMap: "./assets/env/outside_lightmap9.jpg",
      insideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
        repeat: [10, 1],
      },
      outsideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
        repeat: [4, 1],
      },
      closed: false,
    },
    {
      type: "Wall",
      data: [
        [-2222, -1270],
        [-2922, -1270],
      ],
      insideLightMap: "./assets/env/inside_lightmap9.jpg",
      outsideLightMap: "./assets/env/outside_lightmap9.jpg",
      insideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
        repeat: [10, 1],
      },
      outsideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
        repeat: [4, 1],
      },
      closed: false,
    },
    {
      type: "Wall",
      data: [
        [1157, 83],
        [1157, 1121],
      ],
      transparent: true,
      insideTexture: {
        map: "./assets/wall/glass-wall4.png",
        repeat: [3, 1],
      },
      outsideTexture: {
        map: "./assets/wall/glass-wall4.png",
        repeat: [3, 1],
      },
      closed: false,
    },
    {
      type: "Wall",
      data: [
        [-1932, 83],
        [-390, 83],
      ],
      transparent: true,
      insideTexture: {
        map: "./assets/wall/glass-wall4.png",
        repeat: [3, 1],
      },
      outsideTexture: {
        map: "./assets/wall/glass-wall4.png",
        repeat: [3, 1],
      },
      closed: false,
      children: [
        {
          type: "DoubleDoor",
          width: 160,
          height: 180,
          depth: 36,
          frameColor: 0x333640,
          leftMap: "./assets/door/door14-l.png",
          rightMap: "./assets/door/door14-r.png",
          position: [-1783.000032549887, 90, 83],
        },
      ],
    },
    {
      type: "Wall",
      data: [
        [240, -1178],
        [240, -127],
      ],
      transparent: true,
      insideTexture: {
        map: "./assets/wall/glass-wall4.png",
        repeat: [3, 1],
      },
      outsideTexture: {
        map: "./assets/wall/glass-wall4.png",
        repeat: [3, 1],
      },
      closed: false,
    },
    {
      type: "Wall",
      data: [
        [-390, 83],
        [-390, 1121],
      ],
      transparent: true,
      insideTexture: {
        map: "./assets/wall/glass-wall4.png",
        repeat: [3, 1],
      },
      outsideTexture: {
        map: "./assets/wall/glass-wall4.png",
        repeat: [3, 1],
      },
      closed: false,
    },
    {
      type: "Wall",
      data: [
        [2768, -127],
        [-1932, -127],
      ],
      transparent: true,
      insideTexture: {
        map: "./assets/wall/glass-wall4.png",
        repeat: [20, 1],
      },
      outsideTexture: {
        map: "./assets/wall/glass-wall4.png",
        repeat: [20, 1],
      },
      closed: false,
      children: [
        {
          type: "DoubleDoor",
          width: 160,
          height: 180,
          depth: 36,
          frameColor: 0x333640,
          leftMap: "./assets/door/door14-l.png",
          rightMap: "./assets/door/door14-r.png",
          position: [-1743.0000015683217, 90, -127],
        },
        {
          type: "DoubleDoor",
          width: 160,
          height: 180,
          depth: 36,
          frameColor: 0x333640,
          leftMap: "./assets/door/door14-l.png",
          rightMap: "./assets/door/door14-r.png",
          position: [109.0000057448495, 90, -127],
        },
        {
          type: "DoubleDoor",
          width: 160,
          height: 180,
          depth: 36,
          frameColor: 0x333640,
          leftMap: "./assets/door/door14-l.png",
          rightMap: "./assets/door/door14-r.png",
          position: [393.00003503999613, 90, -127],
        },
        {
          type: "DoubleDoor",
          width: 160,
          height: 180,
          depth: 36,
          frameColor: 0x333640,
          leftMap: "./assets/door/door14-l.png",
          rightMap: "./assets/door/door14-r.png",
          position: [2640.999966667306, 90, -127],
        },
      ],
    },
    {
      type: "Wall",
      data: [
        [-1932, -1592],
        [-1932, -127],
      ],
      insideLightMap: "./assets/env/inside_lightmap9.jpg",
      outsideLightMap: "./assets/env/outside_lightmap9.jpg",
      insideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
        repeat: [10, 1],
      },
      outsideTexture: {
        map: "./assets/wall/inner-wall13.jpg",
        repeat: [10, 1],
      },
      closed: false,
      children: [
        {
          type: "Window",
          width: 1277,
          frameColor: 0x333640,
          position: [-1932, 120, -835.1127278429044],
          map: "./assets/window/window3.png",
        },
      ],
    },
    {
      type: "Wall",
      data: [
        [-1932, 1411],
        [2768, 1411],
      ],
      insideLightMap: "./assets/env/inside_lightmap9.jpg",
      outsideLightMap: "./assets/env/outside_lightmap9.jpg",
      insideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
        repeat: [10, 1],
      },
      outsideTexture: {
        map: "./assets/wall/outer-wall11.jpg",
        repeat: [10, 1],
      },
      closed: false,
      children: [
        {
          type: "DoubleDoor",
          width: 160,
          height: 180,
          depth: 36,
          frameColor: 0x333640,
          leftMap: "./assets/door/door15-l.jpg",
          rightMap: "./assets/door/door15-r.jpg",
          position: [-566.0000325498869, 90, 1411],
        },
        {
          type: "DoubleDoor",
          width: 160,
          height: 180,
          depth: 36,
          frameColor: 0x333640,
          leftMap: "./assets/door/door15-l.jpg",
          rightMap: "./assets/door/door15-r.jpg",
          position: [925.9999674501132, 90, 1411],
        },
        {
          type: "DoubleDoor",
          width: 160,
          height: 180,
          depth: 36,
          frameColor: 0x333640,
          leftMap: "./assets/door/door15-l.jpg",
          rightMap: "./assets/door/door15-r.jpg",
          position: [1202.9999674501132, 90, 1411],
        },
      ],
    },
    {
      type: "Wall",
      data: [
        [-390, 83],
        [1157, 83],
        [2237, 83],
      ],
      transparent: true,
      insideTexture: {
        map: "./assets/wall/glass-wall4.png",
        repeat: [3, 1],
      },
      outsideTexture: {
        map: "./assets/wall/glass-wall4.png",
        repeat: [3, 1],
      },
      closed: false,
      children: [
        {
          type: "DoubleDoor",
          width: 160,
          height: 180,
          depth: 36,
          frameColor: 0x333640,
          leftMap: "./assets/door/door14-l.png",
          rightMap: "./assets/door/door14-r.png",
          position: [-224.000032549887, 90, 83],
        },
        {
          type: "DoubleDoor",
          width: 160,
          height: 180,
          depth: 36,
          frameColor: 0x333640,
          leftMap: "./assets/door/door14-l.png",
          rightMap: "./assets/door/door14-r.png",
          position: [1479.9999674501132, 90, 83],
        },
      ],
    },
    {
      type: "Wall",
      data: [
        [-1932, -1592],
        [2766, -1592],
      ],
      insideLightMap: "./assets/env/inside_lightmap9.jpg",
      outsideLightMap: "./assets/env/outside_lightmap9.jpg",
      insideTexture: {
        map: "./assets/wall/inner-wall11.jpg",
        repeat: [20, 1],
      },
      outsideTexture: {
        map: "./assets/wall/outer-wall11.jpg",
        repeat: [10, 1],
      },
      closed: false,
      children: [
        {
          type: "DoubleDoor",
          width: 160,
          height: 180,
          depth: 36,
          frameColor: 0x333640,
          leftMap: "./assets/door/door14-l.png",
          rightMap: "./assets/door/door14-r.png",
          position: [108.11004610554635, 90, -1592],
        },
        {
          type: "DoubleDoor",
          width: 160,
          height: 180,
          depth: 36,
          frameColor: 0x333640,
          leftMap: "./assets/door/door14-l.png",
          rightMap: "./assets/door/door14-r.png",
          position: [387.74448236724686, 90, -1592],
        },
      ],
    },
    {
      type: "Wall",
      data: [
        [1049, 1411],
        [1049, 2108],
      ],
      insideLightMap: "./assets/env/inside_lightmap9.jpg",
      outsideLightMap: "./assets/env/outside_lightmap9.jpg",
      insideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
        repeat: [10, 1],
      },
      outsideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
        repeat: [10, 1],
      },
      closed: false,
    },
    {
      type: "Wall",
      data: [
        [-2222, -880],
        [-2922, -880],
      ],
      insideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
        repeat: [10, 1],
      },
      outsideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
        repeat: [10, 1],
      },
      closed: false,
    },
    {
      type: "Wall",
      data: [
        [-2222, 677],
        [-2922, 677],
      ],
      insideLightMap: "./assets/env/inside_lightmap9.jpg",
      outsideLightMap: "./assets/env/outside_lightmap9.jpg",
      insideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
        repeat: [10, 1],
      },
      outsideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
        repeat: [10, 1],
      },
      closed: false,
    },
    {
      type: "Wall",
      data: [
        [-2222, 2108],
        [-2222, -1892],
      ],
      insideLightMap: "./assets/env/inside_lightmap9.jpg",
      outsideLightMap: "./assets/env/outside_lightmap9.jpg",
      insideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
        repeat: [10, 1],
      },
      outsideTexture: {
        map: "./assets/wall/inner-wall10.jpg",
        repeat: [10, 1],
      },
      closed: false,
      children: [
        {
          type: "DoubleDoor",
          width: 160,
          height: 180,
          depth: 36,
          frameColor: 0x333640,
          leftMap: "./assets/door/door15-l.jpg",
          rightMap: "./assets/door/door15-r.jpg",
          position: [-2222, 90, -1406.0000011652241],
        },
        {
          type: "DoubleDoor",
          width: 160,
          height: 180,
          depth: 36,
          frameColor: 0x333640,
          leftMap: "./assets/door/door15-l.jpg",
          rightMap: "./assets/door/door15-r.jpg",
          position: [-2222, 90, -1045.0000011652244],
        },
        {
          type: "DoubleDoor",
          width: 160,
          height: 180,
          depth: 36,
          frameColor: 0x333640,
          leftMap: "./assets/door/door15-l.jpg",
          rightMap: "./assets/door/door15-r.jpg",
          position: [-2222, 90, -120.00000116522426],
        },
        {
          type: "DoubleDoor",
          width: 160,
          height: 180,
          depth: 36,
          frameColor: 0x333640,
          leftMap: "./assets/door/door15-l.jpg",
          rightMap: "./assets/door/door15-r.jpg",
          position: [-2222, 90, 509.99999883477574],
        },
        {
          type: "DoubleDoor",
          width: 160,
          height: 180,
          depth: 36,
          frameColor: 0x333640,
          leftMap: "./assets/door/door15-l.jpg",
          rightMap: "./assets/door/door15-r.jpg",
          position: [-2222, 90, 921.9999988347759],
        },
        {
          type: "DoubleDoor",
          width: 160,
          height: 180,
          depth: 36,
          frameColor: 0x333640,
          leftMap: "./assets/door/door15-l.jpg",
          rightMap: "./assets/door/door15-r.jpg",
          position: [-2222, 90, 1251.999998834776],
        },
        {
          type: "Window",
          width: 500,
          frameColor: 0x333640,
          position: [-2222, 120, 1700],
          map: "./assets/window/window3.png",
        },
      ],
    },
  ].forEach((json) => scene!.add(createWall(json)));

  {
    for (let i = 0; i < 6; i++) {
      const column = createColumn({
        width: 60,
        height: 270,
        depth: 60,
        position: [-1380 + 820 * i, 135, -1850],
      });
      scene.add(column);

      const column2 = createColumn({
        width: 60,
        height: 270,
        depth: 60,
        position: [-1380 + 820 * i, 135, 2065],
      });
      scene.add(column2);
    }

    [
      [-2250, 135, -1850],
      [-2250, 135, -880],
      [-2250, 135, 72],
      [-2250, 135, 1070],
      [-2250, 135, 2065],
      [2233, 135, 90],
      [1155, 135, 90],
      [-390, 135, 90],
      [243, 135, -127],
    ].forEach((p) => {
      scene.add(
        createColumn({
          width: 60,
          height: 270,
          depth: 60,
          position: p,
        })
      );
    });
  }

  {
    [
      [-1970, 10, -1371],
      [-1970, 10, -833],
      [-1970, 10, -305],
      [2511, 10, -55],
    ].forEach((p) =>
      scene.add(
        createPlant({
          width: 30,
          height: 120,
          position: p,
          style: 2,
        })
      )
    );
  }
}
