/**
 * GestureDetector - 手勢偵測器
 * 基於 MediaPipe Hands 的 21 個關鍵點偵測各種手勢
 */
export class GestureDetector {
  constructor() {
    // 手勢閾值（調整為更寬鬆的值）
    this.PINCH_THRESHOLD = 0.08;  // 增加閾值，更容易觸發
    this.EXTENDED_ANGLE_THRESHOLD = 165; // 指關節角度大於此值視為伸直
    this.CURL_ANGLE_THRESHOLD = 150;     // 指關節角度低於此值視為彎曲（放寬，彎指更容易）
    this.PEACE_V_SPREAD_RATIO = 0.35;    // ✌️ 兩指間距需達掌寬的比例
    this.PEACE_V_MIN_SPREAD = 0.025;     // ✌️ 最小間距下限（避免離鏡頭太近時失效）
    this.FULL_OPEN_SPREAD_THRESHOLD = 0.15; // 降低閾值，更容易張開

    // 上一個手勢（用於防抖動）
    this.lastGesture = 'NONE';
    this.gestureStableCount = 0;
    this.STABLE_FRAMES = 2; // 降低到 2 幀，反應更快

    // 調試模式
    this.debugMode = true;
    this.frameCount = 0;
  }

  /**
   * 偵測當前手勢
   * @param {Array} landmarks - MediaPipe 手部關鍵點 (21個點)
   * @returns {Object} { type: 'GESTURE_TYPE', confidence: 0-1 }
   */
  detect(landmarks) {
    if (!landmarks || landmarks.length !== 21) {
      return { type: 'NONE', confidence: 0 };
    }

    let gesture = 'NONE';
    let confidence = 0;

    // 調試：計算各種手勢的條件
    const pinchDist = this.calculateDistance(landmarks[4], landmarks[8]);
    const fingers = [
      this.isFingerExtended(landmarks, 8),
      this.isFingerExtended(landmarks, 12),
      this.isFingerExtended(landmarks, 16),
      this.isFingerExtended(landmarks, 20)
    ];
    const thumbExt = this.isThumbExtended(landmarks);
    const palmWidth = this.getPalmWidth(landmarks);

    // 每 30 幀輸出一次調試信息
    this.frameCount++;
    if (this.debugMode && this.frameCount % 30 === 0) {
      console.log('🔍 手勢檢測狀態:', {
        捏合距離: pinchDist.toFixed(3),
        捏合閾值: this.PINCH_THRESHOLD,
        食指: fingers[0] ? '伸直' : '彎曲',
        中指: fingers[1] ? '伸直' : '彎曲',
        無名指: fingers[2] ? '伸直' : '彎曲',
        小指: fingers[3] ? '伸直' : '彎曲',
        拇指: thumbExt ? '伸直' : '彎曲',
        掌寬: palmWidth.toFixed(3)
      });
    }

    // 按優先順序檢測手勢
    if (this.isPinch(landmarks)) {
      gesture = 'PINCH';
      confidence = 0.9;
    } else if (this.isPeaceSign(landmarks)) {
      gesture = 'PEACE';
      confidence = 0.85;
    } else if (this.isFullHandOpen(landmarks)) {
      // 五指張開：改為排斥粒子
      gesture = 'FULL_OPEN';
      confidence = 0.9;
    }

    // 手勢穩定性檢查（防止抖動）
    if (gesture === this.lastGesture) {
      this.gestureStableCount++;
    } else {
      this.gestureStableCount = 0;
      this.lastGesture = gesture;
    }

    // 只有穩定的手勢才返回
    if (this.gestureStableCount >= this.STABLE_FRAMES) {
      return { type: gesture, confidence };
    }

    return { type: 'NONE', confidence: 0 };
  }

