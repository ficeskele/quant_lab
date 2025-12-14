import { FreeMode } from './modes/FreeMode.js';

/**
 * GestureController - 手勢控制邏輯
 * 管理不同模式的切換和手勢交互
 */
export class GestureController {
  constructor(particleSystem, scene) {
    this.particleSystem = particleSystem;
    this.scene = scene;

    // 只保留自由模式
    this.currentMode = new FreeMode();

    // 手勢狀態
    this.lastGesture = 'NONE';
    this.gestureHoldTime = 0;
    this.GESTURE_HOLD_THRESHOLD = 1.0; // 秒

    // 初始化第一個模式
    this.currentMode.init(this.particleSystem, this.scene);

    // 初始化模式顯示
    this.showModeIndicator();
  }

  /**
   * 更新控制器
   */
  update(handData, deltaTime, time) {
    const { handPosition, gesture } = handData;

    // 更新當前模式
    if (this.currentMode) {
      this.currentMode.update(
        this.particleSystem,
        handPosition,
        gesture,
        deltaTime,
        time
      );
    }

    this.lastGesture = gesture.type;
  }

  /**
   * 顯示模式切換指示器
   */
  showModeIndicator() {
    const indicator = document.getElementById('mode-indicator');
    const modeDisplay = document.getElementById('mode-display');

    if (indicator && modeDisplay) {
      const modeName = this.currentMode.getName();

      // 更新文字
      indicator.textContent = modeName;
      modeDisplay.textContent = modeName;

      // 設置顏色
      const colors = {
        '自由模式': '#00ff88'
      };

      indicator.style.color = colors[modeName] || '#ffffff';

      // 顯示動畫
      indicator.classList.add('show');

      setTimeout(() => {
        indicator.classList.remove('show');
      }, 2000);
    }
  }

  /**
   * 獲取當前模式名稱
   */
  getCurrentModeName() {
    return this.currentMode ? this.currentMode.getName() : '未知';
  }

  /**
   * 獲取當前模式索引
   */
  getCurrentModeIndex() {
    return 0;
  }

  /**
   * 清理資源
   */
  dispose() {
    if (this.currentMode) {
      this.currentMode.dispose(this.scene);
    }
  }
}
