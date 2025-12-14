import * as THREE from 'three';
import { Physics } from '../utils/Physics.js';

/**
 * GalaxyMode - 螺旋星系模式
 * 粒子形成螺旋星系結構
 */
export class GalaxyMode {
  constructor() {
    this.name = '星系模式';
    this.galaxyCore = null; // 星系核心
    this.corePosition = new THREE.Vector3(0, 0, 0);
    this.rotationSpeed = 0.5;

    this.particleDistances = []; // 每個粒子與核心的距離
    this.particleAngles = []; // 每個粒子的角度
  }

  /**
   * 初始化模式
   */
  init(particleSystem, scene) {
    // 創建星系核心（亮黃色）
    const coreGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xffaa00,
      emissiveIntensity: 2.0,
      metalness: 0.8,
      roughness: 0.1
    });
    this.galaxyCore = new THREE.Mesh(coreGeometry, coreMaterial);
    this.galaxyCore.position.copy(this.corePosition);
    scene.add(this.galaxyCore);

    // 添加核心光環
    const ringGeometry = new THREE.RingGeometry(1.2, 1.5, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    this.galaxyCore.add(ring);

    // 初始化粒子為螺旋星系分布
    const count = particleSystem.getCount();
    const positions = particleSystem.getObject().geometry.attributes.position.array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // 螺旋星系分布
      const distance = Math.pow(Math.random(), 0.7) * 12; // 非線性分布
      const angle = Math.random() * Math.PI * 2;
      const spiralAngle = distance * 0.5; // 螺旋效果

      this.particleDistances[i] = distance;
      this.particleAngles[i] = angle + spiralAngle;

      // 計算位置（在 XY 平面上的螺旋）
      const x = Math.cos(this.particleAngles[i]) * distance;
      const y = Math.sin(this.particleAngles[i]) * distance;
      const z = (Math.random() - 0.5) * distance * 0.2; // 厚度

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      // 清空速度，避免前一模式殘留拖回中心
      particleSystem.velocities[i].set(0, 0, 0);
    }

    particleSystem.getObject().geometry.attributes.position.needsUpdate = true;

    // 設置粒子顏色（漸變：核心金色 -> 外圍紫色）
    particleSystem.updateColors((index) => {
      const distance = this.particleDistances[index];
      const t = Math.min(distance / 12, 1.0);

      // 從金色漸變到紫色
      return new THREE.Color().lerpColors(
        new THREE.Color(0xffaa00), // 金色
        new THREE.Color(0x8844ff), // 紫色
        t
      );
    });
  }

  /**
   * 更新邏輯
   */
  update(particleSystem, handPosition, gesture, deltaTime, time) {
    // 星系核心旋轉
    if (this.galaxyCore) {
      this.galaxyCore.rotation.z += this.rotationSpeed * deltaTime;

      // 脈動效果
      const scale = 1.0 + Math.sin(time * 2) * 0.15;
      this.galaxyCore.scale.set(scale, scale, scale);
    }

    // 如果有手部輸入
    let handWorldPos = null;
    if (handPosition) {
      handWorldPos = Physics.screenToWorld(handPosition.x, handPosition.y, 0);

      // 根據手勢調整星系行為
      if (gesture.type === 'PINCH') {
        // 捏合：移動星系核心
        this.corePosition.copy(handWorldPos);
        this.galaxyCore.position.copy(this.corePosition);
      } else if (gesture.type === 'THUMB_UP') {
        // 按讚：加速旋轉
        this.rotationSpeed = 1.5;
      } else {
        // 恢復正常速度
        this.rotationSpeed = 0.5;
      }
    }

    // 應用螺旋星系力場
    particleSystem.applyForce((position, index) => {
      const toCenter = new THREE.Vector3().subVectors(this.corePosition, position);
      const dist = toCenter.length() || 0.0001;
      const outwardDir = position.clone().sub(this.corePosition).normalize();
      const targetRadius = this.particleDistances[index];

      // 以彈簧方式維持半徑（防止整團塌縮）
      const radialError = dist - targetRadius;
      const springForce = outwardDir.multiplyScalar(-radialError * 0.35);

      // 螺旋切線力
      const tangent = new THREE.Vector3(-toCenter.y, toCenter.x, 0)
        .normalize()
        .multiplyScalar(this.rotationSpeed);

      // 輕微壓扁 Z 軸，保持盤狀
      const flattenForce = new THREE.Vector3(0, 0, -position.z * 0.05);

      let force = springForce.add(tangent).add(flattenForce);

      // 手勢交互（增強效果）
      if (handWorldPos) {
        if (gesture.type === 'THUMB_UP') {
          // 強力排斥粒子
          const repelForce = Physics.repulsionForce(position, handWorldPos, 7.0);
          force.add(repelForce);
        } else if (gesture.type === 'PINCH') {
          // 捏合：拉動星系
          const attractForce = Physics.attractionForce(position, handWorldPos, 12.0);
          force.add(attractForce);
        } else if (gesture.type === 'PEACE') {
          // 雙指：加速星系旋轉
          const tangent = new THREE.Vector3(-toCenter.y, toCenter.x, 0)
            .normalize()
            .multiplyScalar(this.rotationSpeed * 2.0);
          force.add(tangent);
        }
      }

      // 輕微隨機漂移
      force.add(Physics.randomDrift(0.03));

      return force;
    });

    // 動態更新顏色（根據速度）
    particleSystem.updateColors((index) => {
      const position = particleSystem.getPosition(index);
      const velocity = particleSystem.velocities[index];
      const speed = velocity.length();

      const distance = position.distanceTo(this.corePosition);
      const t = Math.min(distance / 12, 1.0);

      // 速度越快，顏色越亮
      const brightness = 1.0 + speed * 0.5;

      const baseColor = new THREE.Color().lerpColors(
        new THREE.Color(0xffaa00),
        new THREE.Color(0x8844ff),
        t
      );

      return new THREE.Color(
        baseColor.r * brightness,
        baseColor.g * brightness,
        baseColor.b * brightness
      );
    });
  }

  /**
   * 清理資源
   */
  dispose(scene) {
    if (this.galaxyCore) {
      scene.remove(this.galaxyCore);
      this.galaxyCore.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      this.galaxyCore = null;
    }
  }

  getName() {
    return this.name;
  }
}
