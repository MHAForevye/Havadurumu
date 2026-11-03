# <img src="docs/h-01.svg" alt="Mikro-Klima Kontrol Merkezi">

Ücretsiz, reklamsız, hesap istemeyen bir hava durumu uygulaması. Tek bir servise güvenmek yerine onlarca kaynağı yan yana koyar, birleştirir ve geçmişte hangisinin bölgende daha sık haklı çıktığına bakar.

Forevye tarafından geliştirildi, yani ben.

---

## <img src="docs/h-02.svg" alt="Bu proje neden var">

Hobim fotoğrafçılık. Doğru ışık için, yağmurun tam ne zaman başlayıp biteceğini bilmek benim için önemli. Denediğim hava durumu uygulamaları iyi işler yapıyordu ama bu ihtiyaç için bana yetmedi. Kimseyi kötülemek gibi bir niyetim yok, hepsi kendi alanında gayet iyi. Ben sadece "birkaç kaynağa aynı anda baksam, hangisine ne kadar güvenebileceğimi görsem" dedim.

Yazmaya iki yağmurlu günde başladım. Sonraki güneşli günlerde eklemeler yaptım, ortaya bu çıktı.

Üç şeye dikkat ettim:

- <mark>**Ticari değil.**</mark> Para kazanmıyorum, o yüzden ücretli veri kaynaklarını kullanmadım. Bazı yerlerde ücret ödemem gerektiği için orada durdum.
- <mark>**Sadece açık kapılar.**</mark> Bazı sağlayıcılar verilerini herkese açık sunmuyor. Teknik olarak izinsiz yollar bulunabilirdi, aklımdan da geçmedi değil, ama denemedim. Kullandığım her veri, sunulduğu şekliyle ve kurallarına uyarak alınıyor.
- <mark>**Eksilere çekmesin.**</mark> Ticari olmadığı için ücretsiz katmanlar yetiyor. Tarayıcı servislere doğrudan bağlandığı için yük tek bir yerde toplanmıyor.

Hedefim bu tür uygulamalar arasında ilk 10'a girmek. Benzer bir araç bulamadım, ama bunu yapabilmem, aralarında ilk yüze giren hava durumu sağlayıcılarının verilerini açık sunmasından geçiyor. Onlar olmasaydı bu araç da olmazdı, hepsine teşekkür ederim.

---

## <img src="docs/h-03.svg" alt="Bilimsel yaklaşım: ne yapıyorum, ne yapmıyorum">

Kendi hava modelimi çalıştırmıyorum, yeni bir fizik de icat etmiyorum. Meteoroloji kurumlarının ve araştırma merkezlerinin yayımladığı, bilimsel olarak kabul gören modelleri ve ölçümleri <mark>**birleştiriyorum**</mark>. Hepsini değil, erişebildiklerimi.

1. <mark>**Çok kaynak:**</mark> 12 hava modeli (ECMWF, NOAA GFS, DWD ICON, Météo-France, GEM, UK Met Office, JMA ve ek olarak GraphCast, ECMWF AIFS, CMA, KMA, BoM ACCESS), bir de MET Norway ve wttr.in.
2. <mark>**Birleştirme:**</mark> Sıcaklık, nem, bulut, rüzgâr ve basınçta kaynakların medyanı; yağış miktarında ortalaması alınır.
3. <mark>**Topluluk tahmini:**</mark> ECMWF ve ICON'un yaklaşık 90 üyeli topluluk tahmininde kaç üyenin yağış gösterdiğine bakılır. Yağış olasılığı; topluluk oranı, kaynak oyu ve model olasılığının ortalamasıdır.
4. <mark>**Karne (geçmiş doğruluk):**</mark> Her açılışta, o konum için son 30 günün arşivlenmiş model tahminleri gerçekleşen değerlerle kıyaslanır. Sıcaklıkta daha az hata yapan, yağışta yağışlı saatleri daha iyi yakalayan model, birleşik tahminde daha çok sayılır. Sıcaklıktaki sistematik eğilim (en çok ±3°) düzeltilir.
5. <mark>**Güven:**</mark> Kaynaklar birbirine yakınsa güven yüksektir. İleri saatlerde düşer, bazı kaynaklar yüklenemezse de düşer.