  /**
   * 偵測捏合手勢 (拇指與食指接觸)
   */
  isPinch(landmarks) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];

    // 需要拇指與食指都伸直
    const thumbExtended = this.isThumbExtended(landmarks);
    const indexExtended = this.isFingerExtended(landmarks, 8);
    if (!thumbExtended || !indexExtended) return false;

    const distance = this.calculateDistance(thumbTip, indexTip);
    return distance < this.PINCH_THRESHOLD;
  }

  /**
   * 偵測開掌手勢 (所有手指伸直)
   */
  isOpenPalm(landmarks) {
    const fingersExtended = [
      this.isFingerExtended(landmarks, 8),  // 食指
      this.isFingerExtended(landmarks, 12), // 中指
      this.isFingerExtended(landmarks, 16), // 無名指
      this.isFingerExtended(landmarks, 20)  // 小指
    ];

    // 至少 4 根手指伸直（不要求拇指狀態），用於吸引
    const extendedCount = fingersExtended.filter(e => e).length;
    return extendedCount >= 4;
  }

  /**
   * 偵測握拳手勢 (所有手指彎曲) - 備用
   */
  isFist(landmarks) {
    const curledStates = [
      this.isFingerCurled(landmarks, 8),  // 食指
      this.isFingerCurled(landmarks, 12), // 中指
      this.isFingerCurled(landmarks, 16), // 無名指
      this.isFingerCurled(landmarks, 20)  // 小指
    ];
    const curledCount = curledStates.filter(Boolean).length;
    const thumbCurled = !this.isThumbExtended(landmarks);
    const pinchDist = this.calculateDistance(landmarks[4], landmarks[8]);

    // 至少 3 指明顯彎曲，拇指收起（不要求捏合距離）
    const isFist = curledCount >= 3 && thumbCurled;

    if (this.debugMode && this.frameCount % 60 === 0) {
      console.log('✊ FIST 檢測:', {
        食指彎曲: curledStates[0] ? '✓' : '✗',
        中指彎曲: curledStates[1] ? '✓' : '✗',
        無名指彎曲: curledStates[2] ? '✓' : '✗',
        小指彎曲: curledStates[3] ? '✓' : '✗',
        拇指收起: thumbCurled ? '✓' : '✗',
        捏合距離: pinchDist.toFixed(3),
        判定結果: isFist ? '通過' : '失敗'
      });
    }

    return isFist;
  }

  /**
   * 偵測按讚手勢 (拇指伸直，其餘手指彎曲，拇指向上) - 備用
   */
  isThumbsUp(landmarks) {
    const thumbExtended = this.isThumbExtended(landmarks);
    const otherCurled = [
      this.isFingerCurled(landmarks, 8),
      this.isFingerCurled(landmarks, 12),
      this.isFingerCurled(landmarks, 16),
      this.isFingerCurled(landmarks, 20)
    ];
    const curledCount = otherCurled.filter(Boolean).length;

    const wrist = landmarks[0];
    const thumbTip = landmarks[4];

    // 拇指相對手腕的高度差（y 越小代表越上方）
    const thumbAboveWrist = (wrist.y - thumbTip.y) > 0.05;

    const isThumbUp = thumbExtended && curledCount >= 3 && thumbAboveWrist;

    if (this.debugMode && this.frameCount % 60 === 0) {
      console.log('👍 THUMB_UP 檢測:', {
        拇指伸直: thumbExtended ? '✓' : '✗',
        其他四指彎曲數: curledCount,
        拇指高於手腕: thumbAboveWrist ? '✓' : '✗',
        判定結果: isThumbUp ? '通過' : '失敗'
      });
    }

    return isThumbUp;
  }

  /**
   * 偵測 V 字手勢 (食指和中指伸直)
   */
  isPeaceSign(landmarks) {
    const indexExtended = this.isFingerExtended(landmarks, 8);
    const middleExtended = this.isFingerExtended(landmarks, 12);
    const thumbExtended = this.isThumbExtended(landmarks);

    const ringCurled = this.isFingerCurled(landmarks, 16);
    const pinkyCurled = this.isFingerCurled(landmarks, 20);

    // V 形張開程度：使用掌寬比例，並設置最小下限
    const fingerGap = this.calculateDistance(landmarks[8], landmarks[12]);
    const palmWidth = this.getPalmWidth(landmarks);
    const requiredGap = Math.max(this.PEACE_V_MIN_SPREAD, palmWidth * this.PEACE_V_SPREAD_RATIO);

    // 食指和中指伸直，無名指和小指彎曲，且 V 字分開
    const isPeace = indexExtended && middleExtended && ringCurled && pinkyCurled && fingerGap > requiredGap;

    // 調試輸出
    if (this.debugMode && this.frameCount % 60 === 0) {
      console.log('✌️ PEACE 檢測:', {
        食指伸直: indexExtended ? '✓' : '✗',
        中指伸直: middleExtended ? '✓' : '✗',
        無名指彎曲: ringCurled ? '✓' : '✗',
        小指彎曲: pinkyCurled ? '✓' : '✗',
        拇指: thumbExtended ? '伸直' : '放鬆',
        V間距: fingerGap.toFixed(3),
        門檻: requiredGap.toFixed(3),
        判定結果: isPeace ? '通過' : '失敗'
      });
    }

    return isPeace;
  }

  /**
   * 偵測五指張開手勢 (包括拇指)
   */
  isFullHandOpen(landmarks) {
    const fingersExtended = [
      this.isFingerExtended(landmarks, 8),  // 食指
      this.isFingerExtended(landmarks, 12), // 中指
      this.isFingerExtended(landmarks, 16), // 無名指
      this.isFingerExtended(landmarks, 20)  // 小指
    ];

    const thumbExtended = this.isThumbExtended(landmarks);

    // 所有手指（包括拇指）都伸直，且手掌張開到足夠寬才算重置
    const spreadWide = this.getPalmWidth(landmarks) > this.FULL_OPEN_SPREAD_THRESHOLD;
    return fingersExtended.every(e => e) && thumbExtended && spreadWide;
  }

  /**
   * 檢查手指是否伸直
   * @param {Array} landmarks - 手部關鍵點
   * @param {number} tipIndex - 指尖索引 (8=食指, 12=中指, 16=無名指, 20=小指)
   */
  isFingerExtended(landmarks, tipIndex) {
    // 手指的四個關節點
    const tip = landmarks[tipIndex];
    const dip = landmarks[tipIndex - 1];  // 遠端指間關節
    const pip = landmarks[tipIndex - 2];  // 近端指間關節
    const mcp = landmarks[tipIndex - 3];  // 掌指關節

    // 計算指尖到掌指關節的距離
    const tipToMcp = this.calculateDistance(tip, mcp);
    // 計算 DIP 到掌指關節的距離
    const dipToMcp = this.calculateDistance(dip, mcp);

    // 指關節角度（越接近 180 越伸直）
    const curlAngle = this.getFingerCurlAngle(landmarks, tipIndex);

    // 如果指尖明顯遠於 DIP，或角度夠直，則判定為伸直
    return (tipToMcp > dipToMcp * 1.1) || (curlAngle > this.EXTENDED_ANGLE_THRESHOLD);
  }

  /**
   * 檢查手指是否彎曲
   */
  isFingerCurled(landmarks, tipIndex) {
    const tip = landmarks[tipIndex];
    const dip = landmarks[tipIndex - 1];
    const mcp = landmarks[tipIndex - 3];

    const tipToMcp = this.calculateDistance(tip, mcp);
    const dipToMcp = this.calculateDistance(dip, mcp);

    // 指關節角度（越小越彎曲）
    const curlAngle = this.getFingerCurlAngle(landmarks, tipIndex);

    // 距離接近或角度小於閾值，都視為彎曲
    return (tipToMcp < dipToMcp * 1.05) || (curlAngle < this.CURL_ANGLE_THRESHOLD);
  }

  /**
   * 檢查拇指是否伸直
   */
  isThumbExtended(landmarks) {
    const thumbTip = landmarks[4];
    const thumbMcp = landmarks[2];
    const wrist = landmarks[0];

    const tipToWrist = this.calculateDistance(thumbTip, wrist);
    const mcpToWrist = this.calculateDistance(thumbMcp, wrist);

    return tipToWrist > mcpToWrist * 1.3;
  }

  /**
   * 計算兩個關鍵點之間的歐氏距離
   */
  calculateDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = (point1.z || 0) - (point2.z || 0);

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * 獲取手掌中心位置
   */
  getPalmCenter(landmarks) {
    // 使用手腕和掌心的幾個關鍵點計算中心
    const wrist = landmarks[0];
    const indexMcp = landmarks[5];
    const pinkyMcp = landmarks[17];

    return {
      x: (wrist.x + indexMcp.x + pinkyMcp.x) / 3,
      y: (wrist.y + indexMcp.y + pinkyMcp.y) / 3,
      z: (wrist.z + indexMcp.z + pinkyMcp.z) / 3
    };
  }

  /**
   * 掌寬（用於區分一般開掌與真正張開五指）
   */
  getPalmWidth(landmarks) {
    const indexMcp = landmarks[5];
    const pinkyMcp = landmarks[17];
    return this.calculateDistance(indexMcp, pinkyMcp);
  }

  /**
   * 獲取手指間的夾角（用於更精確的手勢識別）
   */
  getFingerAngle(landmarks, fingerTip1, fingerTip2) {
    const tip1 = landmarks[fingerTip1];
    const tip2 = landmarks[fingerTip2];
    const palm = this.getPalmCenter(landmarks);

    const v1 = {
      x: tip1.x - palm.x,
      y: tip1.y - palm.y
    };

    const v2 = {
      x: tip2.x - palm.x,
      y: tip2.y - palm.y
    };

    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    return Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
  }

  /**
   * 計算單根手指的彎曲角度（PIP 關節）
   */
  getFingerCurlAngle(landmarks, tipIndex) {
    const mcp = landmarks[tipIndex - 3];
    const pip = landmarks[tipIndex - 2];
    const dip = landmarks[tipIndex - 1];

    const v1 = {
      x: mcp.x - pip.x,
      y: mcp.y - pip.y,
      z: (mcp.z || 0) - (pip.z || 0)
    };
    const v2 = {
      x: dip.x - pip.x,
      y: dip.y - pip.y,
      z: (dip.z || 0) - (pip.z || 0)
    };

    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

    if (mag1 === 0 || mag2 === 0) return 180;

    const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
    return Math.acos(cosAngle) * (180 / Math.PI);
  }

  /**
   * 重置手勢狀態
   */
  reset() {
    this.lastGesture = 'NONE';
    this.gestureStableCount = 0;
  }
}
