import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

/**
 * SceneManager - 管理 Three.js 場景、相機、渲染器和後期特效
 */
export class SceneManager {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.clock = new THREE.Clock();

    this.init();
    this.setupPostProcessing();
    this.setupLights();
    this.handleResize();

    window.addEventListener('resize', () => this.handleResize());
  }

  init() {
    // 建立場景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.Fog(0x000000, 10, 50);

    // 建立相機
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 15;

    // 建立渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.container.appendChild(this.renderer.domElement);
  }

  setupPostProcessing() {
    // 暫時關閉 Bloom 效果，使用直接渲染
    // this.composer = new EffectComposer(this.renderer);
    // const renderPass = new RenderPass(this.scene, this.camera);
    // this.composer.addPass(renderPass);
    // const bloomPass = new UnrealBloomPass(...);
    // this.composer.addPass(bloomPass);

    // 不使用 composer，直接渲染（無暈光）
    this.composer = null;
  }

  setupLights() {
    // 環境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);

    // 點光源（用於手部位置）
    this.handLight = new THREE.PointLight(0x00ffff, 1, 10);
    this.handLight.position.set(0, 0, 5);
    this.scene.add(this.handLight);

    // 方向光
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(5, 5, 5);
    this.scene.add(dirLight);
  }

  updateHandLight(position) {
    if (position && this.handLight) {
      this.handLight.position.copy(position);
    }
  }

  render() {
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    if (this.composer) {
      this.composer.setSize(width, height);
    }
  }

  add(object) {
    this.scene.add(object);
  }

  remove(object) {
    this.scene.remove(object);
  }

  getElapsedTime() {
    return this.clock.getElapsedTime();
  }

  getDeltaTime() {
    return this.clock.getDelta();
  }

  dispose() {
    this.renderer.dispose();
    if (this.composer) {
      this.composer.dispose();
    }
    window.removeEventListener('resize', this.handleResize);
  }
}
