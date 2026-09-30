# 配乐、自检、渲染

## 配乐（music.py，numpy 合成）

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
npx -y hyperframes@0.8.77 render -o raw.mp4 --fps 30 --quality delivery --video-frame-format png --quiet
# 有胶片颗粒时原始文件会有几百 MB，重新压缩：
ffmpeg -i raw.mp4 -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -c:a copy -movflags +faststart film.mp4
# 响度统一到 -16 LUFS（画面不重编码）：
ffmpeg -i film.mp4 -c:v copy -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:a aac -b:a 192k film-master.mp4
```

有 WebGL 时 HyperFrames 会自动改用截图模式，61 秒大约 3 分钟（8 核笔记本）。GitHub 单文件上限 100 MB，成片不要提交进仓库。
