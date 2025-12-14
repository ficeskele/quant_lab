import * as THREE from 'three';
import { Physics } from './utils/Physics.js';
import vertexShader from './shaders/particle.vert?raw';
import fragmentShader from './shaders/particle.frag?raw';

/**
 * ParticleSystem - 粒子系統核心
 */
export class ParticleSystem {
  constructor(count = 10000) {
    this.particleCount = count;
    this.particles = null;
    this.velocities = [];
    this.originalPositions = [];

    this.init();
  }

  init() {
    const geometry = new THREE.BufferGeometry();

    // 位置
    const positions = new Float32Array(this.particleCount * 3);
    // 顏色
    const colors = new Float32Array(this.particleCount * 3);
    // 大小
    const sizes = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      // 隨機位置（球形分布）
      const radius = Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // 保存原始位置
      this.originalPositions.push(new THREE.Vector3(
        positions[i3],
        positions[i3 + 1],
        positions[i3 + 2]
      ));

      // 初始化速度
      this.velocities.push(new THREE.Vector3(0, 0, 0));

      // 預設顏色（青色，降低亮度）
      colors[i3] = 0.0;      // R
      colors[i3 + 1] = 0.6;  // G (降低亮度)
      colors[i3 + 2] = 0.8;  // B (降低亮度)

      // 大小（增加大小讓粒子更明顯）
      sizes[i] = Math.random() * 3 + 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // 自訂 Shader Material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
  }

  /**
   * 更新粒子位置
   */
  update(deltaTime, time) {
    const positions = this.particles.geometry.attributes.position.array;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      // 更新位置（加速移動）
      positions[i3] += this.velocities[i].x * deltaTime * 2.0;
      positions[i3 + 1] += this.velocities[i].y * deltaTime * 2.0;
      positions[i3 + 2] += this.velocities[i].z * deltaTime * 2.0;

      // 降低摩擦力（讓粒子移動更遠）
      this.velocities[i] = Physics.applyFriction(this.velocities[i], 0.95);
    }

    this.particles.geometry.attributes.position.needsUpdate = true;

    // 更新 shader 時間
    this.particles.material.uniforms.uTime.value = time;
  }

  /**
   * 應用力場到粒子
   */
  applyForce(forceFunction) {
    const positions = this.particles.geometry.attributes.position.array;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      const position = new THREE.Vector3(
        positions[i3],
        positions[i3 + 1],
        positions[i3 + 2]
      );

      // 計算並應用力
      const force = forceFunction(position, i);
      if (force) {
        this.velocities[i].add(force);

        // 提高速度限制，允許更快移動
        this.velocities[i] = Physics.limitSpeed(this.velocities[i], 5.0);
      }
    }
  }

  /**
   * 更新粒子顏色
   */
  updateColors(colorFunction) {
    const colors = this.particles.geometry.attributes.customColor.array;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const color = colorFunction(i);

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    this.particles.geometry.attributes.customColor.needsUpdate = true;
  }

  /**
   * 設置單一顏色
   */
  setColor(color) {
    const c = new THREE.Color(color);
    this.updateColors(() => c);
  }

  /**
   * 重置粒子到原始位置
   */
  reset() {
    const positions = this.particles.geometry.attributes.position.array;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      positions[i3] = this.originalPositions[i].x;
      positions[i3 + 1] = this.originalPositions[i].y;
      positions[i3 + 2] = this.originalPositions[i].z;

      // 重置速度
      this.velocities[i].set(0, 0, 0);
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * 將所有速度清零
   */
  resetVelocities() {
    for (let i = 0; i < this.velocities.length; i++) {
      this.velocities[i].set(0, 0, 0);
    }
  }

  /**
   * 隨機重新分布粒子
   */
  randomize() {
    const positions = this.particles.geometry.attributes.position.array;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      const radius = Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      this.velocities[i].set(0, 0, 0);
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * 獲取 Three.js 物件
   */
  getObject() {
    return this.particles;
  }

  /**
   * 獲取粒子位置
   */
  getPosition(index) {
    const positions = this.particles.geometry.attributes.position.array;
    const i3 = index * 3;

    return new THREE.Vector3(
      positions[i3],
      positions[i3 + 1],
      positions[i3 + 2]
    );
  }

  /**
   * 設置粒子位置
   */
  setPosition(index, position) {
    const positions = this.particles.geometry.attributes.position.array;
    const i3 = index * 3;

    positions[i3] = position.x;
    positions[i3 + 1] = position.y;
    positions[i3 + 2] = position.z;
  }

  /**
   * 獲取粒子數量
   */
  getCount() {
    return this.particleCount;
  }

  dispose() {
    this.particles.geometry.dispose();
    this.particles.material.dispose();
  }
}
