# README basliklarini sari fosforlu isaretleyici gorunumune cevirir (docs/h-XX.svg) ve onemli ifadeleri <mark> ile vurgular
import os, re
from xml.sax.saxutils import escape

src = open('README.md', encoding='utf-8').read()
if 'docs/h-' in src:
    raise SystemExit('Zaten uygulanmis.')
os.makedirs('docs', exist_ok=True)

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

n = 0
out = []
for line in src.split('\n'):
    m = re.match(r'^(#{1,3})\s+(.*\S)\s*$', line)
    if m:
        n += 1
        lvl, title = len(m.group(1)), m.group(2)
        name = f'docs/h-{n:02d}.svg'
        open(name, 'w', encoding='utf-8').write(svg(title, lvl))
        out.append(f'{m.group(1)} <img src="{name}" alt="{title}">')
    else:
        if not line.startswith('|---') and not line.startswith('<'):
            line = re.sub(r'\*\*(.+?)\*\*', r'<mark>**\1**</mark>', line)
        out.append(line)
open('README.md', 'w', encoding='utf-8').write('\n'.join(out))
print(f'Tamam: {n} baslik isaretlendi, docs/ klasorune yazildi.')
