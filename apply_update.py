#!/usr/bin/env python3
"""Mikro-Klima güncellemesi. Repo kök klasöründe çalıştır:  python3 apply_update.py
- index.html'i yedekler (index.html.bak), CSS/JS'i ayrı dosyalara böler, yamaları uygular.
- Chart.js, Leaflet ve fontları npm kayıt defterinden indirip repoya koyar (CDN/Google Fonts kalkar).
Herhangi bir yama bulunamazsa HİÇBİR dosyayı değiştirmeden hata verir."""
import io, json, os, re, shutil, sys, tarfile, urllib.request

def die(m): sys.exit('HATA: ' + m)
def rep(s, old, new, n=1):
    c = s.count(old)
    if c != n: die(f'beklenen {n}, bulunan {c} adet:\n   {old[:90]!r}')
    return s.replace(old, new)
def rsub(s, pat, new, n=1, flags=0):
    s, c = re.subn(pat, new, s, flags=flags)
    if c != n: die(f'regex beklenen {n}, bulunan {c}: {pat[:80]}')
    return s

# ---------- 1) HTML yamaları ----------
HTML = [
 ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>', '', 1),
 ('<link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Bebas+Neue&family=Oswald:wght@300;400&display=swap" rel="stylesheet">',
  '<link rel="stylesheet" href="css/fonts.css"><link rel="stylesheet" href="css/style.css">', 1),
 ('<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>', '<script src="lib/chart.umd.min.js"></script>', 1),
 ('<div class="tabbar-inner">', '<div class="tabbar-inner" role="tablist">', 1),
 ('<div class="info-sheet" role="dialog" aria-modal="true">', '<div class="info-sheet" role="dialog" aria-modal="true" aria-labelledby="infoTitle">', 1),
 ('Uygulama birden fazla kaynaktan (Open-Meteo, MET Norway, wttr.in) tahmin alır ve Kaynaklar sekmesinde karşılaştırır.',
  'Uygulama birçok kaynaktan tahmin alır: Open-Meteo üzerinden 12 ayrı hava modeli (ECMWF, GFS, ICON, Météo-France vb.), ayrıca MET Norway ve wttr.in servisleri. Hepsini Kaynaklar sekmesinde karşılaştırır.', 2),
 ('Formülün ayrıntısı uygulamadaki Detay sekmesinde, skorun yanındaki bilgi penceresinde yer alır.',
  'Formülün ayrıntısı uygulamadaki Detay sekmesinde, skorun yanındaki bilgi penceresinde yer alır. Bu skor uygulamaya özgü sezgisel bir formüldür; bilimsel olarak doğrulanmış bir indeks ya da resmi uyarı değildir.', 2),
 ('<a class="studio-mail" href="mailto:mustafahakansunum@gmail.com">mustafahakansunum@gmail.com</a>',
  '<a class="studio-mail" id="studioMail" href="#" aria-label="E-posta gönder">E-postayı göster</a>', 1),
 ('<h2 class="card-title">Görünüm ve bildirim</h2>',
  '<h2 class="card-title">Görünüm ve bildirim</h2>\n        <p class="hint">Bildirimler uygulama ya da sayfa açıkken (arka planda olabilir) çalışır; tamamen kapalıyken gelmez.</p>', 1),
 ('Veri sadece bu tarayıcıda durur.</div>',
  'Veri sadece bu tarayıcıda durur; tarayıcı site verisini temizlerse silinir, bu yüzden arada "Dışa aktar" ile yedek al.</div>', 1),
 ('<button type="button" id="btnCredit">Forevye tarafından geliştirildi</button></div>',
  '<button type="button" id="btnCredit">Forevye tarafından geliştirildi</button><a href="gizlilik.html">Gizlilik politikası</a></div>', 1),
]
# ---------- 2) JS yamaları ----------
JS = [
 ('''const ico = n => '<svg viewBox="0 0 48 48"><g filter''', '''const ico = n => '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><g filter''', 1),
 ('''document.documentElement.style.fontSize = PREFS.fs + 'px';''', '''document.documentElement.style.fontSize = (PREFS.fs / 16 * 100) + '%';''', 1),
 ('''if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');''', '''b.setAttribute('aria-selected', on ? 'true' : 'false');''', 1),
 ('''function showInfo(t, h) { $('infoTitle').textContent = t; $('infoText').innerHTML = '<span class="hl">' + h + '</span>'; $('infoOverlay').classList.add('show'); }''',
  '''let infoOpener = null;
function showInfo(t, h) { infoOpener = document.activeElement; $('infoTitle').textContent = t; $('infoText').innerHTML = '<span class="hl">' + h + '</span>'; $('infoOverlay').classList.add('show'); $('infoClose').focus(); }
function closeInfo() { $('infoOverlay').classList.remove('show'); try { if (infoOpener && infoOpener.focus) infoOpener.focus(); } catch (e) {} infoOpener = null; }
document.addEventListener('keydown', e => { if (!$('infoOverlay').classList.contains('show')) return; if (e.key === 'Escape') closeInfo(); else if (e.key === 'Tab') { e.preventDefault(); $('infoClose').focus(); } });''', 1),
 ('''$('infoClose').addEventListener('click', () => $('infoOverlay').classList.remove('show'));''', '''$('infoClose').addEventListener('click', closeInfo);''', 1),
 ('''if (e.target === e.currentTarget) e.currentTarget.classList.remove('show'); });''', '''if (e.target === e.currentTarget) closeInfo(); });''', 1),
 ("'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css'", "'lib/leaflet.css'", 1),
 ("'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js'", "'lib/leaflet.js'", 1),
 ("değerler kaynakların medyanıdır.'));", "değerler kaynakların medyanıdır.<br><br><b>Not:</b> Bu skor uygulamaya özgü sezgisel bir formüldür; bilimsel olarak doğrulanmış bir indeks ya da resmi uyarı değildir.'));", 1),
 ('1 kg/m² = 1 mm yağış (su eşdeğeri).', 'Yağış miktarı milimetre (mm) cinsindendir; 1 mm = metrekareye 1 litre su (su eşdeğeri).', 1),
 ('1 kg/m² = 1 mm.', '1 mm = metrekareye 1 litre su.', 1),
 ('\npaintIcons();\npaintNotif();', '''
(function () { var m = $('studioMail'); if (!m) return; var a = ['mustafahakansunum', 'gmail.com'].join('@'); m.href = 'mailto:' + a; m.textContent = a; })();
paintIcons();
paintNotif();''', 1),
]
CSS_REP = [('html { font-size: 17px; }', 'html { font-size: 106.25%; }', 1)]
CSS_ADD = '\n.credit-line a { display:inline-block; color:var(--subtext); font-size:.95rem; padding:12px 14px; min-height:46px; }\n'

