// Particle Fragment Shader
varying vec3 vColor;
varying float vAlpha;

uniform float uTime;

void main() {
  // 計算從中心到邊緣的距離
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  // 創建圓形粒子（柔和邊緣）
  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);

  // 添加光暈效果
  float glow = 1.0 - smoothstep(0.0, 0.5, dist);

  // 最終顏色
  vec3 finalColor = vColor + glow * 0.3;

  // 應用透明度
  float finalAlpha = alpha * vAlpha;

  // 如果太透明就丟棄片段（提升效能）
  if (finalAlpha < 0.01) discard;

  gl_FragColor = vec4(finalColor, finalAlpha);
}
