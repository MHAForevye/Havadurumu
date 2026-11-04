/* Kristal ödül sistemi: günlük giriş + Mağaza (Astrophoto Cam aktivasyon talebi) + hediye kodu.
   Sunucu yok: her şey bu cihazda, localStorage'da durur. Kod talebi mail ile yapılır.
   Fiyatları, günlük ödülü ya da mail adresini değiştirmek için sadece aşağıdaki CFG bloğunu düzenle. */
(function () {
  'use strict';

  var CFG = {
    daily: 30,                                   // günlük giriş ödülü (kristal)
    packs: [
      { name: '3 Günlük Paket',            short: '3 günlük', cost: 500 },
      { name: '7 Günlük Paket (Haftalık)', short: '7 günlük', cost: 1000 }
    ],
    mail: ['mustafahakansunum', 'gmail.com'],    // app.js'teki gibi parçalı yazılır (botlar toplamasın)
    app: 'Astrophoto Cam',
    key: 'mk_kristal',
    owner: 'llbha0uxr6'                          // gizli kelimenin özeti (kelimenin kendisi kodda yazmaz)
  };

  var $ = function (id) { return document.getElementById(id); };
  var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
  var S;

  /* ===== Yardımcılar ===== */
  function today() { var d = new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
  function stamp() { var d = new Date(); return today() + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()); }
  function rnd(n) {
    var a = new Uint8Array(n);
    try { crypto.getRandomValues(a); } catch (e) { for (var i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256); }
    return a;
  }
  function newId() { var a = rnd(4); return String(10000000 + ((a[0] * 16777216 + a[1] * 65536 + a[2] * 256 + a[3]) % 90000000)); }
  function newReqNo() {
    var s = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', a = rnd(6), r = '';
    for (var i = 0; i < 6; i++) r += s.charAt(a[i] % s.length);
    return r;
  }

  /* ===== Durum (okuma / yazma / temizleme) ===== */
  function clean(o) {
    var n = function (v) { v = Math.floor(Number(v)); return isFinite(v) && v >= 0 && v < 1e9 ? v : 0; };
    var dt = function (v) { return /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? String(v) : ''; };
    var s = { id: '', bal: 0, earned: 0, gift: 0, spent: 0, days: 0, first: '', last: '', cam: '', reqs: [], pending: '', used: [], codes: [], made: [], v: 0, sig: '' };
    if (o && typeof o === 'object') {
      s.id = /^\d{8}$/.test(String(o.id)) ? String(o.id) : '';
      s.bal = n(o.bal); s.earned = n(o.earned); s.gift = n(o.gift); s.spent = n(o.spent); s.days = n(o.days);
      s.first = dt(o.first); s.last = dt(o.last);
      s.cam = String(o.cam || '').slice(0, 60);
      if (Array.isArray(o.reqs)) {
        s.reqs = o.reqs.filter(function (r) { return r && typeof r === 'object' && r.no; }).slice(-20).map(function (r) {
          return { no: String(r.no).slice(0, 12), pack: String(r.pack || '').slice(0, 40), cost: n(r.cost), t: String(r.t || '').slice(0, 16), cam: String(r.cam || '').slice(0, 60) };
        });
      }
      s.pending = String(o.pending || '').slice(0, 12);
      s.v = n(o.v); s.sig = String(o.sig || '').replace(/[^a-z0-9]/g, '').slice(0, 16);
      if (Array.isArray(o.used)) s.used = o.used.map(function (c) { return String(c).slice(0, 16); }).filter(function (c) { return /^[A-Z2-9]{13}$/.test(c); }).slice(-300);
      if (Array.isArray(o.codes)) {
        s.codes = o.codes.filter(function (r) { return r && typeof r === 'object' && /^[A-Z2-9]{13}$/.test(String(r.c)); }).slice(-30).map(function (r) {
          return { c: String(r.c), n: n(r.n), t: String(r.t || '').slice(0, 16) };
        });
      }
      if (Array.isArray(o.made)) {
        s.made = o.made.filter(function (r) { return r && typeof r === 'object' && /^[A-Z2-9]{13}$/.test(String(r.c)); }).slice(-20).map(function (r) {
          return { to: /^\d{8}$/.test(String(r.to)) ? String(r.to) : '', n: n(r.n), c: String(r.c), t: String(r.t || '').slice(0, 16) };
        });
      }
    }
    return s;
  }
  /* Kayıt imzası: bakiye/hediye/harcama/kodlar değişirse imza tutmaz. Kaynak kodu okuyan biri yine taklit edebilir
     (sunucu yok), ama F12'de sayıyı değiştirmek artık kristali sıfırlar. */
  function sign(s) {
    return h53('st|' + [s.id, s.days, s.earned, s.gift, s.spent, s.bal, s.first, s.last, s.codes.map(function (c) { return c.c + ':' + c.n; }).join(',')].join('|') + '|' + CFG.owner);
  }
  function valid(s) { return (s.v < 2 || s.sig === sign(s)) && s.earned + s.gift === s.spent + s.bal; }
  var tampered = false;
  function load() {
    var s;
    try { s = clean(JSON.parse(localStorage.getItem(CFG.key))); } catch (e) { return clean(null); }
    if (!valid(s)) {                // değiştirilmiş kayıt: kristaller sıfırlanır, kullanılmış kodlar kalır (tekrar kullanılamasın)
      tampered = true;
      s.bal = s.earned = s.gift = s.spent = s.days = 0; s.codes = []; s.pending = ''; s.last = ''; s.first = '';
    }
    return s;
  }
  function save() { try { S.v = 2; S.sig = sign(S); localStorage.setItem(CFG.key, JSON.stringify(S)); } catch (e) {} }

  /* ===== Günlük giriş ödülü ===== */
  function daily() {
    var t = today();
    if (S.last && t <= S.last) return 0;         // aynı gün ya da saat geri alınmış: ödül yok
    S.bal += CFG.daily; S.earned += CFG.daily; S.days++; S.last = t;
    if (!S.first) S.first = t;
    save();
    return CFG.daily;
  }

  /* ===== Gizli hediye bölümü (sadece sana özel) =====
     Astrophoto Cam ID kutusuna gizli kelimeyi yazınca açılır; kelime kutudan hemen silinir. */
  function h53n(str) {
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
  function h53(str) { return h53n(str).toString(36); }
  function isOwnerWord(v) { return h53('mk|' + String(v).trim().toLocaleLowerCase('tr').replace(/\u0131/g, 'i')) === CFG.owner; }   // HEDIYE / Hediye / hediye hepsi olur
  /* ===== Hediye kodu (ID'ye ve miktara bağlı, tek kullanımlık) =====
     Kod = 4 karakter rastgele (nonce) + 4 karakter miktar + 5 karakter imza. İmza; ID, miktar ve nonce'dan çıkar.
     Başka ID'de ya da değiştirilmiş miktarla tutmaz. Kullanılan kodlar alıcının cihazında kayıtlı kalır, ikinci kez kabul edilmez. */
  var AB = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // 0/O ve 1/I karışmasın diye çıkarıldı
  function enc(v, len) { var s = ''; for (var i = 0; i < len; i++) { s = AB.charAt(v % 32) + s; v = Math.floor(v / 32); } return s; }
  function dec(s) { var v = 0; for (var i = 0; i < s.length; i++) { var k = AB.indexOf(s.charAt(i)); if (k < 0) return -1; v = v * 32 + k; } return v; }
  function makeCode(id, n, nonce) { return nonce + enc(n, 4) + enc(h53n('gift|' + id + '|' + n + '|' + nonce + '|' + CFG.owner) % 33554432, 5); }
  function normCode(v) { return String(v).toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function fmtCode(c) { return c.slice(0, 4) + '-' + c.slice(4, 8) + '-' + c.slice(8); }
  function giftMake() {
    var to = String($('kGiftTo').value).replace(/\D/g, '');
    if (!/^\d{8}$/.test(to)) return toast("Arkadaşının Site ID'si 8 haneli bir sayı olmalı.");
    var n = Math.floor(Number(String($('kGiftAmt').value).replace(/\s/g, '').replace(',', '.')));
    if (!isFinite(n) || n < 1 || n > 100000) return toast('1 ile 100000 arasında bir sayı yaz.');
    var a = rnd(4), nonce = '';
    for (var i = 0; i < 4; i++) nonce += AB.charAt(a[i] % 32);
    var c = makeCode(to, n, nonce);
    S.made.push({ to: to, n: n, c: c, t: stamp() }); S.made = S.made.slice(-20); save(); render();
    $('kGiftOut').textContent = fmtCode(c);
    copy(fmtCode(c), 'Kod üretildi ve kopyalandı: ' + fmtCode(c) + ' (' + n + ' kristal, ID ' + to + ')');
  }
  function giftRedeem() {
    var c = normCode($('kCode').value);
    if (c.length !== 13) return toast('Kod XXXX-XXXX-XXXXX biçiminde (13 harf/rakam).');
    var n = dec(c.slice(4, 8));
    if (n < 1 || n > 100000 || makeCode(S.id, n, c.slice(0, 4)) !== c) return toast("Kod geçersiz ya da bu ID'ye ait değil.");
    if (S.used.indexOf(c) >= 0) return toast('Bu kod daha önce kullanılmış.');
    S.used.push(c); S.used = S.used.slice(-300);
    S.codes.push({ c: c, n: n, t: stamp() }); S.codes = S.codes.slice(-30);
    S.bal += n; S.gift += n; save(); render();
    $('kCode').value = '';
    toast('+' + n + ' kristal hediye edildi! Bakiye: ' + S.bal);
  }
  /* ===== Mail doğrulama kodu =====
     Maile kodlanmış + imzalı bir satır eklenir: MK1.<veri>.<imza>. Gizli bölümde maili yapıştırınca imza, ID, hediye kodları
     ve toplamlar kontrol edilir. Maildeki düz yazı değiştirilse bile imzalı veri değişmez. */
  function b64e(s) { return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64d(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return atob(s); }
  function proof(r) {
    var P = [S.id, S.days, S.earned, S.gift, S.spent, S.bal, r.no, r.cost, S.codes.map(function (c) { return c.c; }).join(',')].join('|');
    return 'MK1.' + b64e(P) + '.' + h53('sig|' + P + '|' + CFG.owner);
  }
  function verifyMail(text) {
    var m = /MK1\.([A-Za-z0-9_-]+)\.([a-z0-9]+)/.exec(String(text)), bad = [], info = [], P;
    if (!m) return 'ŞÜPHELİ: Doğrulama satırı (MK1...) bulunamadı. Silinmiş ya da elle yazılmış olabilir.';
    try { P = b64d(m[1]); } catch (e) { return 'ŞÜPHELİ: Doğrulama satırı bozuk.'; }
    if (h53('sig|' + P + '|' + CFG.owner) !== m[2]) return 'ŞÜPHELİ: İmza geçersiz. Veriler değiştirilmiş.';
    var a = P.split('|'), id = a[0], days = +a[1], earned = +a[2], gift = +a[3], spent = +a[4], bal = +a[5], no = a[6], cost = +a[7];
    var codes = a[8] ? a[8].split(',') : [], sum = 0, seen = {};
    info.push('ID ' + id + ' · talep #' + no + ' · ' + cost + ' kristal');
    info.push('Giriş günü ' + days + ', giriş ödülü ' + earned + ', hediye ' + gift + ', harcanan ' + spent + ', kalan ' + bal);
    if (earned + gift !== spent + bal) bad.push('Denklem tutmuyor: giriş ödülü + hediye ≠ harcanan + kalan');
    if (earned > days * CFG.daily) bad.push('Giriş ödülü (' + earned + ') gün sayısına göre en fazla ' + days * CFG.daily + ' olabilir');
    codes.forEach(function (c) {
      var n = dec(c.slice(4, 8)), mine = S.made.some(function (r) { return r.c === c && r.to === id; });
      if (c.length !== 13 || n < 1 || makeCode(id, n, c.slice(0, 4)) !== c) { bad.push('Geçersiz hediye kodu: ' + c); return; }
      if (seen[c]) { bad.push('Aynı kod iki kez: ' + fmtCode(c)); return; }
      seen[c] = 1; sum += n;
      info.push('Kod ' + fmtCode(c) + ' = ' + n + (mine ? ' (senin ürettiğin)' : ' (BU CİHAZDA ÜRETİLMEMİŞ)'));
      if (!mine) bad.push('Bu cihazda üretilmemiş kod: ' + fmtCode(c));
    });
    if (gift !== sum) bad.push('Hediye ' + gift + ' ama kodların toplamı ' + sum + ' (açıklanamayan: ' + (gift - sum) + ')');
    var pl = /giriş ödülü (\d+), hediye (\d+), harcanan (\d+), kalan (\d+)/.exec(text);
    if (pl && (+pl[1] !== earned || +pl[2] !== gift || +pl[3] !== spent || +pl[4] !== bal)) bad.push('Maildeki düz yazı satırı imzalı veriyle uyuşmuyor');
    var pid = /ID'm: (\d{8})/.exec(text); if (pid && pid[1] !== id) bad.push("Maildeki ID (" + pid[1] + ") imzalı ID ile farklı");
    return (bad.length ? 'ŞÜPHELİ:\n- ' + bad.join('\n- ') : 'TEMİZ: imza geçerli, sayılar tutarlı.') + '\n\n' + info.join('\n');
  }
  function giftAdd() {
    var n = Math.floor(Number(String($('kGiftAmt').value).replace(/\s/g, '').replace(',', '.')));
    if (!isFinite(n) || n < 1 || n > 100000) return toast('1 ile 100000 arasında bir sayı yaz.');
    S.bal += n; S.gift += n; save(); render();
    toast('+' + n + ' kristal eklendi. Bakiye: ' + S.bal);
  }

  /* ===== Küçük bildirim ===== */
  var toastEl, toastT;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'k-toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 3800);
  }
  function copy(txt, okMsg) {
    var done = function () { toast(okMsg); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { prompt('Elle kopyala:', txt); });
    else prompt('Elle kopyala:', txt);
  }

  /* ===== Mail ===== */
  function mailAddr() { return CFG.mail.join('@'); }
  function mailSubject(r) { return 'Aktivasyon Kodu Talebi - ' + CFG.app + ' (' + r.pack + ') #' + r.no; }
  function mailBody(r) {
    return [
      'Merhaba,', '',
      "Hava durumu sitemdeki ID'm: " + S.id,
      'Mağazadan ' + r.cost + ' kristal harcayarak ' + r.pack + ' ' + CFG.app + ' aktivasyon hakkı aldım.',
      CFG.app + " ID'm: " + r.cam, '',
      'Talep no: ' + r.no,
      'Talep zamanı: ' + r.t,
      'Giriş günü: ' + S.days + ' (giriş ödülü ' + S.earned + ', hediye ' + S.gift + ', harcanan ' + S.spent + ', kalan ' + S.bal + ')',
      'Hediye kodları: ' + (S.codes.length ? S.codes.map(function (g) { return g.n + ' [' + fmtCode(g.c) + ', ' + g.t.slice(0, 10) + ']'; }).join('; ') : 'yok'),
      'Doğrulama (silme/değiştirme): ' + proof(r), '',
      'Doğrulayıp aktivasyon kodumu gönderebilir misiniz? Gerekirse ekran görüntüsünü bu maile ekleyeceğim.'
    ].join('\r\n');
  }
  var isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
  function openMail(r) {
    if (!isMobile) return openGmail(r);       // bilgisayarda mailto çoğu zaman sessizce hiçbir şey yapmaz
    location.href = 'mailto:' + mailAddr() + '?subject=' + encodeURIComponent(mailSubject(r)) + '&body=' + encodeURIComponent(mailBody(r));
  }
  function openGmail(r) {   // bilgisayarda mailto çalışmazsa: Gmail yazma ekranı doğrudan yeni sekmede açılır
    var u = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(mailAddr()) + '&su=' + encodeURIComponent(mailSubject(r)) + '&body=' + encodeURIComponent(mailBody(r).replace(/\r\n/g, '\n'));
    if (!window.open(u, '_blank', 'noopener')) location.href = u;
  }
  function pendingReq() { for (var i = 0; i < S.reqs.length; i++) if (S.reqs[i].no === S.pending) return S.reqs[i]; return null; }

  /* ===== Satın alma ===== */
  function buy(i) {
    var pk = CFG.packs[i]; if (!pk) return;
    var cam = $('kCamId').value.trim();
    S.cam = cam.slice(0, 60); save();
    if (S.bal < pk.cost) { render(); return toast('Yetersiz kristal! Günlük giriş yaparak kristal biriktirmeye devam et.'); }
    if (cam.length < 3) { $('kCamId').focus(); return toast("Önce " + CFG.app + " ID'ni yaz."); }
    if (!confirm(pk.name + ' için ' + pk.cost + " kristal harcanacak ve mail taslağı açılacak. Devam edilsin mi?")) return;
    S.bal -= pk.cost; S.spent += pk.cost;
    var r = { no: newReqNo(), pack: pk.short, cost: pk.cost, t: stamp(), cam: S.cam };
    S.reqs.push(r); S.reqs = S.reqs.slice(-20); S.pending = r.no;
    save(); render(); openMail(r);
  }

  /* ===== Ekran ===== */
  function render() {
    if (!$('storePage')) return;
    $('kBal').textContent = S.bal;
    $('kId').textContent = S.id;
    if (document.activeElement !== $('kCamId')) $('kCamId').value = S.cam;
    $('kToday').textContent = (S.last === today() ? 'Bugünkü giriş ödülün alındı (+' + CFG.daily + '). ' : '') + 'Toplam giriş günü: ' + S.days + '.' + (S.gift ? ' Hediye kristal: ' + S.gift + '.' : '');

    var box = $('kPacks'); box.textContent = '';
    CFG.packs.forEach(function (pk, i) {
      var ok = S.bal >= pk.cost;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'setting-btn k-pack' + (ok ? '' : ' k-off');
      b.setAttribute('aria-disabled', ok ? 'false' : 'true');
      var ic = document.createElement('span'); ic.className = 'ico'; ic.dataset.ico = 'gem'; ic.style.setProperty('--s', '22px');
      var tx = document.createElement('span'); tx.className = 'k-pack-tx';
      tx.appendChild(document.createTextNode(pk.name));
      var sm = document.createElement('small');
      sm.textContent = ok ? 'Paketi Al' : 'Yetersiz kristal · yaklaşık ' + Math.ceil((pk.cost - S.bal) / CFG.daily) + ' gün daha';
      tx.appendChild(sm);
      var st = document.createElement('span'); st.className = 'state'; st.textContent = pk.cost + ' kristal';
      b.appendChild(ic); b.appendChild(tx); b.appendChild(st);
      b.addEventListener('click', function () { buy(i); });
      box.appendChild(b);
    });
    $('kLow').hidden = S.bal >= Math.min.apply(null, CFG.packs.map(function (p) { return p.cost; }));

    var pr = pendingReq(), pb = $('kPending');
    pb.hidden = !pr;
    if (pr) $('kPendingTx').textContent = 'Bekleyen talep: ' + pr.pack + ' · Talep no ' + pr.no + '. Alıcı: ' + mailAddr() + '. Mail açılmadıysa aşağıdaki düğmeleri kullan; kristalin zaten düşüldü.';

    var h = $('kHist'); h.textContent = '';
    $('kHistWrap').style.display = S.reqs.length ? '' : 'none';
    if (S.reqs.length) {
      S.reqs.slice(-5).reverse().forEach(function (r) {
        var d = document.createElement('div'); d.textContent = r.t + ' · ' + r.pack + ' · ' + r.cost + ' kristal · #' + r.no; h.appendChild(d);
      });
    }
    var m = $('kMade'); m.textContent = '';
    S.made.slice(-5).reverse().forEach(function (r) {
      var d = document.createElement('div'); d.textContent = r.t + ' · ID ' + r.to + ' · ' + r.n + ' kristal · ' + fmtCode(r.c); m.appendChild(d);
    });
    if (typeof paintIcons === 'function') paintIcons();
  }

  /* ===== Mağaza sayfası (Forevye sayfası gibi tam ekran açılır) ===== */
  function openStore() {
    var p = $('storePage'); render();
    p.classList.add('show'); p.scrollTop = 0; document.body.style.overflow = 'hidden'; $('storeBack').focus();
  }
  function closeStore() {
    $('storePage').classList.remove('show'); document.body.style.overflow = ''; $('kOwner').hidden = true;
    var b = $('btnStore'); if (b) b.focus();
  }

  /* ===== Bağlantılar ===== */
  function init() {
    if (typeof ICONS !== 'undefined') {
      ICONS.gem =
        '<path d="M14 6h20l10 12-20 26L4 18z" fill="#7dd3fc"/>' +
        '<path d="M14 6h20l10 12H4z" fill="#e0f2fe" stroke-width="2.4"/>' +
        '<path d="M19 6l-3 12M29 6l3 12" fill="none" stroke-width="2.2"/>' +
        '<path d="M10 14l2-3" fill="none" stroke="#fff" stroke-width="3"/>' +
        '<circle cx="15" cy="28" r="2.4" fill="#f9a8d4" stroke="none"/><circle cx="33" cy="28" r="2.4" fill="#f9a8d4" stroke="none"/>' +
        '<circle cx="19.5" cy="25" r="1.9" fill="#4a3426" stroke="none"/><circle cx="28.5" cy="25" r="1.9" fill="#4a3426" stroke="none"/>' +
        '<path d="M21 30q3 3.2 6 0" fill="none" stroke-width="2.4"/>' +
        '<path d="M43 2.5v7M39.5 6h7" fill="none" stroke="#fde047" stroke-width="3"/>';
      if (typeof BG !== 'undefined') BG.gem = '#7dd3fc';
    }
    S = load();
    if (!S.id) { S.id = newId(); save(); }
    if (tampered) { save(); setTimeout(function () { toast('Kayıt değiştirilmiş görünüyor, kristaller sıfırlandı.'); }, 600); }
    daily();                       // ödül sessizce işlenir; sadece Mağaza sayfasında görünür
    render();

    if (!$('storePage')) return;
    $('btnStore').addEventListener('click', openStore);
    $('storeBack').addEventListener('click', closeStore);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('storePage').classList.contains('show')) closeStore(); });
    $('kCamId').addEventListener('input', function () {
      if (!isOwnerWord(this.value)) return;
      this.value = ''; S.cam = ''; save();
      $('kOwner').hidden = false;
      $('kOwner').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    $('kGiftAdd').addEventListener('click', giftAdd);
    $('kGiftMake').addEventListener('click', giftMake);
    $('kVerBtn').addEventListener('click', function () { $('kVerOut').textContent = verifyMail($('kVerIn').value); });
    $('kCodeUse').addEventListener('click', giftRedeem);
    $('kCode').addEventListener('keydown', function (e) { if (e.key === 'Enter') giftRedeem(); });
    $('kGiftClose').addEventListener('click', function () { $('kOwner').hidden = true; });
    $('kCamId').addEventListener('change', function () { S.cam = this.value.trim().slice(0, 60); save(); });
    $('kCopyId').addEventListener('click', function () { copy(S.id, 'ID kopyalandı: ' + S.id); });
    $('kMailAgain').addEventListener('click', function () { var r = pendingReq(); if (r) openMail(r); });
    $('kMailGmail').addEventListener('click', function () { var r = pendingReq(); if (r) openGmail(r); });
    $('kMailCopy').addEventListener('click', function () {
      var r = pendingReq(); if (!r) return;
      copy('Alıcı: ' + mailAddr() + '\nKonu: ' + mailSubject(r) + '\n\n' + mailBody(r).replace(/\r\n/g, '\n'), 'Mail metni kopyalandı.');
    });
    $('kMailDone').addEventListener('click', function () { S.pending = ''; save(); render(); });
    document.addEventListener('visibilitychange', function () {   // sekme gün değişiminden sonra açılırsa ödül ver
      if (document.visibilityState !== 'visible') return;
      daily(); render();
    });
  }

  /* Yedek / geri yükleme (app.js bunu çağırır) */
  window.MKKristal = {
    exportData: function () { return JSON.parse(JSON.stringify(S)); },
    importData: function (o) { var c = clean(o); if (!c.id || !valid(c)) return false; S = c; daily(); save(); render(); return true; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
