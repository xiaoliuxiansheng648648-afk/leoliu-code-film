---
name: leoliu-code-film
description: 用代码做电影感短片：每一帧画面和配乐都由 AI 写代码生成（Canvas 2D 插画场景、Three.js 3D 镜头、SVG／DOM 字幕与图解、numpy 合成配乐），HyperFrames 渲染成 MP4（最高 4K 60 帧）。当用户想用 Claude Code / Codex 做“不用视频模型、不用生图”的短片、节日短片、品牌短片、叙事动画、知识科普短片（一个概念一个演示），或者抱怨“一句话生成的视频很丑”时使用。不适合写实真人画面。
---

# leoliu-code-film：用代码拍一部短片

一句话能让模型写出一段动画，但出不来好片子。好片子来自**先定故事、先定风格，再动手**，然后反复看片返工。这个 Skill 把这套流程固定下来。两个完整示例：

- **故事短片** `examples/guoqing-train-home/`（61 秒，《国庆回家路》：车窗里的 2D 场景 + 两段 Three.js 航拍 + 代码合成配乐）。
- **知识短片** `examples/wuqiannian/`（108 秒，4K 60 帧，《上下五千年》：一个概念一步步演示，SVG／DOM 字幕＋Canvas 光点，五声音阶配乐，没有配音）。

## 开工前先问清（一次问完）

1. 片型：讲一个人的故事（故事短片），还是讲清一个概念（知识短片）。片长和画幅（默认 60 秒横版 1920×1080；知识短片可做 4K 60 帧）；发在哪个平台。
2. 讲什么：谁、想要什么、最后落在哪。没有故事就先帮用户想一个，**不要做地名清单或风格合集**。
3. 要不要人声。只需要一两句时，让用户用自己的 TTS 生成 wav；全片可以只靠字幕和配乐。
4. 环境：Node 22+、ffmpeg、`uv`（跑 Python 配乐）、能联网下载依赖。缺什么先说。

## 流程（每一步做完再进下一步）

1. **故事与分镜表**：故事短片读 `references/story-and-style.md`，知识短片读 `references/knowledge-film.md`（多一列“观众此刻在猜什么”）。写出镜头表：时间段｜画面｜屏幕字／消息｜声音事件。第 0 帧必须一眼看懂，前 2 秒就给结论或钩子；结尾留一个开放问题。给用户确认。
2. **风格帧关**：先渲 3 张定稿质量的静帧（开场、最强的一场、结尾），给用户看。**用户没点头不做动画。**画面达不到就换路线（2D ↔ 3D ↔ 混合），不要在动画阶段硬补。配方和禁用清单在 `references/story-and-style.md`。
3. **搭工程**：故事短片复制 `examples/guoqing-train-home/`，知识短片复制 `examples/wuqiannian/`（改 `src/` 里的源码，再 `python3 build.py`）。然后运行 `bash scripts/fetch-vendor.sh <新目录>`，它只下载项目用到的 GSAP、Three.js 和字体。故事短片按 `references/build.md` 改镜头表 `SHOTS`、2D 场景函数和 3D 镜头；知识短片按 `references/knowledge-film.md` 的“工程”一节改 `src/film.js` 和 `src/index.src.html`。**每一帧只能由时间 t 决定**：不用 `setTimeout`、CSS 动画或 `Math.random()`，随机数一律用带种子的 `rng(seed)`。
4. **配乐**：改 `music.py`（和弦、琶音、环境声、转场重音、人声处压低），`uv run music.py` 生成 `assets/audio/music.wav`。见 `references/sound-render-check.md`。
5. **自检，至少两轮**：`npx -y hyperframes@0.8.77 check` 修掉报错；`snapshot` 抽第 0 帧、每个转场前后、每条字幕出现时的静帧，用缩到 0.2 倍的手机尺寸看。按 `references/pitfalls.md` 逐条排查。不好看就改，别只修技术报错。
6. **渲染交付**：`render` → 用 x264 重新压缩（胶片颗粒会让文件巨大）→ 响度统一到 -16 LUFS。命令在 `references/sound-render-check.md`。
7. **文案要老实**：写清哪些是代码画的、哪些不是（例如配音是 TTS），写真实耗时和改了几版；不写“一句话生成”“几毛钱”。平台要求时勾选 AI 生成声明。

## 交付时给用户

成片 MP4、可改的源码目录、3 张风格帧、每一轮自检发现和修改的清单，以及还没做完的事（例如配音待录）。

## 参考

- `references/story-and-style.md`：故事结构、风格帧、光影配方、禁用清单
- `references/knowledge-film.md`：知识短片的选题四问、结构、节奏、画面和工程
- `references/build.md`：工程结构、2D 画布工具箱、3D 镜头配方、时间轴与转场
- `references/sound-render-check.md`：配乐合成、自检清单、渲染压缩与响度、只重渲一段
- `references/pitfalls.md`：做示例片时真实踩过的坑
- `docs/why-one-prompt-fails.md`：同一个模型，从 v1 到 v6 为什么差这么多
