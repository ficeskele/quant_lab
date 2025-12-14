# 🌌 Quantum Particle Lab - 量子粒子互動實驗室

一個結合手勢控制與 3D 粒子系統的互動式 Web 應用，讓使用者透過手部動作操控虛擬粒子，創造出類似量子力學、電子雲、星系等科幻視覺效果。

![Quantum Particle Lab](https://img.shields.io/badge/version-1.0.0-blue)
![Three.js](https://img.shields.io/badge/Three.js-0.160.0-green)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands-orange)

## ✨ 核心特色

- 🎯 **直覺的手勢控制** - 無需任何實體裝置，僅用雙手即可操控
- 🌟 **絢麗的粒子視覺效果** - 800 個粒子的即時渲染
- 🔬 **自由粒子場模式** - 透過手勢控制力場（吸附、排斥、渦旋）
- 🎨 **高度客製化** - 動態顏色、Bloom 光暈、粒子拖尾
- ⚡ **高效能** - 穩定 60 FPS

## 🎮 手勢操作（自由模式）

| 手勢 | 功能 | 效果 |
|------|------|------|
| 🖐️ 五指張開 | 排斥粒子 | 粒子向外爆發散開 |
| 🤏 捏合 | 抓取粒子團 | 形成可移動的粒子球體 |
| ✌️ 雙指 | 旋轉渦旋 | 在粒子場中創造渦旋 |

## 🔬 粒子模式

### 自由粒子場 ⚡
- 完全自由的粒子互動
- 手勢產生動態力場
- 綠色量子態粒子
- 支援吸附、排斥、渦旋等效果

## 🚀 快速開始

### 安裝依賴

```bash
npm install
```

### 啟動開發伺服器

```bash
npm run dev
```

開啟瀏覽器訪問：`http://localhost:3000`

### 建置生產版本

```bash
npm run build
```

### 預覽生產版本

```bash
npm run preview
```

## 📋 系統需求

- **瀏覽器**: Chrome 90+、Firefox 88+、Safari 14+
- **設備**: 配備攝像頭的桌面或筆記型電腦
- **建議硬體**: 獨立顯卡（以達到最佳效能）

## 🏗️ 技術架構

### 核心技術棧

```
├── MediaPipe Hands (手勢追蹤)
├── Three.js (3D 渲染)
├── Vite (建置工具)
└── GLSL Shaders (粒子特效)
```

### 檔案結構

```
quantum-particle-lab/
├── index.html                  # 主 HTML
├── src/
│   ├── main.js                 # 主程式入口
│   ├── HandTracker.js          # MediaPipe 手勢追蹤
│   ├── ParticleSystem.js       # 粒子系統核心
│   ├── SceneManager.js         # Three.js 場景管理
│   ├── GestureController.js    # 手勢邏輯控制
│   ├── modes/
│   │   └── FreeMode.js         # 自由模式
│   ├── shaders/
│   │   ├── particle.vert       # 粒子頂點著色器
│   │   └── particle.frag       # 粒子片段著色器
│   └── utils/
│       ├── Physics.js          # 物理計算
│       └── GestureDetector.js  # 手勢偵測
├── package.json
└── vite.config.js
```

## 🎨 視覺設計

### 配色方案（自由模式）
- 綠色量子態 (#00ff88) + 動態力場

### 後期特效

- ✨ Bloom（光暈效果）
- 💫 Additive Blending（粒子疊加）
- 🌟 Dynamic Colors（動態顏色）
- 📊 Distance-based Opacity（距離淡化）

## 📊 效能優化

- **粒子數量**: 10,000 個（可根據設備調整）
- **目標 FPS**: 60 fps（桌面）/ 30 fps（移動裝置）
- **手勢延遲**: < 50ms
- **載入時間**: < 3 秒

### 優化技巧

1. 使用 GPU 加速的 Shader
2. 粒子幾何體實例化
3. 適當的摩擦力和速度限制
4. 手勢穩定性檢查（防抖動）

## 🎓 使用場景

- 🎨 **藝術創作**: 互動式視覺藝術展示
- 🔬 **教育**: 展示原子結構、星系運動等物理概念
- 🎮 **遊戲**: 作為遊戲機制或視覺效果
- 💼 **展示**: 企業展廳、科技展覽

## 🛠️ 客製化

### 調整粒子數量

在 `src/main.js` 中：

```javascript
this.particleSystem = new ParticleSystem(10000); // 改為你想要的數量
```

### 修改顏色方案

在 `src/modes/*.js` 中調整各模式的顏色：

```javascript
particleSystem.setColor(0x00ffff); // 設置粒子顏色
```

### 自訂手勢

在 `src/utils/GestureDetector.js` 中添加新的手勢偵測函數。

## 🐛 故障排除

### MediaPipe 無法載入

如果遇到 MediaPipe 無法正確載入的問題：

1. **使用測試頁面診斷**
   ```bash
   # 啟動開發伺服器後，訪問：
   http://localhost:3000/test.html
   ```
   測試頁面會顯示：
   - MediaPipe 載入狀態
   - 攝像頭連接狀態
   - 即時手部關鍵點視覺化
   - 手勢偵測結果

2. **檢查瀏覽器控制台**
   - 打開瀏覽器開發者工具（F12）
   - 查看控制台是否有錯誤訊息
   - 確認 MediaPipe 模型是否成功載入

3. **常見問題解決方案**

   **問題：攝像頭權限被拒絕**
   - 解決：點擊瀏覽器地址欄左側的鎖圖標，允許攝像頭權限
   - Chrome: 設定 → 隱私權和安全性 → 網站設定 → 攝像頭

   **問題：手勢無法偵測**
   - 確保光線充足
   - 手部完整出現在畫面中
   - 避免背景過於複雜
   - 查看視頻上的調試畫布是否顯示手部骨架

   **問題：CDN 載入失敗**
   - 檢查網路連線
   - 嘗試使用 VPN
   - 等待幾秒後刷新頁面

4. **調試模式**

   預設已啟用調試模式，你會看到：
   - 視頻上的綠色手部骨架
   - 紅色標記的關鍵點（手腕、指尖）
   - 當前偵測到的手勢名稱
   - 控制台中的手勢偵測日誌

   要關閉調試模式，修改 `src/main.js`:
   ```javascript
   this.handTracker = new HandTracker(videoElement, callback, false); // 改為 false
   ```

### 效能問題

如果遇到卡頓或 FPS 過低：

1. **降低粒子數量**（在 `src/main.js` 中）
   ```javascript
   this.particleSystem = new ParticleSystem(5000); // 從 10000 降到 5000
   ```

2. **關閉後期特效**（在 `src/SceneManager.js` 中）
   - 註解掉 `setupPostProcessing()` 中的 Bloom Pass

3. **降低視頻解析度**（在 `src/HandTracker.js` 中）
   ```javascript
   video: {
     width: { ideal: 320 },  // 從 640 降到 320
     height: { ideal: 240 }  // 從 480 降到 240
   }
   ```

### 已知限制

- **Safari**: MediaPipe 支援不穩定，建議使用 Chrome 或 Firefox
- **移動裝置**: 目前僅支援桌面瀏覽器
- **光線條件**: 需要良好的照明環境
- **手勢穩定性**: 需要保持手勢 3 幀以上才會觸發（防抖動）

## 🔮 未來計畫

- [ ] 移動裝置支援（觸控操作）
- [ ] 更多粒子模式（DNA 螺旋、量子糾纏等）
- [ ] 粒子間碰撞效果
- [ ] 錄製與分享功能
- [ ] VR/AR 支援

## 📄 授權

MIT License

## 👥 貢獻

歡迎提交 Issue 和 Pull Request！

## 🙏 致謝

- [Three.js](https://threejs.org/) - 3D 渲染引擎
- [MediaPipe](https://mediapipe.dev/) - 手勢追蹤
- [Vite](https://vitejs.dev/) - 建置工具

---

Made with ❤️ by Quantum Lab Team