def drop_dead(css):
    dead = re.compile(r'\.(header|controls-bar|main-grid|location-toggle-btn|accordion-header|accordion-content|arr)\b')
    def f(m):
        parts = m.group(1).split(',')
        keep = [p for p in parts if not dead.search(p)]
        if len(keep) == len(parts): return m.group(0)
        return ','.join(keep) + '{' + m.group(2) + '}' if keep else ''
    css = re.sub(r'([^{}@][^{}]*)\{([^{}]*)\}', f, css)
    return re.sub(r'@media[^{]*\{\s*\}', '', css)

def transform(s):
    s = s.replace('\r\n', '\n')
    for o, n, c in HTML: s = rep(s, o, n, c)
    s = rsub(s, r'<button type="button" class="tab( active)?" id="tab-(\w+)"( aria-current="page")? onclick',
             lambda m: f'<button type="button" class="tab{m.group(1) or ""}" id="tab-{m.group(2)}" role="tab" aria-selected="{"true" if m.group(1) else "false"}" aria-controls="panel-{m.group(2)}" onclick', 4)
    s = rsub(s, r'<section class="panel( active)?" id="panel-(\w+)" aria-label="[^"]*">',
             lambda m: f'<section class="panel{m.group(1) or ""}" id="panel-{m.group(2)}" role="tabpanel" aria-labelledby="tab-{m.group(2)}">', 4)
    s = rsub(s, r"window\.dataLayer = window\.dataLayer \|\| \[\];\s*function gtag\(\)\{dataLayer\.push\(arguments\);\}\s*gtag\('js'", "gtag('js'")
    # Gizli özellikler kartını Ayarlar sekmesine taşı
    a = s.find('<h3 class="studio-sec">Gizli özellikler</h3>'); b = s.find('<h3 class="studio-sec">İletişim</h3>')
    if a < 0 or b < a: die('"Gizli özellikler" bölümü bulunamadı')
    card = s[a:b].split('</h3>', 1)[1].strip()
    card = rep(card, '<div class="card studio-card">', '<div class="card"><h2 class="card-title">Tercihler ve yedek</h2>')
    s = s[:a] + s[b:]
    s = rsub(s, r'<div class="card wide">\s*<h2 class="card-title">Hakkında</h2>', lambda m: card + '\n\n      ' + m.group(0))
    # CSS / JS ayır
    css = '\n'.join(re.findall(r'<style>(.*?)</style>', s, re.S))
    if not css: die('<style> bulunamadı')
    s = re.sub(r'\s*<style>.*?</style>', '', s, flags=re.S)
    m = re.search(r'<script>\s*/\* ===== Çocuksu', s)
    if not m: die('ana <script> bulunamadı')
    e = s.index('</script>', m.start())
    js = s[m.start() + len('<script>'):e].strip('\n')
    s = s[:m.start()] + '<script src="js/app.js"></script>' + s[e + len('</script>'):]
    for o, n, c in JS: js = rep(js, o, n, c)
    js = js.replace('kg/m²', 'mm')
    js = rep(js, "fmt(h.pw, 0, ' mm')", "fmt(h.pw, 0, ' kg/m²')")
    js = rep(js, "su buharı (mm).", "su buharı (kg/m²).")
    s = s.replace('kg/m²', 'mm')
    for o, n, c in CSS_REP: css = rep(css, o, n, c)
    css = drop_dead(css) + CSS_ADD
    return s, css, js

