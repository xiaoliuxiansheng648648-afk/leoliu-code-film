# Third-party software

This repository contains only original code and documentation (MIT, see LICENSE). The following are **used but not included**; `scripts/fetch-vendor.sh` downloads them into each project folder, and you are bound by their own licenses:

| Component | Used for | License |
|---|---|---|
| [HyperFrames](https://github.com/heygen-com/hyperframes) 0.8.77 (run via `npx`) | Rendering HTML compositions to MP4 | Apache-2.0 |
| [Three.js](https://github.com/mrdoob/three.js) 0.160.0 | 3D shots | MIT |
| [GSAP](https://gsap.com) 3.14.2 | Timeline | GreenSock Standard "No Charge" License |
| [Noto Sans SC](https://fonts.google.com/noto/specimen/Noto+Sans+SC) | Chinese type | SIL Open Font License 1.1 |
| [Noto Serif SC](https://fonts.google.com/noto/specimen/Noto+Serif+SC) | Chinese serif type (knowledge-film example) | SIL Open Font License 1.1 |
| [EB Garamond](https://fonts.google.com/specimen/EB+Garamond) | Latin type and numerals (knowledge-film example) | SIL Open Font License 1.1 |
| numpy (via `uv run`) | Music synthesis | BSD-3-Clause |
| [soundfile](https://github.com/bastibe/python-soundfile) (via `uv run`) | Reading instrument samples | BSD-3-Clause |
| [VSCO 2 CE](https://github.com/sgossner/VSCO-2-CE) (subset, via `scripts/fetch-samples.sh`) | Recorded harp, glockenspiel, cello section, tubular bells, gong | CC0 1.0 |

The first example film's opening voice line was recorded with the author's own voice service and is not included. The second example (`examples/wuqiannian`) has no voice; its music is synthesised by its own `music.py`.