### <img src="docs/h-04.svg" alt="Varsayımlar (bilerek söylüyorum)">

- Model çıktıları, yayımlandıkları gibi kabul edilir. Onları düzeltmeye çalışmıyorum, sadece eğilim ve ağırlık uyguluyorum.
- Karnede "gerçek" olarak ERA5 yeniden analizi kullanılır. ERA5 bir ölçüm değil, istasyon ve uydu verisiyle üretilmiş en iyi yeniden analizlerden biridir.
- Topluluk oranı, gerçek yağış olasılığına en yakın ölçü olarak alınır. Bu bir yaklaşımdır, garanti değildir.
- Havalimanı ölçümü (METAR) havalimanını temsil eder, senin sokağını değil.

### <img src="docs/h-05.svg" alt="Mikro-Klima skoru">

Her şey, fotoğraf çekmek için havayı beklemekle başladı. Uygulamalar bana "%60 yağış" diyordu. Ben ise bir yüzdeden fazlasını istiyordum: havanın o an ne kadar <mark>**gergin**</mark> olduğunu. Yağmurdan önce nem yükselir, sıcaklıkla çiy noktası birbirine yaklaşır, bulutlar kalınlaşır, basınç düşmeye başlar. Bunlar zaten ayrı ayrı yayımlanıyordu ama hiçbiri bana tek bakışta "şimdi mi, biraz sonra mı?" demiyordu.

Ben de hepsini kendi aklımca tartıp tek bir sayıya sıkıştırdım: 0'da açık ve dingin, 10'da fırtınanın kıyısı. İlk sürümü yağmurlu iki günde yazdım, sonraki güneşli günlerde ağırlıkları ve eşikleri oynadım. Bu yüzden skor <mark>**bana ait**</mark>: hiçbir kurumun hazır indeksi değil, formülü, ağırlıkları ve eşikleri ben seçtim ve kullandıkça geliştiriyorum.

Skor yağış potansiyelini ve atmosferik gerilimi gösterir, yağış miktarını değil. Miktar için mm değerine bak.

- %30 nem
- %25 çiy açığı (sıcaklık ile çiy noktası arasındaki fark)
- %25 bulut
- %20 yağış olasılığı
- CAPE ve atmosfer ek puanı (hızlı basınç düşüşü, 700 hPa nemi, toplam su buharı, kaldırma indeksi)
- Model yağış veriyorsa alt sınır: 0,1 mm ve üstü en az 6, 1 mm ve üstü 7,5, 4 mm ve üstü ya da fırtına işareti varsa 9

| Skor | Anlamı |
|---|---|
| 0-1,9 | Açık, kuru, kararlı |
| 2-3,9 | Sakin, hafif nemli |
| 4-5,9 | Sınırda, potansiyel dönem |
| 6-7,9 | Yüksek yağış potansiyeli |
| 8-10 | Kritik: fırtına, şiddetli yağış riski |

Kendi indeksim olduğu için resmî bir uyarının yerini tutmaz, can ve mal güvenliği gerektiğinde MGM'ye bak.

### <img src="docs/h-06.svg" alt="Senaryolar">

- <mark>**Kaynaklar çelişiyorsa:**</mark> Çoğunluktan belirgin sapan kaynak pembe hücreyle işaretlenir, güven değeri düşer.
- <mark>**Bir kaynak yüklenemezse:**</mark> Hesap kalan kaynaklarla yapılır. Bir ek model hata verse de ana 7 model etkilenmez.
- <mark>**İnternet yoksa:**</mark> Uygulama son kaydedilen veriyi gösterir ve çevrimdışı olduğunu belirtir.
- <mark>**Konum kuzey Avrupa dışındaysa:**</mark> 15 dakikalık yağış verisi radardan değil, modellerden türetilir (aşağıya bak).

