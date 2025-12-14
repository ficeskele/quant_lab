import * as THREE from 'three';

/**
 * Physics - 物理計算工具類別
 */
export class Physics {
  /**
   * 計算兩點之間的距離
   */
  static distance(v1, v2) {
    return v1.distanceTo(v2);
  }

  /**
   * 計算吸引力（反比於距離平方）
   * @param {THREE.Vector3} position - 粒子位置
   * @param {THREE.Vector3} target - 目標位置（如手部）
   * @param {number} strength - 力的強度
   * @returns {THREE.Vector3} 力向量
   */
  static attractionForce(position, target, strength = 1.0) {
    const direction = new THREE.Vector3().subVectors(target, position);
    const distance = direction.length();

    if (distance < 0.1) return new THREE.Vector3(0, 0, 0);

    direction.normalize();
    const forceMagnitude = strength / (distance * distance + 0.1);

    return direction.multiplyScalar(forceMagnitude);
  }

  /**
   * 計算排斥力（反比於距離）
   * @param {THREE.Vector3} position - 粒子位置
   * @param {THREE.Vector3} target - 目標位置（如手部）
   * @param {number} strength - 力的強度
   * @returns {THREE.Vector3} 力向量
   */
  static repulsionForce(position, target, strength = 1.0) {
    const direction = new THREE.Vector3().subVectors(position, target);
    const distance = direction.length();

    if (distance < 0.1) {
      // 如果太近，給一個隨機方向的力
      return new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).multiplyScalar(strength * 10);
    }

    direction.normalize();
    const forceMagnitude = strength / (distance + 0.1);

    return direction.multiplyScalar(forceMagnitude);
  }

  /**
   * 計算軌道運動力（用於原子模式）
   * @param {THREE.Vector3} position - 粒子位置
   * @param {THREE.Vector3} center - 中心點
   * @param {number} speed - 軌道速度
   * @returns {THREE.Vector3} 切線方向的力
   */
  static orbitalForce(position, center, speed = 1.0) {
    const toCenter = new THREE.Vector3().subVectors(center, position);
    const distance = toCenter.length();

    if (distance < 0.1) return new THREE.Vector3(0, 0, 0);

    // 計算垂直於向心方向的切線力
    const tangent = new THREE.Vector3(
      -toCenter.y,
      toCenter.x,
      0
    ).normalize();

    return tangent.multiplyScalar(speed);
  }

  /**
   * 計算向心力（保持軌道運動）
   * @param {THREE.Vector3} position - 粒子位置
   * @param {THREE.Vector3} center - 中心點
   * @param {number} strength - 向心力強度
   * @returns {THREE.Vector3} 向心力向量
   */
  static centripetalForce(position, center, strength = 1.0) {
    const toCenter = new THREE.Vector3().subVectors(center, position);
    const distance = toCenter.length();

    if (distance < 0.1) return new THREE.Vector3(0, 0, 0);

    toCenter.normalize();
    return toCenter.multiplyScalar(strength);
  }

  /**
   * 應用摩擦力（減速）
   * @param {THREE.Vector3} velocity - 速度向量
   * @param {number} friction - 摩擦係數 (0-1)
   * @returns {THREE.Vector3} 應用摩擦後的速度
   */
  static applyFriction(velocity, friction = 0.95) {
    return velocity.multiplyScalar(friction);
  }

  /**
   * 限制速度大小
   * @param {THREE.Vector3} velocity - 速度向量
   * @param {number} maxSpeed - 最大速度
   * @returns {THREE.Vector3} 限制後的速度
   */
  static limitSpeed(velocity, maxSpeed = 1.0) {
    const speed = velocity.length();
    if (speed > maxSpeed) {
      velocity.normalize().multiplyScalar(maxSpeed);
    }
    return velocity;
  }

  /**
   * 簡單的彈性碰撞（用於粒子間碰撞）
   * @param {THREE.Vector3} pos1 - 粒子1位置
   * @param {THREE.Vector3} vel1 - 粒子1速度
   * @param {THREE.Vector3} pos2 - 粒子2位置
   * @param {THREE.Vector3} vel2 - 粒子2速度
   * @param {number} restitution - 恢復係數
   */
  static elasticCollision(pos1, vel1, pos2, vel2, restitution = 0.8) {
    const delta = new THREE.Vector3().subVectors(pos1, pos2);
    const distance = delta.length();

    if (distance < 0.1) {
      delta.normalize();

      // 計算相對速度
      const relativeVel = new THREE.Vector3().subVectors(vel1, vel2);
      const speedAlongNormal = relativeVel.dot(delta);

      // 如果粒子正在遠離，不處理碰撞
      if (speedAlongNormal < 0) return;

      // 計算衝量
      const impulse = delta.multiplyScalar(speedAlongNormal * restitution);

      vel1.sub(impulse);
      vel2.add(impulse);
    }
  }

  /**
   * 螺旋星系力場
   * @param {THREE.Vector3} position - 粒子位置
   * @param {THREE.Vector3} center - 星系中心
   * @param {number} rotation - 旋轉速度
   * @returns {THREE.Vector3} 力向量
   */
  static spiralGalaxyForce(position, center, rotation = 1.0) {
    const toCenter = new THREE.Vector3().subVectors(center, position);
    const distance = toCenter.length();

    if (distance < 0.1) return new THREE.Vector3(0, 0, 0);

    // 向心力（保持在軌道上）
    const radial = toCenter.clone().normalize().multiplyScalar(0.5);

    // 切線力（螺旋運動）
    const tangent = new THREE.Vector3(
      -toCenter.y,
      toCenter.x,
      0
    ).normalize().multiplyScalar(rotation / Math.sqrt(distance));

    return radial.add(tangent);
  }

  /**
   * 隨機漂移力
   * @param {number} strength - 力的強度
   * @returns {THREE.Vector3} 隨機力向量
   */
  static randomDrift(strength = 0.1) {
    return new THREE.Vector3(
      (Math.random() - 0.5) * strength,
      (Math.random() - 0.5) * strength,
      (Math.random() - 0.5) * strength
    );
  }

  /**
   * 將世界座標轉換為螢幕歸一化座標 (-1 到 1)
   * @param {number} x - 螢幕 x 座標
   * @param {number} y - 螢幕 y 座標
   * @param {number} z - 深度 (預設 5)
   * @returns {THREE.Vector3} 世界座標
   */
  static screenToWorld(x, y, z = 5) {
    // MediaPipe 座標是 0-1，需要轉換到 -1 到 1
    // 增加範圍，讓手部移動可以控制更大的區域
    const worldX = (x - 0.5) * 2 * 20; // 增加到 20（原本 10）
    const worldY = -(y - 0.5) * 2 * 15; // 增加到 15（原本 7.5）

    return new THREE.Vector3(worldX, worldY, z);
  }
}
