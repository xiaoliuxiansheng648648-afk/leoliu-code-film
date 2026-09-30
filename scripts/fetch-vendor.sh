#!/usr/bin/env bash
# Download the third-party runtime files a leoliu-code-film project needs into <project>/vendor and <project>/_fonts.
# They are not stored in this repo: Three.js (MIT), GSAP (GreenSock standard license), Noto Sans SC (SIL OFL 1.1).
#   bash scripts/fetch-vendor.sh examples/guoqing-train-home
set -euo pipefail
DIR="${1:?usage: fetch-vendor.sh <project-dir>}"
THREE=0.160.0; GSAP=3.14.2
CDN=https://cdn.jsdelivr.net/npm
mkdir -p "$DIR/vendor/three/addons/"{objects,postprocessing,shaders,geometries} "$DIR/_fonts"
curl -fsSL "$CDN/gsap@$GSAP/dist/gsap.min.js" -o "$DIR/vendor/gsap.min.js"
curl -fsSL "$CDN/three@$THREE/build/three.module.js" -o "$DIR/vendor/three/three.module.js"
for f in objects/Water.js geometries/RoundedBoxGeometry.js \
         postprocessing/EffectComposer.js postprocessing/RenderPass.js postprocessing/UnrealBloomPass.js \
         postprocessing/OutputPass.js postprocessing/ShaderPass.js postprocessing/Pass.js postprocessing/MaskPass.js \
         shaders/CopyShader.js shaders/LuminosityHighPassShader.js shaders/OutputShader.js; do
  curl -fsSL "$CDN/three@$THREE/examples/jsm/$f" -o "$DIR/vendor/three/addons/$f"
done
curl -fsSL "https://github.com/google/fonts/raw/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf" -o "$DIR/_fonts/NotoSansSC-VF.ttf"
curl -fsSL "https://github.com/google/fonts/raw/main/ofl/notosanssc/OFL.txt" -o "$DIR/_fonts/OFL.txt"
echo "vendor files ready in $DIR"
