"""Inline src/film.js into src/index.src.html → index.html (HyperFrames hoists external scripts above the body)."""
from pathlib import Path
here = Path(__file__).parent
html = (here / "src/index.src.html").read_text(encoding="utf-8")
js = (here / "src/film.js").read_text(encoding="utf-8")
out = html.replace('<script src="film.js"></script>', "<script>\n" + js + "\n</script>")
assert out != html, "film.js placeholder not found"
(here / "index.html").write_text(out, encoding="utf-8")
print("index.html built")
