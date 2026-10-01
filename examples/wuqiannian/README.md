# 示例：《上下五千年》（知识短片，108 秒，4K 60 帧）

从“五千年前到你，中间隔着多少代人”算起：一代约 27 年，五千年不到 200 代；坐不满一列复兴号的三分之一；你和李白之间不到 50 人。再往上数，每一代祖先的“座位”翻一倍，33 代就比今天全世界的人还多——座位比人多，只能是同一个人坐进了很多个座位。落点：往上数，我们是一家人。

没有配音，只有字幕和配乐；每一帧画面和每一个声音都是代码生成的（代码由 Claude Code 里的 Opus 5.5 编写）。写法见 `../../references/knowledge-film.md`。

## 文件

```text
src/index.src.html   # 版式、字体、字幕和所有 DOM／SVG 元素
src/film.js          # GSAP 时间轴＋两个 Canvas 粒子场景（时间轴拉远、祖先座位、多人家谱交织）
build.py             # 把 src/film.js 内联进 index.html（HyperFrames 需要）
index.html           # build.py 的产物，可以直接渲染
music.py             # 配乐：D 宫五声音阶，拨弦、钟、颂钵、低频、空气声、混响 → assets/audio/music.wav
music_real.py        # 同一份谱，换成真乐器录音（竖琴、钟琴、大提琴组、管钟、锣）→ 覆盖 assets/audio/music.wav
hyperframes.json
```

`vendor/`、`_fonts/` 由 `bash ../../scripts/fetch-vendor.sh <目录>` 下载（GSAP、Noto Serif SC、EB Garamond）。

## 跑起来

```bash
cp -r examples/wuqiannian my-film && bash scripts/fetch-vendor.sh my-film && cd my-film
python3 build.py && uv run music.py      # 已发布版本用的合成配乐
# 或真乐器版：bash ../scripts/fetch-samples.sh && uv run music_real.py
npx -y hyperframes@0.8.77 check
npx -y hyperframes@0.8.77 snapshot --at 0,20.6,52.3,68.9,98.8 --no-end
npx -y hyperframes@0.8.77 render -o raw.mp4 --fps 60 --resolution 4k --quality delivery
```

M1 Max 上 4K 60 帧渲染约 31 分钟、原始文件约 1.2 GB，用 `references/sound-render-check.md` 里的命令重新压缩、统一响度。

## 制作过程

简报 → 40 秒 4K 样片（先给人看画面、配乐和节奏）→ 补全片 → 自检 → 成片，约 5 小时。全片渲完发现 57.9 秒两个画布图层交接时跳了一下：改成 0.6 秒交叉淡化，只重渲 56–60 秒拼回成片（见 `references/sound-render-check.md`“只重渲一段”）。

## 片中数字的出处

| 说法 | 依据 |
|---|---|
| 一代人平均约 27 年 | Wang, Al-Saffar, Rogers & Hahn, *Science Advances* 2023（doi:10.1126/sciadv.abm7047），过去 25 万年平均代际间隔 26.9 年 |
| 五千年不到 200 代（185 代） | 5000 ÷ 26.9 ≈ 185.9 |
| 一列复兴号 576 座 | 《复兴号中国标准动车组》，*Engineering* 2020：CR400AF 8 辆编组定员 576 人 |
| 和李白之间不到 50 人 | 李白生于 701 年；(2026 − 701) ÷ 26.9 ≈ 49.3 |
| 和孔子之间不到 100 人 | 孔子生于前 551 年（《史记·孔子世家》）；(2026 + 551 − 1) ÷ 26.9 ≈ 95.8 |
| 往上 33 代，86 亿个“祖先座位” | 每人 2 位父母，第 n 代 2ⁿ 个座位；2³³ = 8,589,934,592 |
| 比今天全世界的人还多 | 联合国《世界人口展望 2024》：2026 年年中约 83 亿 |
| 共同祖先 | Rohde, Olson & Chang, *Nature* 431:562–566 (2004)：在他们的模型里，今天所有人最近的共同祖先可能生活在几千年前；再早几千年，那时的每个人要么是今天所有人的祖先，要么没有留下后代。片中注明“数学模型推算，并非族谱记录” |

画面里没有地图、国旗和近现代政治内容；“一家人”只指数学模型意义上的共同祖先。
