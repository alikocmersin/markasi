# Markasi Oto Yedek Parça Portalı

Next.js App Router, TypeScript, Tailwind CSS ve SQLite ile çalışan B2C mağaza ve
stok yönetimi başlangıç uygulaması.

## Yerel kullanım

```bash
npm install
npm run dev
```

Mağaza `http://localhost:3000`, yönetim paneli
`http://localhost:3000/admin` adresindedir. İlk ziyaretinizde bir yönetici hesabı
oluşturun; parola veritabanında salt kullanılarak türetilmiş biçimde tutulur.
Ürünler, siparişler ve stoklar `data/markasi.sqlite` dosyasında saklanır.

## İşlevler

- OEM ve parça kodu araması; arama sonuçları gönderim yapılana kadar korunur.
  Orijinal ve muadil ürünler ile kalıcı favoriler.
- yedekparca.com.tr kaynağından Marka → Model → Kasa → Yıl → Motor → Güç
  sıralı araç seçimi ve VIN çözümleme.
- Merkez depo, raf adresi ve XML tedarikçi miktarlarını ayrı gösterme.
- Ürün ve fiyat düzenleme, kritik stok görünümü, ürün oluşturma.
- Yönetim panelinde genel bakış, ürün/stok, marka/kategori, sipariş ve XML
  bölümlerine ayrılmış görev odaklı gezinme; kritik stok ve yeni sipariş
  özetleri, katalogda arama ve ürün/sipariş listelerinde sayfalama. Genel bakış
  metrikleri, doğrulanmamış demo uyum kayıtlarını satış ve kritik stok
  sayımlarına dahil etmez.
- Yönetici panelinden markaları mağazadan kaldırma ve ürünlerini silmeden geri
  yükleme.
- Yönetici panelinden kategori ekleme, adını değiştirme ve ürünleri silmeden
  mağazadan kaldırıp geri yükleme.
- Stokta marka, parça kodu, raf ve tedarikçi arama; kritik stok filtresi ve
  kaydedilmemiş değişiklikleri koruma/geri alma.
- Siparişleri durum, müşteri, iletişim bilgisi ve ürün koduyla filtreleme.
- Sepet, teslimat bilgileriyle sipariş oluşturma ve stok rezervasyonunu yöneten
  sipariş durumları. Panelde son 100 sipariş listelenir.
- Yönetici oturumu, ilk hesap kurulumu ve maliyet bilgilerini sunucu tarafında
  yetkilendirme.
- Google ile üye girişi, kişisel iletişim/teslimat bilgilerini düzenleme ve
  sipariş formunda profil bilgilerini kullanma. T.C. kimlik numarası AES-GCM ile
  şifrelenerek saklanır.
- Tedarikçi XML dosyası içe aktarma; parça koduna göre stok eşleştirme ve
  eşleşmeyen kod raporu.
- Yönetici panelinde ürün sayfası bağlantısından tek ürün, kategori
  bağlantısından en fazla 20 ürünü önizleyerek toplu katalog aktarımı.
- Opel araç kataloğundaki mevcut nesil/motor/güç/yıl aralıklarını kapsayan 100
  sıfır stoklu demo eşleştirme kaydı. Gerçek ürün kodu ve uyumluluk doğrulanana
  kadar bu kayıtlar siparişe açılamaz.

XML içe aktarma en fazla 2 MB UTF-8 dosya kabul eder. Parça kodları için `code`,
`OEM`, `partNumber`, `sku`, `parcaKodu`; miktarlar için `stock`, `quantity`,
`qty`, `adet` alan adları tanınır. İsteğe bağlı `price` tedarikçi alış fiyatını
günceller. DTD ve harici entity tanımları reddedilir.

Ürün bağlantısı aktarımı yalnızca yapılandırılmış `schema.org/Product` verisi
bulunan HTTPS sayfalarını okuyabilir. Kategori sayfaları için yapılandırılmış
`ItemList` gerekir. Güvenilir kaynak alan adlarını sunucuda virgülle ayrılmış
`PRODUCT_IMPORT_ALLOWED_HOSTS` ortam değişkeniyle açıkça izin listesine ekleyin
(ör. `tedarikci.example,www.tedarikci.example`). Yönlendirmeler de aynı izin
listesini kullanır; başka alan adlarına veya HTTP bağlantılarına izin verilmez.
Kaynak veriler içe aktarılmadan önce düzenlenip onaylanır; mevcut parça kodları
otomatik olarak atlanır. Kaynaklardaki açıklama, fiyat ve uyumluluk bilgilerinin
doğruluğunu kaydetmeden önce kontrol edin.

