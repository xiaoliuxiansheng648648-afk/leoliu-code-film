# 配乐、自检、渲染

## 配乐（music.py，numpy 合成）

知识短片的配乐写法（五声音阶、拨弦、钟、颂钵）见 `references/knowledge-film.md`；下面是故事片示例的做法。

- 结构：每 3 秒一小节（80 BPM），四个和弦循环打底；火车动起来后加琶音；大场面加低八度和“心跳”底鼓。
- 声音跟画面走：列车启动一个低频“咚”、转场前一个横扫的呼啸、进隧道闷一声、出隧道一个重音加钟声、每条消息一声轻“叮”、自己回复一声“嗖”、结尾解决到主和弦。
- 有人声的那几秒，把配乐压到 0.55 倍左右。
- 第 0 秒就要有声音（一个短钟声），开头无声容易被划走。
- 只用自己合成的声音，不用现成曲目和音效包，版权最干净。

## 自检清单（每轮都过一遍）

1. `npx -y hyperframes@0.8.77 check`：报错必须修；对比度提示多半是字压在亮处，给字加深色描边或底。
2. `npx -y hyperframes@0.8.77 snapshot --at 0,<每个转场前后>,<每条字幕出现时> --no-end`，逐张看：
   - 第 0 帧在手机小窗（缩到 0.2 倍）里能不能一眼看懂；
   - 字有没有被遮、被光吃掉；
   - 转场那一帧是不是一片发白或两张图叠得发灰；
   - 主体在不在画面里；
   - 有没有奇怪的倒影、飘在天上的桥墩这类穿帮。
3. 用“好不好看”而不只是“有没有报错”来判断；至少改两轮。

## 渲染与交付

```bash
# 故事片（示例 1）：1080p 30 帧
npx -y hyperframes@0.8.77 render -o raw.mp4 --fps 30 --quality delivery --video-frame-format png --quiet
# 知识短片（示例 2）：4K 60 帧
npx -y hyperframes@0.8.77 render -o raw.mp4 --fps 60 --resolution 4k --quality delivery --quiet
# 有胶片颗粒时原始文件会有几百 MB 到 1 GB 多，重新压缩（4K 用 crf 18）：
ffmpeg -i raw.mp4 -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -c:a copy -movflags +faststart film.mp4
```

耗时（M1 Max）：61 秒带 3D 的故事片约 3 分钟（有 WebGL 时 HyperFrames 自动改用截图模式）；108 秒的 4K 60 帧知识短片约 31 分钟，40 秒样片约 11 分钟。GitHub 单文件上限 100 MB，成片不要提交进仓库。

### 响度：先量，再补增益，再限幅

```bash
# 1) 量：I 是整体响度，Peak 是真峰值
ffmpeg -i film.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
# 2) 差多少补多少（例：量出 -20.0 LUFS，就 +4 dB），再限幅。
#    level=false 关掉自动电平，latency=true 补偿限幅器延迟、保证音画同步
ffmpeg -i film.mp4 -c:v copy -af "volume=4dB,alimiter=limit=0.79:level=false:latency=true" -c:a aac -b:a 256k film-master.mp4
# 3) 再量一次：I 在 -16±0.5 LUFS、真峰值不高于 -1.5 dBTP 才交付；不够就微调第 2 步的增益
```

单步的 `loudnorm` 遇到钟声这类瞬态，真峰值容易超标，限幅后响度又会往下掉，所以按“量→补→限→再量”走。

### 只重渲一段（补丁）

成片里某几秒有问题（例如图层交接处跳一下），改好源码后只渲那几秒，再拼回去：

```js
// 复制 index.html 到 patch/index.html，根元素改成 data-duration="4"，时间轴注册处换成：
const master = gsap.timeline({ paused: true });
master.add(tl.tweenFromTo(56, 60, { ease: 'none' }), 0);   // 原片的 56–60 秒
window.__timelines["main"] = master;
```

```bash
# 在 patch/ 里用同样的参数渲染 patch.mp4，再在最后一次压缩时拼进去：
ffmpeg -i raw.mp4 -i patch/patch.mp4 -filter_complex \
  "[0:v]trim=start=0:end=56,setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[0:v]trim=start=60,setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0[v]" \
  -map "[v]" -map 0:a -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r 60 -c:a copy -movflags +faststart film.mp4
```

示例片 57.9 秒的跳变就是这样修的：重渲 4 秒，而不是 31 分钟的整片。拼完逐帧比对接缝前后的画面差，确认没有新的跳变。
