import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { GestureDetector } from './utils/GestureDetector.js';

/**
 * HandTracker - MediaPipe Hands 整合與手勢追蹤
 */
export class HandTracker {
  constructor(videoElement, onResults, debugMode = true, deviceId = null) {
    this.videoElement = videoElement;
    this.onResults = onResults;
    this.hands = null;
    this.camera = null;
    this.gestureDetector = new GestureDetector();
    this.deviceId = deviceId; // 指定使用的攝像頭 ID

    this.currentGesture = { type: 'NONE', confidence: 0 };
    this.handPosition = null;
    this.landmarks = null;

    // 調試模式
    this.debugMode = debugMode;
    this.debugCanvas = null;
    this.debugCtx = null;

    this.init();
  }

  /**
   * 獲取所有可用的攝像頭列表
   * @returns {Promise<Array>} 攝像頭設備列表
   */
  static async getAvailableCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      return cameras.map((camera, index) => ({
        deviceId: camera.deviceId,
        label: camera.label || `攝像頭 ${index + 1}`,
        groupId: camera.groupId
      }));
    } catch (error) {
      console.error('❌ 無法獲取攝像頭列表:', error);
      return [];
    }
  }

  async init() {
    // 初始化 MediaPipe Hands
    this.hands = new Hands({
      locateFile: (file) => {
        // 使用固定版本的 CDN 路徑，避免預設路徑 404
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
      }
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
      // 與鏡像的預覽畫面對齊，避免左右顛倒造成手勢誤判
      selfieMode: true
    });

    this.hands.onResults((results) => this.handleResults(results));

    // 初始化攝像頭
    await this.initCamera();
  }

  async initCamera() {
    try {
      // 構建攝像頭配置
      const videoConstraints = {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      };

      // 如果指定了 deviceId，使用該攝像頭
      if (this.deviceId) {
        videoConstraints.deviceId = { exact: this.deviceId };
        delete videoConstraints.facingMode; // 使用 deviceId 時移除 facingMode
      }

      // 請求攝像頭權限
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints
      });

      this.videoElement.srcObject = stream;

      // 等待視頻載入
      await new Promise((resolve) => {
        this.videoElement.onloadedmetadata = resolve;
      });

      // 創建調試畫布（覆蓋在視頻上）
      if (this.debugMode) {
        this.createDebugCanvas();
      }

      // 初始化 MediaPipe Camera
      this.camera = new Camera(this.videoElement, {
        onFrame: async () => {
          await this.hands.send({ image: this.videoElement });
        },
        width: 640,
        height: 480
      });

      await this.camera.start();

      console.log('✅ 攝像頭已啟動');
    } catch (error) {
      console.error('❌ 無法啟動攝像頭:', error);
      alert('無法存取攝像頭，請確認已授予權限');
    }
  }

  createDebugCanvas() {
    // 在視頻元素上覆蓋一個 canvas 來繪製手部關鍵點
    this.debugCanvas = document.createElement('canvas');
    this.debugCanvas.style.position = 'absolute';
    this.debugCanvas.style.top = this.videoElement.offsetTop + 'px';
    this.debugCanvas.style.left = this.videoElement.offsetLeft + 'px';
    this.debugCanvas.width = this.videoElement.width || 200;
    this.debugCanvas.height = this.videoElement.height || 150;
    this.debugCanvas.style.width = this.videoElement.style.width || '200px';
    this.debugCanvas.style.height = this.videoElement.style.height || '150px';
    this.debugCanvas.style.pointerEvents = 'none';
    this.debugCanvas.style.zIndex = '15';

    this.debugCtx = this.debugCanvas.getContext('2d');

    // 插入到 DOM
    this.videoElement.parentElement.appendChild(this.debugCanvas);
  }

  drawLandmarks(landmarks) {
    if (!this.debugCanvas || !this.debugCtx) return;

    const ctx = this.debugCtx;
    const canvas = this.debugCanvas;

    // 清空畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks) return;

    // 繪製關鍵點
    ctx.fillStyle = '#00ff00';
    landmarks.forEach((point, index) => {
      const x = point.x * canvas.width;
      const y = point.y * canvas.height;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();

      // 標記重要的點
      if ([0, 4, 8, 12, 16, 20].includes(index)) {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#00ff00';
      }
    });

    // 繪製連線（手掌和手指骨架）
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;

    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],        // 拇指
      [0, 5], [5, 6], [6, 7], [7, 8],        // 食指
      [0, 9], [9, 10], [10, 11], [11, 12],   // 中指
      [0, 13], [13, 14], [14, 15], [15, 16], // 無名指
      [0, 17], [17, 18], [18, 19], [19, 20], // 小指
      [5, 9], [9, 13], [13, 17]              // 手掌
    ];

    connections.forEach(([start, end]) => {
      const p1 = landmarks[start];
      const p2 = landmarks[end];

      ctx.beginPath();
      ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
      ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
      ctx.stroke();
    });

    // 顯示詳細的手勢資訊
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`手勢: ${this.currentGesture.type}`, 10, 30);
    ctx.fillText(`信心度: ${(this.currentGesture.confidence * 100).toFixed(0)}%`, 10, 50);

    // 顯示手指狀態（用於調試）
    ctx.font = '12px Arial';
    ctx.fillStyle = '#00ff88';

    const fingerNames = ['拇指', '食指', '中指', '無名指', '小指'];
    const fingerIndices = [4, 8, 12, 16, 20];

    fingerIndices.forEach((tipIndex, i) => {
      const tip = landmarks[tipIndex];
      const x = tip.x * canvas.width;
      const y = tip.y * canvas.height;

      // 在指尖旁顯示手指名稱
      ctx.fillText(fingerNames[i], x + 10, y);
    });
  }

  handleResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      this.landmarks = landmarks;

      // 偵測手勢
      this.currentGesture = this.gestureDetector.detect(landmarks);

      // 調試輸出
      if (this.debugMode && this.currentGesture.type !== 'NONE') {
        console.log(`🖐️ 偵測到手勢: ${this.currentGesture.type} (信心度: ${this.currentGesture.confidence.toFixed(2)})`);
      }

      // 獲取手掌中心位置
      const palmCenter = this.gestureDetector.getPalmCenter(landmarks);
      this.handPosition = palmCenter;

      // 繪製調試視覺化
      if (this.debugMode) {
        this.drawLandmarks(landmarks);
      }

      // 回調給主程式
      if (this.onResults) {
        this.onResults({
          landmarks,
          gesture: this.currentGesture,
          handPosition: palmCenter
        });
      }
    } else {
      // 沒有偵測到手部
      this.landmarks = null;
      this.handPosition = null;
      this.currentGesture = { type: 'NONE', confidence: 0 };

      // 清空調試畫布
      if (this.debugMode && this.debugCtx) {
        this.debugCtx.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);
      }

      if (this.onResults) {
        this.onResults({
          landmarks: null,
          gesture: this.currentGesture,
          handPosition: null
        });
      }
    }
  }

  getCurrentGesture() {
    return this.currentGesture;
  }

  getHandPosition() {
    return this.handPosition;
  }

  getLandmarks() {
    return this.landmarks;
  }

  dispose() {
    if (this.camera) {
      this.camera.stop();
    }
    if (this.hands) {
      this.hands.close();
    }
    if (this.videoElement && this.videoElement.srcObject) {
      const tracks = this.videoElement.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    if (this.debugCanvas && this.debugCanvas.parentElement) {
      this.debugCanvas.parentElement.removeChild(this.debugCanvas);
    }
  }
}
