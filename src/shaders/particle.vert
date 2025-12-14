// Particle Vertex Shader
attribute float size;
attribute vec3 customColor;

varying vec3 vColor;
varying float vAlpha;

uniform float uTime;

void main() {
  vColor = customColor;

  // 計算粒子的透明度（基於距離中心的遠近）
  float dist = length(position);
  vAlpha = 1.0 - smoothstep(5.0, 20.0, dist);

  // 計算粒子的最終位置
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  // 粒子大小隨距離衰減
  float pointSize = size * (300.0 / -mvPosition.z);
  gl_PointSize = pointSize;

  gl_Position = projectionMatrix * mvPosition;
}
