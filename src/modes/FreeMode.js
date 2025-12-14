import * as THREE from 'three';
import { Physics } from '../utils/Physics.js';

/**
 * FreeMode - 自由粒子場模式
 * 完全自由的粒子互動，手勢產生力場
 */
export class FreeMode {
  constructor() {
    this.name = '自由模式';
    this.forceFieldMarker = null; // 力場標記
    this.attractionPoints = []; // 吸引點（用於捏合手勢）
  }

  /**
   * 初始化模式
   */
  init(particleSystem, scene) {
    // 創建力場標記（半透明球體）
    const markerGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.5,
      wireframe: true
    });
    this.forceFieldMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    this.forceFieldMarker.visible = false;
    scene.add(this.forceFieldMarker);

    // 隨機初始化粒子位置
    particleSystem.randomize();

    // 設置粒子顏色（綠色量子態）
    particleSystem.updateColors((index) => {
      return new THREE.Color(0x00ff88);
    });
  }

  /**
   * 更新邏輯
   */
  update(particleSystem, handPosition, gesture, deltaTime, time) {
    let handWorldPos = null;

    if (handPosition) {
      handWorldPos = Physics.screenToWorld(handPosition.x, handPosition.y, 0);

      // 顯示力場標記
      this.forceFieldMarker.visible = true;
      this.forceFieldMarker.position.copy(handWorldPos);

      // 根據手勢調整力場標記
      if (gesture.type === 'FULL_OPEN') {
        // 五指張開：排斥力場（紅色）
        this.forceFieldMarker.material.color.set(0xff0088);
        this.forceFieldMarker.scale.set(3, 3, 3);
      } else if (gesture.type === 'PINCH') {
        // 捏合：抓取粒子（黃色）
        this.forceFieldMarker.material.color.set(0xffff00);
        this.forceFieldMarker.scale.set(1.5, 1.5, 1.5);
      } else {
        // 預設（綠色）
        this.forceFieldMarker.material.color.set(0x00ff88);
        this.forceFieldMarker.scale.set(1, 1, 1);
      }
    } else {
      this.forceFieldMarker.visible = false;
    }

    // 力場標記旋轉動畫
    if (this.forceFieldMarker.visible) {
      this.forceFieldMarker.rotation.x += deltaTime * 2;
      this.forceFieldMarker.rotation.y += deltaTime * 1.5;
    }

    // 應用力場
    particleSystem.applyForce((position, index) => {
      let force = new THREE.Vector3(0, 0, 0);

      if (handWorldPos) {
        if (gesture.type === 'FULL_OPEN') {
          // 五指張開：超強排斥力
          force = Physics.repulsionForce(position, handWorldPos, 10.0);
        } else if (gesture.type === 'PINCH') {
          // 捏合：超強抓取力（不限距離）
          force = Physics.attractionForce(position, handWorldPos, 15.0);
        } else if (gesture.type === 'PEACE') {
          // 雙指：創造強力渦旋
          const toCenter = new THREE.Vector3().subVectors(handWorldPos, position);
          const dist = toCenter.length();

          if (dist > 0.1) {
            // 向心力
            const radial = toCenter.clone().normalize().multiplyScalar(1.5);

            // 切線力（渦旋）
            const tangent = new THREE.Vector3(
              -toCenter.y,
              toCenter.x,
              0
            ).normalize().multiplyScalar(5.0 / Math.sqrt(dist));

            force = radial.add(tangent);
          }
        }
      }

      // 邊界約束（擴大範圍，減弱約束）
      const boundaryRadius = 30; // 增加到 30（原本 15）
      const distFromCenter = position.length();

      if (distFromCenter > boundaryRadius) {
        const boundaryForce = position.clone()
          .normalize()
          .multiplyScalar(-(distFromCenter - boundaryRadius) * 0.05); // 降低約束力
        force.add(boundaryForce);
      }

      // 非常輕微的中心吸引力
      const centerForce = position.clone().multiplyScalar(-0.005);
      force.add(centerForce);

      // 隨機漂移
      force.add(Physics.randomDrift(0.08));

      return force;
    });

    // 動態顏色（根據速度和位置）
    particleSystem.updateColors((index) => {
      const position = particleSystem.getPosition(index);
      const velocity = particleSystem.velocities[index];
      const speed = velocity.length();

      // 基礎顏色（綠色）
      let color = new THREE.Color(0x00ff88);

      // 速度影響顏色
      if (speed > 0.5) {
        // 快速移動 -> 偏紅
        color.lerp(new THREE.Color(0xff0088), Math.min(speed / 2, 1.0));
      }

      // 如果靠近手部，顏色更亮
      if (handWorldPos) {
        const distance = position.distanceTo(handWorldPos);
        if (distance < 3.0) {
          const brightness = 1.0 + (3.0 - distance) / 3.0;
          color.multiplyScalar(brightness);
        }
      }

      return color;
    });
  }

  /**
   * 清理資源
   */
  dispose(scene) {
    if (this.forceFieldMarker) {
      scene.remove(this.forceFieldMarker);
      this.forceFieldMarker.geometry.dispose();
      this.forceFieldMarker.material.dispose();
      this.forceFieldMarker = null;
    }
  }

  getName() {
    return this.name;
  }
}
