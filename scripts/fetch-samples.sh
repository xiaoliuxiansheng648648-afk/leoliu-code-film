#!/usr/bin/env bash
# Download the recorded instruments scripts/sampler.py plays: a subset of VSCO 2 CE (Versilian Studios Chamber
# Orchestra 2 Community Edition, CC0, https://github.com/sgossner/VSCO-2-CE) — concert harp, glockenspiel,
# cello section (sustained, soft), tubular bells, gong. About 120 MB, downloaded once into
# $LEOLIU_SAMPLES/vsco2ce (default ~/.cache/leoliu-code-film/vsco2ce); files already there are skipped.
#   bash scripts/fetch-samples.sh
set -euo pipefail
DEST="${LEOLIU_SAMPLES:-$HOME/.cache/leoliu-code-film}/vsco2ce"
B=https://raw.githubusercontent.com/sgossner/VSCO-2-CE/master
mkdir -p "$DEST"/{harp,glock,perc,cello}
{
  for f in A2_mf A4_mf A6_mf B1_mf B3_mf B5_mf B6_mf C3_mf C5_mf D2_mf D4_mf D6_mf D7_f E1_f E3_mf E5_mf \
           F2_mf F4_mf F6_mf F7_f G1_mp G3_mf G5_mf; do
    echo "Strings/Harp/KSHarp_$f.wav harp/KSHarp_$f.wav"
  done
  for n in C5 C6 C7 G4 G5 G6; do echo "Percussion/Glock/glock_medium_$n.wav glock/glock_medium_$n.wav"; done
  for n in A2 B1 B3 C1 C3 D2 D4 E1 E3 F2 F4 G1 G3; do
    echo "Strings/Cello%20Section/susvib/susvib_${n}_v1_1.wav cello/susvib_${n}_v1_1.wav"
  done
  for f in TB_hit_C4_v4_rr1 TB_hit_C5_v4_rr1 TB_hit_F5_v3_rr1 TB_hit_G4_v4_rr1 gongHit_p gongHit_mf; do
    echo "Percussion/$f.wav perc/$f.wav"
  done
  echo "LICENSE LICENSE"
} | while read -r src dst; do
  [ -s "$DEST/$dst" ] || echo "$B/$src $DEST/$dst"
done | xargs -P 8 -n 2 sh -c 'curl -fsSL "$0" -o "$1" || { echo "failed: $0" >&2; exit 1; }'
echo "samples ready in $DEST ($(du -sh "$DEST" | cut -f1))"
