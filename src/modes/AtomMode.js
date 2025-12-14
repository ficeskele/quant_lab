import * as THREE from 'three';
import { Physics } from '../utils/Physics.js';

/**
 * AtomMode - 原子電子雲模式
 * 粒子像電子一樣繞著中心原子核旋轉
 */
export class AtomMode {
  constructor() {
    this.name = '原子模式';
    this.nucleus = null; // 原子核
    this.nucleusPosition = new THREE.Vector3(0, 0, 0);

    this.orbitalLevels = [2, 4, 6]; // 不同軌道層的半徑
    this.particleOrbits = []; // 每個粒子的軌道層
  }

  /**
   * 初始化模式
   */
  init(particleSystem, scene) {
    // 創建原子核
    const nucleusGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const nucleusMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0066,
      emissive: 0xff0066,
      emissiveIntensity: 1.5,
      metalness: 0.5,
      roughness: 0.2
    });
    this.nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
    this.nucleus.position.copy(this.nucleusPosition);
    scene.add(this.nucleus);

    // 為每個粒子分配軌道層
    const count = particleSystem.getCount();
    const positions = particleSystem.getObject().geometry.attributes.position.array;

    for (let i = 0; i < count; i++) {
      // 隨機分配到不同軌道層
      const orbitIndex = Math.floor(Math.random() * this.orbitalLevels.length);
      this.particleOrbits[i] = orbitIndex;

      // 將粒子初始化到軌道上
      const radius = this.orbitalLevels[orbitIndex];
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      const i3 = i * 3;
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // 清空速度，避免舊模式殘留
      particleSystem.velocities[i].set(0, 0, 0);
    }

    particleSystem.getObject().geometry.attributes.position.needsUpdate = true;

    // 設置粒子顏色（青色電子）
    particleSystem.setColor(0x00ffff);
  }

  /**
   * 更新邏輯
   */
  update(particleSystem, handPosition, gesture, deltaTime, time) {
    const count = particleSystem.getCount();

    // 如果有手部輸入，更新原子核位置
    if (handPosition) {
      const worldPos = Physics.screenToWorld(handPosition.x, handPosition.y, 0);

      // 根據手勢調整原子核位置
      if (gesture.type === 'PINCH') {
        // 捏合：抓住原子核移動
        this.nucleusPosition.copy(worldPos);
      }
    }

    // 原子核脈動效果
    if (this.nucleus) {
      this.nucleus.position.copy(this.nucleusPosition);
      const scale = 1.0 + Math.sin(time * 3) * 0.1;
      this.nucleus.scale.set(scale, scale, scale);
    }

    // 應用軌道運動力
    particleSystem.applyForce((position, index) => {
      const orbitRadius = this.orbitalLevels[this.particleOrbits[index]];

      // 半徑回復（拉回目標軌道）
      const toCenter = new THREE.Vector3().subVectors(this.nucleusPosition, position);
      const dist = toCenter.length() || 0.0001;
      const outwardDir = position.clone().sub(this.nucleusPosition).normalize();
      const radialError = dist - orbitRadius;
      let force = outwardDir.multiplyScalar(-radialError * 0.45);

      // 切線力（軌道運動）
      const orbitalForce = Physics.orbitalForce(position, this.nucleusPosition, 0.8);
      force.add(orbitalForce);

      // 根據手勢調整力（增強效果）
      if (handPosition) {
        const worldPos = Physics.screenToWorld(handPosition.x, handPosition.y, 0);

        if (gesture.type === 'THUMB_UP') {
          // 按讚：強力排斥
          const repelForce = Physics.repulsionForce(position, worldPos, 8.0);
          force.add(repelForce);
        } else if (gesture.type === 'PINCH') {
          // 捏合：移動原子核
          const attractForce = Physics.attractionForce(position, worldPos, 10.0);
          force.add(attractForce);
        } else if (gesture.type === 'PEACE') {
          // 雙指：改變軌道速度
          const orbitalBoost = Physics.orbitalForce(position, this.nucleusPosition, 1.5);
          force.add(orbitalBoost);
        }
      }

      // 添加輕微的隨機漂移（量子不確定性）
      force.add(Physics.randomDrift(0.05));

      return force;
    });

    // 動態調整顏色
    particleSystem.updateColors((index) => {
      const position = particleSystem.getPosition(index);
      const distance = position.distanceTo(this.nucleusPosition);

      // 距離越近，顏色越亮
      const brightness = 1.0 - Math.min(distance / 10, 1.0);

      return new THREE.Color(
        brightness * 0.3,
        brightness,
        1.0
      );
    });
  }

  /**
   * 清理資源
   */
  dispose(scene) {
    if (this.nucleus) {
      scene.remove(this.nucleus);
      this.nucleus.geometry.dispose();
      this.nucleus.material.dispose();
      this.nucleus = null;
    }
  }

  getName() {
    return this.name;
  }
}
