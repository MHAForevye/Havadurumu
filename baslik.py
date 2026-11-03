# README'deki basliklarin alt metnini okuyup docs/h-XX.svg resimlerini yeniden uretir
import re
from xml.sax.saxutils import escape, unescape

SIZES = {1: 40, 2: 28, 3: 22}
NARROW = set("il.,:;'|!Iı()[]/ ")
def width(t, fs):
    w = 0
    for c in t:
        w += 0.30 if c in NARROW else (0.72 if c.isupper() or c in 'mwMW' else 0.58)
    return int(w * fs) + 28

def svg(title, level):
    fs = SIZES[level]
    w, h = width(title, fs), int(fs * 1.55)
    t = escape(title)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="{t}">'
        f'<rect x="2" y="{int(h*0.22)}" width="{w-4}" height="{int(h*0.68)}" rx="5" fill="#fff200" opacity=".92" transform="rotate(-0.8 {w/2} {h/2})"/>'
        f'<rect x="8" y="{int(h*0.30)}" width="{w-16}" height="{int(h*0.12)}" rx="3" fill="#ffe600" opacity=".6" transform="rotate(-0.8 {w/2} {h/2})"/>'
        f'<text x="14" y="{int(h*0.72)}" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="{fs}" font-weight="700" fill="#1f2328">{t}</text>'
        f'</svg>')

L = open('README.md', encoding='utf-8').read().split('\n')
n = 0
for k, line in enumerate(L):
    m = re.match(r'^(#{1,3})\s+<img src="(docs/h-\d+\.svg)" alt="(.*)">\s*$', line)
    if not m:
        continue
    title = unescape(m.group(3)).strip()
    open(m.group(2), 'w', encoding='utf-8').write(svg(title, len(m.group(1))))
    L[k] = f'{m.group(1)} <img src="{m.group(2)}" alt="{title}">'
    n += 1
open('README.md', 'w', encoding='utf-8').write('\n'.join(L))
print(f'Tamam: {n} baslik resmi yenilendi.')
