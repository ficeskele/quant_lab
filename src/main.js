import { SceneManager } from './SceneManager.js';
import { HandTracker } from './HandTracker.js';
import { ParticleSystem } from './ParticleSystem.js';
import { GestureController } from './GestureController.js';

/**
 * 🌌 Quantum Particle Lab - Main Entry
 */
class QuantumParticleLab {
  constructor() {
    this.sceneManager = null;
    this.handTracker = null;
    this.particleSystem = null;
    this.gestureController = null;

    this.isRunning = false;
    this.lastTime = 0;
    this.fps = 60;
    this.frameCount = 0;
    this.fpsUpdateTime = 0;

    // UI 元素
    this.loadingScreen = document.getElementById('loading-screen');
    this.fpsCounter = document.getElementById('fps-counter');
    this.particleCountDisplay = document.getElementById('particle-count');
    this.gestureStatus = document.getElementById('gesture-status');
    this.cameraSelect = document.getElementById('camera-select');

    // 相機相關
    this.selectedDeviceId = null;
    this.availableCameras = [];
  }

  async loadCameraList() {
    try {
      // 先請求一次攝像頭權限，否則無法獲取設備標籤
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });

      // 立即停止臨時串流，釋放攝像頭
      tempStream.getTracks().forEach(track => track.stop());

      // 等待一下確保資源釋放
      await new Promise(resolve => setTimeout(resolve, 100));

      // 獲取可用的攝像頭列表
      this.availableCameras = await HandTracker.getAvailableCameras();

