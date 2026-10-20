# Launch workflow — sıradaki işler

20 Ekim · Ege ile konuşmak için plan. Aşağıdakiler tamamlandı iddiası değildir.

## 1. Ürünü ilk kez gören kişi anlayabilsin

**Sorun:** Hareket iyi olsa bile neyin değiştiği ve neden işe yaradığı anlaşılmayabiliyor. Talimata “anlaşılır olsun” eklemek tek başına yeterli değil.

- Sorulardan üç net cevap çıkar: kim kullanıyor, hangi tek işi yapıyor, sonunda ne elde ediyor? Cevapları ürün kaynağıyla karşılaştır; eksik veya çelişkiliyse sor.
- Senaryoyu bu zincire bağla: başlangıç durumu → kullanıcının eylemi → görünen sonuç. Geçişte aynı nesneyi/ekranı takip et; sonucu sırf yazıyla açıklama.
- Önce 5–8 saniyelik ana sahne yap. İlk iki saniyedeki merakı ve sonuç karesini telefonda incele. Marka stilini koru; her ürüne aynı kart/terminal şablonunu uygulama.
- Eski brief’i olmayan farklı bir ürünü, yalnız o ürünün bilgileri ve verilen cevaplarla başka bir agent’a yaptır. Eksik tercihi kendisi sormalı; önceki LocIn/ReadnType sahnesini kopyalamamalı.
- Ürünü bilmeyen bir kişiye sesi kapalı ve sonra sesli göster: “Ne yapıyor, hangi eylemi gördün, sonuç ne?” Yanlış anlaşılan sahneyi düzeltip aynı soruları tekrar sor. Model kontrolünü insan geri bildirimi yerine yazma.

**Bitti diyebilmemiz için:** Yeni üründe cevaplardan MP4’e kadar akış çalışmış, kaynak dışı iddia çıkmamış ve yeni izleyicinin cevapları kaydedilmiş olmalı. İzlenme/retention başarısı için ayrıca gerçek yayın verisi gerekir.

## 2. Kaynakları workflow içinden toplama

**Yapabiliriz.** Bu bir engel değil. Yerelde kaynak denemeleri, Tin tarafında da arşiv arama/indirme helper’ı var. Ayrı ve büyük bir asset sistemi kurmaya gerek yok.

- Önce sahnenin ihtiyacını yaz: kitap yüzeyi mi, telefon arşivi mi, sakin başlayıp yükselen müzik mi? Uygun yerel dosya varsa tekrar indirme.
- Mevcut workflow adımında ilgili sağlayıcıdan birkaç aday getir; küçük önizlemeyi seç. Openverse keşif için kullanılabilir; indirme ve kredi kaydında dosyanın ilk kaynağına dön.
- Seçilen dosya için kaynak ID/URL, üretici, lisans/kredi, hash ve kullanılan kesiti kaydet. İndirme boyutu/zaman aşımı sınırını uygula; bozuk veya erişilemeyen dosyada açık hata ve uygun yedek kaynak kullan.
- Müzikte mevcut map/cut araçlarını kullan. Sabit ritim güvenilir değilse BPM uydurma; ölçülen vurgularla çalış veya başka parça seç. Efekti hareketin işine göre seç, her kesime ses ekleme.
- İki küçük deneme: anahtarsız bir kaynaktan görsel/ses; sonra erişim yok/403/429 durumunda yedek kaynak. Gerçek anahtarları loga yazma.

**Bitti diyebilmemiz için:** Temiz test projesi, önceden elle taşınmış dosya olmadan seçilen kaynağı getirip render alabilmeli; kaynak ve kredi kaydı son MP4’le eşleşmeli. Yerelde beş örnek indirmenin çalışması bu tam akışın kanıtı değil.

## 4. Revizyon için kaynakları saklama

**Sorun:** Mevcut Tin taslağı tek MP4 teslim ediyor, brief ve sahne dosyalarını geçici Studio klasöründe bırakıyor. “İkinci sahneyi değiştir” isteğinde yeniden kurmak gerekebilir.

- Her film için bir revizyon klasörü sakla: `BRIEF.json`, `src/`, seçilen araç sürümü, müzik/olay zamanları, `sources.json`, kontrol raporu ve son `film.mp4`.
- Ham büyük dosyaları gelişigüzel repo/proje belleğine koyma. Hakları uygunsa erişim kontrollü dosya alanında sakla; tekrar indirilebilen dosya için URL + hash tut. Gizli anahtarları pakete koyma.
- Mevcut MP4 çıktı sözleşmesine uygun kalırken kaynak paketinin hangi Tin dosya alanında tutulacağını seç. MP4 için mevcut 16 MB sınırını kaynak arşiviyle aşma.
- Aynı kaydı temiz klasöre geri yükleyip render al. Sonra yalnız bir sahneyi değiştir; müziği ve diğer sahneleri baştan üretmeden yeni sürüm çıkar. Eski sürüm silinmesin.

**Bitti diyebilmemiz için:** Kaynaklar geri yüklenmiş, ikinci render alınmış ve bir sahne revizyonu eski sürümü bozmadan yapılmış olmalı.

## Sıra

Önce **1’in kısa sahne ve yeni ürün denemesi**, sonra **2’nin küçük kaynak toplama denemesi**, ardından **4’ün kaynak saklama/geri yükleme testi**. Her adımın sonucu envanterde güncellenir.

## Teknik dayanak

- Yerel Tin: `workflow_packages/creative.launch_video/skills/launch-video/SKILL.md` ve `RENDER.md`; `assets.mjs` arama/indirme örnekleri mevcut.
- Yerel Tin çıktı sözleşmesi: tek MP4; diğer üretim dosyaları geçici Studio klasöründe. Kaynak saklama değişikliği henüz yapılmadı.
- Yerel film-lab: `FILM_FLOW.md`, `assets/FREE_APIS.md`, `assets/sfx/`; repodaki mevcut `music/tools/` ve bu daldaki `tools/cinetic/`, `tools/earshot/`, `shortform/` tekrar kullanılabilir.
- [Envanter](index.html) mevcut kodu, yerelde kalanları ve referans gözlemlerini ayrı gösterir. 3. madde bu çalışmanın dışında bırakıldı.