# ---------- 3) Kütüphane ve fontlar ----------
RANGES = {'latin': 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
          'latin-ext': 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'}
def npm(pkg, ver='latest'):
    m = json.load(urllib.request.urlopen(f'https://registry.npmjs.org/{pkg}/{ver}', timeout=60))
    return tarfile.open(fileobj=io.BytesIO(urllib.request.urlopen(m['dist']['tarball'], timeout=120).read()))
def fetch_assets():
    for d in ('css', 'js', 'lib', 'fonts'): os.makedirs(d, exist_ok=True)
    tf = npm('chart.js', '4.4.1'); open('lib/chart.umd.min.js', 'wb').write(tf.extractfile('package/dist/chart.umd.js').read())
    tf = npm('leaflet', '1.9.4')
    for n in ('leaflet.js', 'leaflet.css'): open('lib/' + n, 'wb').write(tf.extractfile('package/dist/' + n).read())
    out = []
    for pkg, ws in (('patrick-hand', (400,)), ('bebas-neue', (400,)), ('oswald', (300, 400))):
        tf = npm('@fontsource/' + pkg)
        for w in ws:
            for sub in ('latin', 'latin-ext'):
                css = tf.extractfile(f'package/{sub}-{w}.css').read().decode()
                css = re.sub(r",\s*url\([^)]*\.woff\)\s*format\('woff'\)", '', css)
                css = css.replace('url(./files/', 'url(../fonts/')
                css = re.sub(r'(font-weight:\s*\d+;)', r'\1\n  unicode-range: ' + RANGES[sub] + ';', css)
                out.append(css)
                fn = f'{pkg}-{sub}-{w}-normal.woff2'
                open('fonts/' + fn, 'wb').write(tf.extractfile('package/files/' + fn).read())
    open('css/fonts.css', 'w', encoding='utf-8').write('\n'.join(out))

if __name__ == '__main__':
    if not os.path.exists('index.html'): die('index.html bulunamadı; betiği repo kök klasöründe çalıştır.')
    src = open('index.html', encoding='utf-8', newline='').read()
    html, css, js = transform(src)          # hata olursa burada durur, hiçbir şey yazılmaz
    print('Yamalar uygulanabildi, indirmeler başlıyor…')
    fetch_assets()
    shutil.copy('index.html', 'index.html.bak')
    open('css/style.css', 'w', encoding='utf-8').write(css)
    open('js/app.js', 'w', encoding='utf-8').write(js)
    open('index.html', 'w', encoding='utf-8').write(html)
    print('Tamam. index.html (%d KB), css/style.css (%d KB), js/app.js (%d KB). Yedek: index.html.bak' % (len(html) // 1024, len(css) // 1024, len(js) // 1024))
