# Mikro-Klima Kontrol Merkezi

Ücretsiz, reklamsız, hesap istemeyen bir hava durumu uygulaması. Tek bir servise güvenmek yerine onlarca kaynağı yan yana koyar, birleştirir ve geçmişte hangisinin bölgende daha sık haklı çıktığına bakar.

Forevye tarafından geliştirildi.

---

## Bu proje neden var

Hobim fotoğrafçılık. Doğru ışık için, yağmurun tam ne zaman başlayıp biteceğini bilmek benim için önemli. Denediğim hava durumu uygulamaları iyi işler yapıyordu ama bu ihtiyaç için bana yetmedi. Kimseyi kötülemek gibi bir niyetim yok, hepsi kendi alanında gayet iyi. Ben sadece "birkaç kaynağa aynı anda baksam, hangisine ne kadar güvenebileceğimi görsem" dedim.

Yazmaya iki yağmurlu günde başladım. Sonraki güneşli günlerde eklemeler yaptım, ortaya bu çıktı.

Üç şeye dikkat ettim:

- **Ticari değil.** Para kazanmıyorum, o yüzden ücretli veri kaynaklarını kullanmadım. Bazı yerlerde ücret ödemem gerektiği için orada durdum.
- **Sadece açık kapılar.** Bazı sağlayıcılar verilerini herkese açık sunmuyor. Teknik olarak izinsiz yollar bulunabilirdi, aklımdan da geçmedi değil, ama denemedim. Kullandığım her veri, sunulduğu şekliyle ve kurallarına uyarak alınıyor.
- **Eksilere çekmesin.** Ticari olmadığı için ücretsiz katmanlar yetiyor. Tarayıcı servislere doğrudan bağlandığı için yük tek bir yerde toplanmıyor.

Hedefim bu tür uygulamalar arasında ilk 10'a girmek. Benzer bir araç bulamadım, ama bunu yapabilmem, aralarında ilk yüze giren hava durumu sağlayıcılarının verilerini açık sunmasından geçiyor. Onlar olmasaydı bu araç da olmazdı, hepsine teşekkür ederim.

---

## Bilimsel yaklaşım: ne yapıyorum, ne yapmıyorum

Kendi hava modelimi çalıştırmıyorum, yeni bir fizik de icat etmiyorum. Meteoroloji kurumlarının ve araştırma merkezlerinin yayımladığı, bilimsel olarak kabul gören modelleri ve ölçümleri **birleştiriyorum**. Hepsini değil, erişebildiklerimi.

1. **Çok kaynak:** 12 hava modeli (ECMWF, NOAA GFS, DWD ICON, Météo-France, GEM, UK Met Office, JMA ve ek olarak GraphCast, ECMWF AIFS, CMA, KMA, BoM ACCESS), bir de MET Norway ve wttr.in.
2. **Birleştirme:** Sıcaklık, nem, bulut, rüzgâr ve basınçta kaynakların medyanı; yağış miktarında ortalaması alınır.
3. **Topluluk tahmini:** ECMWF ve ICON'un yaklaşık 90 üyeli topluluk tahmininde kaç üyenin yağış gösterdiğine bakılır. Yağış olasılığı; topluluk oranı, kaynak oyu ve model olasılığının ortalamasıdır.
4. **Karne (geçmiş doğruluk):** Her açılışta, o konum için son 30 günün arşivlenmiş model tahminleri gerçekleşen değerlerle kıyaslanır. Sıcaklıkta daha az hata yapan, yağışta yağışlı saatleri daha iyi yakalayan model, birleşik tahminde daha çok sayılır. Sıcaklıktaki sistematik eğilim (en çok ±3°) düzeltilir.
5. **Güven:** Kaynaklar birbirine yakınsa güven yüksektir. İleri saatlerde düşer, bazı kaynaklar yüklenemezse de düşer.

### Varsayımlar (bilerek söylüyorum)

- Model çıktıları, yayımlandıkları gibi kabul edilir. Onları düzeltmeye çalışmıyorum, sadece eğilim ve ağırlık uyguluyorum.
- Karnede "gerçek" olarak ERA5 yeniden analizi kullanılır. ERA5 bir ölçüm değil, istasyon ve uydu verisiyle üretilmiş en iyi yeniden analizlerden biridir.
- Topluluk oranı, gerçek yağış olasılığına en yakın ölçü olarak alınır. Bu bir yaklaşımdır, garanti değildir.
- Havalimanı ölçümü (METAR) havalimanını temsil eder, senin sokağını değil.

### Mikro-Klima skoru

