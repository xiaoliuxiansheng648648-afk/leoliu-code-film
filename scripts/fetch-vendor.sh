#!/usr/bin/env bash
# Download the third-party runtime files a leoliu-code-film project needs into <project>/vendor and <project>/_fonts.
# They are not stored in this repo: GSAP (GreenSock standard license), Three.js (MIT), Noto Sans SC / Noto Serif SC /
# EB Garamond (SIL OFL 1.1). Only what the project's HTML/JS references is downloaded.
#   bash scripts/fetch-vendor.sh examples/guoqing-train-home
#   bash scripts/fetch-vendor.sh examples/wuqiannian
set -euo pipefail
DIR="${1:?usage: fetch-vendor.sh <project-dir>}"
THREE=0.160.0; GSAP=3.14.2
CDN=https://cdn.jsdelivr.net/npm
FONTS=https://github.com/google/fonts/raw/main/ofl
uses() { grep -rqs --include='*.html' --include='*.js' --exclude-dir=vendor -e "$1" "$DIR"; }

mkdir -p "$DIR/vendor" "$DIR/_fonts"
curl -fsSL "$CDN/gsap@$GSAP/dist/gsap.min.js" -o "$DIR/vendor/gsap.min.js"

if uses "vendor/three/"; then
  mkdir -p "$DIR/vendor/three/addons/"{objects,postprocessing,shaders,geometries}
  curl -fsSL "$CDN/three@$THREE/build/three.module.js" -o "$DIR/vendor/three/three.module.js"
  for f in objects/Water.js geometries/RoundedBoxGeometry.js \
           postprocessing/EffectComposer.js postprocessing/RenderPass.js postprocessing/UnrealBloomPass.js \
           postprocessing/OutputPass.js postprocessing/ShaderPass.js postprocessing/Pass.js postprocessing/MaskPass.js \
           shaders/CopyShader.js shaders/LuminosityHighPassShader.js shaders/OutputShader.js; do
    curl -fsSL "$CDN/three@$THREE/examples/jsm/$f" -o "$DIR/vendor/three/addons/$f"
  done
fi
if uses "NotoSansSC-VF.ttf"; then
  curl -fsSL "$FONTS/notosanssc/NotoSansSC%5Bwght%5D.ttf" -o "$DIR/_fonts/NotoSansSC-VF.ttf"
  curl -fsSL "$FONTS/notosanssc/OFL.txt" -o "$DIR/_fonts/OFL.txt"
fi
if uses "NotoSerifSC-VF.ttf"; then
  curl -fsSL "$FONTS/notoserifsc/NotoSerifSC%5Bwght%5D.ttf" -o "$DIR/_fonts/NotoSerifSC-VF.ttf"
  curl -fsSL "$FONTS/notoserifsc/OFL.txt" -o "$DIR/_fonts/OFL-NotoSerifSC.txt"
fi
if uses "EBGaramond-VF.ttf"; then
  curl -fsSL "$FONTS/ebgaramond/EBGaramond%5Bwght%5D.ttf" -o "$DIR/_fonts/EBGaramond-VF.ttf"
  curl -fsSL "$FONTS/ebgaramond/EBGaramond-Italic%5Bwght%5D.ttf" -o "$DIR/_fonts/EBGaramond-Italic-VF.ttf"
  curl -fsSL "$FONTS/ebgaramond/OFL.txt" -o "$DIR/_fonts/OFL-EBGaramond.txt"
fi
echo "vendor files ready in $DIR"