Yerel geliştirmede izinli tedarikçi alan adlarını `.env.local` dosyasındaki
`PRODUCT_IMPORT_ALLOWED_HOSTS` değişkenine virgülle ayırarak yazın ve sunucuyu
yeniden başlatın. Bu allowlist başlangıçta boş bırakılır. Üçüncü taraf katalog
içeriklerini yalnızca açık aktarım izniniz varsa kullanın; izinli kaynak
makinece okunabilir ürün listesi sunmuyorsa tedarikçiden resmi XML/CSV/API
ürün beslemesi isteyin. Sıradan web sayfası bağlantıları tek başına güvenilir
OEM kodu, stok veya araç uyumluluğu sağlamaz.

Araç seçicideki altı aşamalı katalog seçenekleri, sunucu tarafında
`yedekparca.com.tr` kaynağının uyumluluk servisine yapılan isteklerle adım adım
alınır. Seçenekler SQLite `app_settings` tablosunda 30 gün süreyle saklanır;
araç ağacının tamamı önceden topluca indirilmez. Kaynak oturum çerezleri ve
güvenlik belirteci yalnızca sunucu tarafında tutulur; kaynak oturumu 5 dakika
bellekte yeniden kullanılır ve sayfa açılırken arka planda hazırlanır. Seçenek
yanıtları tarayıcı önbelleğinde de 1 saat saklanır. Sayfa açılışında sık
kullanılan markaların model listeleri; marka seçildikten sonra o markanın kasa
seçenekleri arka planda önceden yüklenir. Seçilen araç,
ürünleri yerel parça kataloğunda kayıtlı marka/model uyum metnine göre filtreler;
kasa, motor ve güç bilgileri ürün uyumluluk garantisi olarak değerlendirilmemelidir.

VIN sorgusu, 17 karakterli şasi numarasını resmi NHTSA vPIC API'sine göndererek
üreticinin bildirdiği marka, model, yıl, kasa, donanım ve mevcutsa motor/güç
alanlarını gösterir. vPIC kapsamı üretici bildirimlerine dayanır ve özellikle
Avrupa araçlarında eksik olabilir; VIN sonucu parça uyumluluğu garantisi değildir
ve mevcut yerel araç/parça kataloğunun yerine geçmez. NHTSA'nın trafik hız
sınırlamaları uygulanabilir. VIN çözümleme, altı aşamalı araç seçicisinden
bağımsız bir yardımcı özelliktir.

## Üyelik ve Google girişi

Üyeler e-posta adresi ve en az 8 karakterli şifreyle hesap oluşturabilir,
giriş yapabilir ve oturum açtıktan sonra iletişim/teslimat bilgilerini
profil sayfasından ekleyebilir. Şifreler düz metin olarak değil, salt kullanılıp
scrypt ile türetilmiş özetler halinde saklanır. Google ile devam et seçeneği de
isteğe bağlıdır; Google OAuth yapılandırılmasa bile e-posta/şifre üyeliği çalışır.

Önceden oluşturulmuş Google üyeleri için veritabanı şeması açılışta güvenli
biçimde güncellenir; mevcut profil ve sipariş verileri korunur. Aynı e-posta
adresiyle yeni hesap oluşturmak yerine mevcut Google hesabıyla giriş yapın.

Yerel ayar dosyası (`.env.local`) ve paylaşılabilir şablon (`.env.example`)
hazırdır. Google OAuth istemci kimliği ve gizli anahtarı yalnızca Google Cloud
Console'dan alınabilir; bunları uygulama içinden oluşturmak mümkün değildir.

