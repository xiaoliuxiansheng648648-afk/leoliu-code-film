# 搭工程

## 目录（复制 `examples/guoqing-train-home/` 起步）

```text
my-film/
  index.html      # 合成：镜头表、两张画布、字幕和消息（DOM）、GSAP 时间轴、音频
  engine.js       # 2D 画布工具箱（window.XE）
  scenes2d.js     # 2D 场景，每个都是 draw(ctx, glow, t, o) 纯函数（window.XS2）
  scene3d.js      # Three.js 镜头（ES module，导出 render3d(name, t, dur)）
  music.py        # 配乐合成 → assets/audio/music.wav
  hyperframes.json
  vendor/ _fonts/ # 由 scripts/fetch-vendor.sh 下载，不入库
```

## 时间轴（index.html）

- 根元素 `<div id="root" data-composition-id="main" data-duration="61" data-width="1920" data-height="1080">`。
- 一个 `state.t` 由 GSAP 从 0 推到片长；`onUpdate` 里调用 `render(t)`，按镜头表 `SHOTS = [[name, start, end, '2d'|'3d'], …]` 决定画哪几个镜头。时间轴必须 `paused: true` 并注册到 `window.__timelines.main`，HyperFrames 逐帧 seek 它。
- 3D 画布在下、2D 画布在上。转场：2D→3D 时 2D 画布放大并淡出（像镜头从车窗推出去）；3D→2D 反过来；2D→2D 交叉淡化；大切换用 0.1 秒的暖色闪白盖住。
- 字幕、站名、手机消息用 DOM＋GSAP 做，比画在画布上清楚，也好改字。
- 第 0 帧需要显示的元素，初始状态直接写在 DOM／CSS 里，不要靠 0 秒的 `tl.set`（seek 到 0 时可能没生效）。

## 2D 工具箱（engine.js，`window.XE`）

| 函数 | 作用 |
|---|---|
| `sky(ctx, stops)` | 纵向渐变天空 |
| `sun(ctx, glow, x, y, r, core, halo)` | 太阳本体＋光晕，同时画到发光层 |
| `rays(ctx, x, y, n, len, color, alpha, seed, spread, dir)` | 光束 |
| `hazeBand(ctx, y, h, color, a)` | 横向雾带 |
| `ridgePts / ridge / rimRidge` | 山脊线、填充、边缘亮线 |
| `poplar / banana / canopy` | 杨树、芭蕉、榕树剪影 |
| `water(...)` | 带太阳光路、会闪的水面 |
| `trussBridge / train / skyline` | 桁架桥、高铁侧视、城市天际线（窗灯画到发光层） |
| `interior / reflection / glassSheen / clipWindow` | 车厢、窗上倒影、玻璃反光、只在窗内作画 |
| `phone / bubble / title` | 手机、聊天气泡、标题 |
| `post(ctx, glowCanvas, frame, opt)` | 泛光、调色、暗角、胶片颗粒（最后调用） |

写新场景：`clipWindow` 后画天空 → 远景 → 雾 → 中景 → 近景（按 `o.shift` 做视差，越近越快）→ `restore` → `interior` 等车厢元素。随机数用 `rng(seed)`。

## 3D 镜头（scene3d.js）

- **天空**：不要用物理天空（难控颜色），用一个球面着色器：地平线色、中间色、天顶色、太阳方向附近加热色和太阳盘，四个颜色做成 uniform，每个镜头一套 `LOOKS`。
- **水**：Three.js `Water`，法线贴图用 canvas 程序生成（叠加多组正弦波），`sunDirection`、`waterColor` 跟着镜头换。
- **大气**：`FogExp2`，颜色取地平线色；远景城市用不受雾影响的深色剪影＋少量发光窗户，再在前面放一块渐变“雾墙”。
- **后期**：`UnrealBloomPass`（阈值 0.9 左右，别让整片发白）＋一个自写的调色/暗角/颗粒 ShaderPass＋`OutputPass`，色调映射用 ACES。
- **镜头**：每个镜头写成时间的函数（`ease(p)`），相机跟着主体走；主体在画面三分之一处，结尾别让主体跑出画面。
- **太阳别直接进画面中央**：会整片发白、盖住标题；放到画面边上或画外，做侧逆光。
