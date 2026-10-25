#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 public/project-details 下的 PNG 转成 WebP，并同步所有引用。

有损（q=90, method=6）压缩，若压缩率不理想则自动回退到无损模式，取更小的那个。
转换成功后才删除原 PNG（git 有历史，可恢复）。
"""
import os
import sys

from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "outputs", "chestnut-local", "public")
SRC_DIR = os.path.join(ROOT, "project-details")

QUALITY = 90


def convert_one(src):
    dst = os.path.splitext(src)[0] + ".webp"
    im = Image.open(src)
    has_alpha = im.mode in ("RGBA", "LA") or "transparency" in im.info

    # 有损
    im.convert("RGBA" if has_alpha else "RGB").save(
        dst, "WEBP", quality=QUALITY, method=6, exact=False)
    lossy = os.path.getsize(dst)

    # 压缩率不理想（> 原图 70%）时试无损，取更小者
    original = os.path.getsize(src)
    if lossy > original * 0.7:
        im.convert("RGBA" if has_alpha else "RGB").save(dst, "WEBP", lossless=True, method=6, exact=False)
        lossless = os.path.getsize(dst)
        if lossless > lossy:
            im.convert("RGBA" if has_alpha else "RGB").save(
                dst, "WEBP", quality=QUALITY, method=6, exact=False)
            return original, lossy, "lossy"
        return original, lossless, "lossless"
    return original, lossy, "lossy"


def main():
    files = []
    for dirpath, _dirs, names in os.walk(SRC_DIR):
        for n in names:
            if n.lower().endswith(".png"):
                files.append(os.path.join(dirpath, n))
    files.sort()

    before = after = 0
    modes = {"lossy": 0, "lossless": 0}
    for f in files:
        o, a, mode = convert_one(f)
        before += o
        after += a
        modes[mode] += 1
        rel = os.path.relpath(f, ROOT)
        print("  %-42s %7.2fMB -> %6.2fMB  (%s)" % (rel, o / 1048576, a / 1048576, mode))

    print("\n共 %d 张：%.1fMB -> %.1fMB（省 %.0f%%）"
          % (len(files), before / 1048576, after / 1048576, (1 - after / before) * 100))
    print("有损 %d 张 / 无损 %d 张" % (modes["lossy"], modes["lossless"]))


if __name__ == "__main__":
    main()