1. [Google Cloud Console](https://console.cloud.google.com/) içinde bir proje
   seçin veya oluşturun.
2. Google Auth Platform'da uygulama marka bilgilerini ve hedef kitlesini
   yapılandırın. Uygulama test aşamasındaysa Audience bölümüne Google ile
   giriş yapacak test kullanıcılarının e-posta adreslerini ekleyin.
3. Clients bölümünden **Create client** seçip uygulama türünü **Web
   application** yapın.
4. Authorized redirect URIs listesine yerel geliştirme için tam olarak
   `http://localhost:3000/api/auth/google/callback` adresini ekleyin. Yayında
   ayrıca `https://alanadiniz/api/auth/google/callback` adresini ekleyin.
5. Oluşturulan istemcinin Client ID ve Client secret değerlerini proje
   kökündeki `.env.local` dosyasına girin:

```text
GOOGLE_CLIENT_ID=Google_Cloud_Console_Client_ID
GOOGLE_CLIENT_SECRET=Google_Cloud_Console_Client_Secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
SESSION_SECRET=<en az 32 bayt rastgele gizli değer>
MEMBER_DATA_ENCRYPTION_KEY=<en az 32 bayt rastgele gizli değer>
```

Ardından geliştirme sunucusunu durdurup `npm run dev` ile yeniden başlatın.
Google Cloud Console'daki yönlendirme URI'si ile `GOOGLE_REDIRECT_URI`
karakter karakter aynı olmalıdır. `.env.local` Git tarafından yok sayılır;
Google Client Secret değerini kaynak koda, ekran görüntüsüne veya Git'e
eklemeyin. Bu bilgiler girilene kadar hesap sayfasında Google girişi
çalışmayacak ve kurulum yönergesi gösterilecektir.

`GOOGLE_REDIRECT_URI` üretimde zorunludur ve Google Cloud Console'daki adresle
birebir aynı olmalıdır. `SESSION_SECRET` hem yönetici hem üye oturumlarını ve
OAuth doğrulama çerezlerini imzalar. `MEMBER_DATA_ENCRYPTION_KEY` T.C. kimlik
numaralarını şifrelemek için zorunludur; yedeklerini güvenli tutun ve kaybolursa
mevcut şifreli T.C. kimlik numaraları geri okunamayacağı için anahtarı
değiştirmeyin. Bu anahtarları kaynak koduna veya Git'e eklemeyin.

## Yayına alma notları

Bu proje, gerçek işletme bilgileri ve servis anahtarları eklenene kadar
çalıştırılabilir bir uygulama örneğidir. Canlıya almadan önce:

1. Kalıcı disk veya yönetilen PostgreSQL gibi dağıtım ortamına uygun veritabanı
   seçin. SQLite dosyası sunucunun kalıcı diskinde tutulmalıdır; sunucusuz ve
   yatay ölçeklenen ortamlarda yerel SQLite dosyası uygun değildir.
2. Üretimde en az 32 bayt rastgele `SESSION_SECRET` ve
   `MEMBER_DATA_ENCRYPTION_KEY` ortam değişkenlerini tanımlayın. Google üye
   girişi kullanılacaksa `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` ve
   `GOOGLE_REDIRECT_URI` değişkenlerini de yapılandırın.
3. Gerçek ödeme kuruluşu, kargo firması, e-posta/SMS, tedarikçi XML adresleri,
   araç/VIN veri sağlayıcısı ve işletme yasal metinlerini entegre edin.
4. Canlı ürün kataloğunu ve araç uyumluluklarını güvenilir kaynaktan aktarın.

Araç seçicide Türkiye'de yaygın araçlardan derlenmiş küratörlü bir başlangıç
kataloğu bulunur; tüm dünyadaki marka/model/yıl/motor varyantlarının eksiksiz
ve doğrulanmış listesi değildir. Katalog seçimi, mevcut ürünlerin metin tabanlı
uyumluluk (`fitment`) bilgisiyle filtrelenir; ürün kayıtlarında yapılandırılmış
yıl, kasa, motor ve güç eşleşmesi henüz tutulmaz. Kesin uyumluluk ve VIN
çözümleme için lisanslı araç/parça veri sağlayıcısı ve yapılandırılmış ürün
fitment verisi entegre edilmelidir.

Opel için eklenen 100 kayıt demo kapsam kontrolüdür; gerçek üretici parça kodu,
stok veya araç uyumluluğu beyanı değildir. Kayıtlar sıfır stok ve sıfır fiyatla
gelir. Satışa açmadan önce her parça numarasını güvenilir katalog veya
tedarikçiyle eşleştirin, fiyat/stok girin ve demo etiketini kaldırın. Mevcut
araç seçicide yalnızca Astra, Corsa ve Mokka modelleri bulunduğundan diğer Opel
modelleri bu kayıtların kapsamına dahil değildir.

Ödeme yöntemi seçimi şu an sipariş kaydını oluşturur; kart tahsilatı, otomatik
havale doğrulaması, kargo etiketi ve e-posta gönderimi yapmaz. VIN alanı yalnızca
17 karakter biçimini kontrol eder, araç çözümlemesi yapmaz. B2B fiyat/iskonto ve
cari bakiye gösterimi için bayi hesapları ve muhasebe/ERP bağlantısı gerekir.
