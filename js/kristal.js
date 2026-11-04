/* Kristal ödül sistemi: günlük giriş + Mağaza (Astrophoto Cam aktivasyon talebi).
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
    key: 'mk_kristal'
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
    var s = { id: '', bal: 0, earned: 0, spent: 0, days: 0, first: '', last: '', cam: '', reqs: [], pending: '' };
    if (o && typeof o === 'object') {
      s.id = /^\d{8}$/.test(String(o.id)) ? String(o.id) : '';
      s.bal = n(o.bal); s.earned = n(o.earned); s.spent = n(o.spent); s.days = n(o.days);
      s.first = dt(o.first); s.last = dt(o.last);
      s.cam = String(o.cam || '').slice(0, 60);
      if (Array.isArray(o.reqs)) {
        s.reqs = o.reqs.filter(function (r) { return r && typeof r === 'object' && r.no; }).slice(-20).map(function (r) {
          return { no: String(r.no).slice(0, 12), pack: String(r.pack || '').slice(0, 40), cost: n(r.cost), t: String(r.t || '').slice(0, 16), cam: String(r.cam || '').slice(0, 60) };
        });
      }
      s.pending = String(o.pending || '').slice(0, 12);
    }
    return s;
  }
  function load() { try { return clean(JSON.parse(localStorage.getItem(CFG.key))); } catch (e) { return clean(null); } }
  function save() { try { localStorage.setItem(CFG.key, JSON.stringify(S)); } catch (e) {} }

  /* ===== Günlük giriş ödülü ===== */
  function daily() {
    var t = today();
    if (S.last && t <= S.last) return 0;         // aynı gün ya da saat geri alınmış: ödül yok
    S.bal += CFG.daily; S.earned += CFG.daily; S.days++; S.last = t;
    if (!S.first) S.first = t;
    save();
    return CFG.daily;
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
      'Giriş günü: ' + S.days + ' (kazanılan ' + S.earned + ', harcanan ' + S.spent + ', kalan ' + S.bal + ')', '',
      'Doğrulayıp aktivasyon kodumu gönderebilir misiniz? Gerekirse ekran görüntüsünü bu maile ekleyeceğim.'
    ].join('\r\n');
  }
  function openMail(r) {
    location.href = 'mailto:' + mailAddr() + '?subject=' + encodeURIComponent(mailSubject(r)) + '&body=' + encodeURIComponent(mailBody(r));
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
    $('kToday').textContent = (S.last === today() ? 'Bugünkü giriş ödülün alındı (+' + CFG.daily + '). ' : '') + 'Toplam giriş günü: ' + S.days + '.';

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
    if (pr) $('kPendingTx').textContent = 'Bekleyen talep: ' + pr.pack + ' · Talep no ' + pr.no + '. Mail taslağı açılmadıysa aşağıdaki düğmeleri kullan; kristalin zaten düşüldü.';

    var h = $('kHist'); h.textContent = '';
    $('kHistWrap').style.display = S.reqs.length ? '' : 'none';
    if (S.reqs.length) {
      S.reqs.slice(-5).reverse().forEach(function (r) {
        var d = document.createElement('div'); d.textContent = r.t + ' · ' + r.pack + ' · ' + r.cost + ' kristal · #' + r.no; h.appendChild(d);
      });
    }
    if (typeof paintIcons === 'function') paintIcons();
  }

  /* ===== Mağaza sayfası (Forevye sayfası gibi tam ekran açılır) ===== */
  function openStore() {
    var p = $('storePage'); render();
    p.classList.add('show'); p.scrollTop = 0; document.body.style.overflow = 'hidden'; $('storeBack').focus();
  }
  function closeStore() {
    $('storePage').classList.remove('show'); document.body.style.overflow = '';
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
    daily();                       // ödül sessizce işlenir; sadece Mağaza sayfasında görünür
    render();

    if (!$('storePage')) return;
    $('btnStore').addEventListener('click', openStore);
    $('storeBack').addEventListener('click', closeStore);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('storePage').classList.contains('show')) closeStore(); });
    $('kCamId').addEventListener('change', function () { S.cam = this.value.trim().slice(0, 60); save(); });
    $('kCopyId').addEventListener('click', function () { copy(S.id, 'ID kopyalandı: ' + S.id); });
    $('kMailAgain').addEventListener('click', function () { var r = pendingReq(); if (r) openMail(r); });
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
    importData: function (o) { var c = clean(o); if (!c.id) return false; S = c; daily(); save(); render(); return true; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