---

## <img src="docs/h-07.svg" alt="Neler var">

- Saatlik ve 7 günlük tahmin, saat saat ayrıntı ve atmosferik veri matrisi
- Önümüzdeki 3 saat için 15 dakikalık yağış tahmini
- "Yağış ne zaman başlar, biter?" özeti
- Yağış radarı (hareketli harita)
- Kaynak karşılaştırma tablosu: kim ne diyor, kim sapıyor
- Geçmiş doğruluk karnesi ve "Kendi karnem" (tarayıcında biriken hafıza)
- Türkiye havalimanları için gerçek ölçüm (METAR), son 72 saat
- Yağış, rüzgâr ve sıcaklık uyarıları ile bildirimler (cihazında üretilir)
- Kayıtlı konumlar, şehir arama, GPS, rakım
- İki tema: <mark>**Klasik**</mark> (varsayılan) ve <mark>**Çizgi film**</mark>. Çizgi film teması Ayarlar'dan açılır. Her ikisinde de gece/gündüz modu var.
- Yedek al / geri yükle, yazı boyutu ve eşik tercihleri
- Ana ekrana eklenebilir (PWA), çevrimdışı çalışır
- Sık sorulan sorular ve gizlilik sayfası

## <img src="docs/h-08.svg" alt="Neler yok ">

- <mark>**Hesap, reklam ve kendi sunucum yok.**</mark> Tercihlerin tarayıcında kalır.
- <mark>**Resmi uyarı yok.**</mark> Can ve mal güvenliği gerektiren durumlarda Meteoroloji Genel Müdürlüğü'nün (MGM) uyarılarına bak.
- <mark>**METAR sadece Türkiye**</mark> (LT kodlu havalimanları).
- <mark>**Radar tabanlı kısa vade (nowcast)**</mark> MET Norway kapsamında, yani şu an esas olarak kuzey Avrupa'da. Orası dışında 15 dakikalık veri modellerden türetilir, radar kullanan servislerle yağış başlangıcında fark çıkabilir.
- <mark>**%100 kesin tahmin yok.**</mark> Güven yüzdesi tutarlılığı gösterir, doğruluğu garanti etmez.

---

## <img src="docs/h-09.svg" alt="Veri kaynakları ve teşekkür">

| Kaynak | Ne için |
|---|---|
| [Open-Meteo](https://open-meteo.com) | Hava modelleri, topluluk tahmini, arşiv (ERA5), geocoding, rakım |
| [MET Norway](https://api.met.no) | Tahmin ve radar nowcast |
| [wttr.in](https://wttr.in) | Ek tahmin kaynağı |
| [RainViewer](https://www.rainviewer.com) | Yağış radarı |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) | Harita (© OpenStreetMap katkıda bulunanlar) |
| [Aviation Weather Center](https://aviationweather.gov) | Havalimanı METAR verisi |

Model sahibi kurumlara da teşekkürler: ECMWF, NOAA, DWD, Météo-France, Environment Canada, UK Met Office, JMA, Google DeepMind, CMA, KMA ve BoM. Her servisin kullanım ve atıf koşulları kendi sitesinde yazıyor, bu proje ticari olmayan kullanım içindir.

## <img src="docs/h-10.svg" alt="Altyapı (kısaca)">

Sunucusuz, tek sayfalık statik bir site: `index.html`, `css/`, `js/`, `lib/` (Chart.js, Leaflet) ve `fonts/`. GitHub Pages üzerinden yayınlanır. Havalimanı verisi, `.github/workflows/metar.yml` ile her 30 dakikada bir GitHub Actions'ta çekilip `metar-data` dalına yazılır. `sw.js` çevrimdışı çalışmayı sağlar.

## <img src="docs/h-11.svg" alt="Gizlilik">

Ayrıntılar için [gizlilik.html](gizlilik.html).