      if (this.cameraSelect && this.availableCameras.length > 0) {
        // 清空下拉選單
        this.cameraSelect.innerHTML = '';

        // 添加選項
        this.availableCameras.forEach((camera, index) => {
          const option = document.createElement('option');
          option.value = camera.deviceId;
          option.textContent = camera.label;
          this.cameraSelect.appendChild(option);
        });

        // 設定預設選中的攝像頭
        this.selectedDeviceId = this.availableCameras[0].deviceId;

        // 添加切換事件監聽器
        this.cameraSelect.addEventListener('change', (e) => {
          this.switchCamera(e.target.value);
        });

        console.log(`✅ 找到 ${this.availableCameras.length} 個攝像頭`);
      } else {
        console.warn('⚠️ 未找到可用攝像頭，將使用系統預設');
        if (this.cameraSelect) {
          this.cameraSelect.innerHTML = '<option>使用預設攝像頭</option>';
        }
      }
    } catch (error) {
      console.error('❌ 無法載入攝像頭列表:', error);
      console.log('ℹ️ 將使用系統預設攝像頭');
      if (this.cameraSelect) {
        this.cameraSelect.innerHTML = '<option>使用預設攝像頭</option>';
      }
      // 不設置 selectedDeviceId，讓 HandTracker 使用預設攝像頭
    }
  }

  async switchCamera(deviceId) {
    console.log('📷 切換攝像頭:', deviceId);

    try {
      // 停止當前的手部追蹤
      if (this.handTracker) {
        this.handTracker.dispose();
      }

      // 使用新的攝像頭重新初始化
      const videoElement = document.getElementById('video');
      this.selectedDeviceId = deviceId;

      this.handTracker = new HandTracker(
        videoElement,
        (results) => this.handleHandResults(results),
        true, // 調試模式
        deviceId // 指定的攝像頭 ID
      );

      // 等待載入
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ 攝像頭切換成功');
    } catch (error) {
      console.error('❌ 切換攝像頭失敗:', error);
      alert('切換攝像頭失敗，請重新整理頁面');
    }
  }

  async init() {
    console.log('🌌 初始化量子粒子實驗室...');

    try {
      // 先載入攝像頭列表
      await this.loadCameraList();
      // 初始化場景
      const container = document.getElementById('canvas-container');
      if (!container) {
        throw new Error('找不到 canvas-container 元素');
      }
      this.sceneManager = new SceneManager(container);
      console.log('✅ Three.js 場景已建立');

      // 初始化粒子系統（減少數量以便觀察）
      this.particleSystem = new ParticleSystem(800);
      this.sceneManager.add(this.particleSystem.getObject());
      console.log('✅ 粒子系統已建立 (800 粒子)');

      // 初始化手勢控制器
      this.gestureController = new GestureController(
        this.particleSystem,
        this.sceneManager.scene
      );
      console.log('✅ 手勢控制器已建立');

      // 初始化手部追蹤（啟用調試模式）
      const videoElement = document.getElementById('video');
      if (!videoElement) {
        throw new Error('找不到 video 元素');
      }

      console.log('🎥 正在初始化 MediaPipe...');
      console.log('📷 使用攝像頭 ID:', this.selectedDeviceId);

      this.handTracker = new HandTracker(
        videoElement,
        (results) => this.handleHandResults(results),
        true, // 啟用調試模式
        this.selectedDeviceId // 使用選定的攝像頭
      );

      // 等待 MediaPipe 載入
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 檢查視頻是否正常運行
      if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
        console.log('✅ 手部追蹤已啟動');
        console.log(`📹 視頻解析度: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
      } else {
        console.warn('⚠️ 視頻可能未正常載入');
      }

      // 隱藏載入畫面
      setTimeout(() => {
        if (this.loadingScreen) {
          this.loadingScreen.classList.add('hidden');
        }
      }, 1500);

      // 開始渲染循環
      this.isRunning = true;
      this.animate(0);

      console.log('🎉 量子粒子實驗室啟動成功！');
      console.log('📌 將手放入攝像頭畫面以開始互動');
      console.log('📌 打開瀏覽器控制台可以看到手勢偵測信息');
    } catch (error) {
      console.error('❌ 初始化失敗:', error);
      console.error('錯誤詳情:', error.message);
      alert(`初始化失敗: ${error.message}\n請確認：\n1. 已授予攝像頭權限\n2. 瀏覽器支持 WebGL\n3. 網路連線正常（需載入 MediaPipe 模型）`);

      if (this.loadingScreen) {
        this.loadingScreen.innerHTML = `
          <div style="color: #ff0000;">
            <h2>❌ 初始化失敗</h2>
            <p>${error.message}</p>
            <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; font-size: 16px; cursor: pointer;">
              重新載入
            </button>
          </div>
        `;
      }
    }
  }

  handleHandResults(results) {
    const { gesture, handPosition } = results;

    // 更新 UI
    if (this.gestureStatus) {
      const gestureNames = {
        'NONE': '等待中',
        'FULL_OPEN': '🖐️ 排斥粒子',
        'PINCH': '🤏 捏合移動',
        'PEACE': '✌️ 旋轉渦旋'
      };

      this.gestureStatus.textContent = gestureNames[gesture.type] || '等待中';
    }

    // 更新手部光源位置
    if (handPosition) {
      const worldPos = {
        x: (handPosition.x - 0.5) * 20,
        y: -(handPosition.y - 0.5) * 15,
        z: 5
      };
      this.sceneManager.updateHandLight({
        x: worldPos.x,
        y: worldPos.y,
        z: worldPos.z,
        copy: function(pos) {
          this.x = pos.x;
          this.y = pos.y;
          this.z = pos.z;
        }
      });
    }
  }

  animate(currentTime) {
    if (!this.isRunning) return;

    requestAnimationFrame((time) => this.animate(time));

    // 計算 delta time（秒）
    const deltaTime = this.lastTime ? (currentTime - this.lastTime) / 1000 : 0;
    this.lastTime = currentTime;

    // 限制 delta time（避免突然的大跳躍）
    const clampedDelta = Math.min(deltaTime, 0.1);

    // 獲取經過的時間
    const time = this.sceneManager.getElapsedTime();

    // 更新粒子系統
    if (this.particleSystem) {
      this.particleSystem.update(clampedDelta, time);
    }

    // 更新手勢控制器
    if (this.gestureController && this.handTracker) {
      const handData = {
        handPosition: this.handTracker.getHandPosition(),
        gesture: this.handTracker.getCurrentGesture(),
        landmarks: this.handTracker.getLandmarks()
      };

      this.gestureController.update(handData, clampedDelta, time);
    }

    // 渲染場景
    if (this.sceneManager) {
      this.sceneManager.render();
    }

    // 更新 FPS
    this.updateFPS(currentTime);
  }

  updateFPS(currentTime) {
    this.frameCount++;

    if (currentTime - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;

      if (this.fpsCounter) {
        this.fpsCounter.textContent = this.fps;
      }

      if (this.particleCountDisplay) {
        this.particleCountDisplay.textContent = this.particleSystem.getCount();
      }
    }
  }

  dispose() {
    this.isRunning = false;

    if (this.handTracker) {
      this.handTracker.dispose();
    }

    if (this.gestureController) {
      this.gestureController.dispose();
    }

    if (this.particleSystem) {
      this.particleSystem.dispose();
    }

    if (this.sceneManager) {
      this.sceneManager.dispose();
    }
  }
}

// 啟動應用
const app = new QuantumParticleLab();

// 等待 DOM 載入完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.init();
  });
} else {
  app.init();
}

// 頁面卸載時清理資源
window.addEventListener('beforeunload', () => {
  app.dispose();
});

// 導出供外部使用（如果需要）
window.QuantumParticleLab = app;
