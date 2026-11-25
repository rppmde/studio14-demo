#!/usr/bin/env python3
"""Prepare only public static site files for Cloudflare (Python standard library)."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[1]
out = root / "dist"
if out.exists():
    shutil.rmtree(out)
out.mkdir()
for name in ("assets", "css", "js", "en", "ru", "hy"):
    shutil.copytree(root / name, out / name, ignore=shutil.ignore_patterns(".DS_Store", "guest-carousel.js"))
# The archive was removed from every guest page; don't ship its image files.
shutil.rmtree(out / "assets" / "guests", ignore_errors=True)
for name in ("index.html", "robots.txt", "_headers"):
    shutil.copy2(root / name, out / name)
assert len(list(out.glob("*/*.html"))) == 33, "Expected 33 localized pages"
print("Cloudflare static assets prepared in dist/")