0-10 arası tek bir sayı: yağış potansiyeli ve atmosferik gerilim. **Yağış miktarı tahmini değildir**, miktar için mm değerine bak. Ağırlıklar yaklaşık olarak %30 nem, %25 çiy açığı, %25 bulut, %20 yağış olasılığı; CAPE ve atmosfer ek puanları ve yağış varsa alt sınır eklenir. Bu, uygulamaya özgü sezgisel bir formüldür. Bilimsel olarak doğrulanmış bir indeks ya da resmi uyarı değildir.

### Senaryolar

- **Kaynaklar çelişiyorsa:** Çoğunluktan belirgin sapan kaynak pembe hücreyle işaretlenir, güven değeri düşer.
- **Bir kaynak yüklenemezse:** Hesap kalan kaynaklarla yapılır. Bir ek model hata verse de ana 7 model etkilenmez.
- **İnternet yoksa:** Uygulama son kaydedilen veriyi gösterir ve çevrimdışı olduğunu belirtir.
- **Konum kuzey Avrupa dışındaysa:** 15 dakikalık yağış verisi radardan değil, modellerden türetilir (aşağıya bak).

---

## Neler var

- Saatlik ve 7 günlük tahmin, saat saat ayrıntı ve atmosferik veri matrisi
- Önümüzdeki 3 saat için 15 dakikalık yağış tahmini
- "Yağış ne zaman başlar, biter?" özeti
- Yağış radarı (hareketli harita)
- Kaynak karşılaştırma tablosu: kim ne diyor, kim sapıyor
- Geçmiş doğruluk karnesi ve "Kendi karnem" (tarayıcında biriken hafıza)
- Türkiye havalimanları için gerçek ölçüm (METAR), son 72 saat
- Yağış, rüzgâr ve sıcaklık uyarıları ile bildirimler (cihazında üretilir)
- Kayıtlı konumlar, şehir arama, GPS, rakım
- İki tema: **Klasik** (varsayılan) ve **Çizgi film**. Çizgi film teması Ayarlar'dan açılır. Her ikisinde de gece/gündüz modu var.
- Yedek al / geri yükle, yazı boyutu ve eşik tercihleri
- Ana ekrana eklenebilir (PWA), çevrimdışı çalışır
- Sık sorulan sorular ve gizlilik sayfası

## Neler yok (dürüst liste)

- **Hesap, reklam, kendi sunucum yok.** Tercihlerin tarayıcında kalır.
- **Resmi uyarı yok.** Can ve mal güvenliği gerektiren durumlarda Meteoroloji Genel Müdürlüğü'nün (MGM) uyarılarına bak.
- **METAR sadece Türkiye** (LT kodlu havalimanları).
- **Radar tabanlı kısa vade (nowcast)** MET Norway kapsamında, yani şu an esas olarak kuzey Avrupa'da. Orası dışında 15 dakikalık veri modellerden türetilir, radar kullanan servislerle yağış başlangıcında fark çıkabilir.
- **%100 kesin tahmin yok.** Güven yüzdesi tutarlılığı gösterir, doğruluğu garanti etmez.

---

## Veri kaynakları ve teşekkür

| Kaynak | Ne için |
|---|---|
| [Open-Meteo](https://open-meteo.com) | Hava modelleri, topluluk tahmini, arşiv (ERA5), geocoding, rakım |
| [MET Norway](https://api.met.no) | Tahmin ve radar nowcast |
| [wttr.in](https://wttr.in) | Ek tahmin kaynağı |
| [RainViewer](https://www.rainviewer.com) | Yağış radarı |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) | Harita (© OpenStreetMap katkıda bulunanlar) |
| [Aviation Weather Center](https://aviationweather.gov) | Havalimanı METAR verisi |

Model sahibi kurumlara da teşekkürler: ECMWF, NOAA, DWD, Météo-France, Environment Canada, UK Met Office, JMA, Google DeepMind, CMA, KMA ve BoM. Her servisin kullanım ve atıf koşulları kendi sitesinde yazıyor, bu proje ticari olmayan kullanım içindir.

## Altyapı (kısaca)

Sunucusuz, tek sayfalık statik bir site: `index.html`, `css/`, `js/`, `lib/` (Chart.js, Leaflet) ve `fonts/`. GitHub Pages üzerinden yayınlanır. Havalimanı verisi, `.github/workflows/metar.yml` ile her 30 dakikada bir GitHub Actions'ta çekilip `metar-data` dalına yazılır. `sw.js` çevrimdışı çalışmayı sağlar.

## Gizlilik

Ayrıntılar için [gizlilik.html](gizlilik.html).
