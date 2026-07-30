# AI Mail Hub

Bu proje, yapay zekâ raporlarını özel bir API uç noktası üzerinden alan yerel bir
posta kutusu uygulamasıdır.

## Önemli

Google API anahtarı gerekmez. Uygulamada görünen API anahtarı, yeni posta kutusu
oluşturulduğunda sistem tarafından otomatik üretilir.

## Çalıştırma

1. Bilgisayarınızda Node.js 22 veya üzeri kurulu olmalıdır.
2. Proje klasöründe terminal açın.
3. `npm install` komutunu çalıştırın.
4. `npm run dev` komutunu çalıştırın.
5. Tarayıcıdan `http://localhost:3000` adresini açın.

SQLite veritabanı ilk çalıştırmada `data/ai-mail-hub.db` olarak otomatik oluşur.

## GitHub Codespaces ile çalıştırma

1. GitHub deposunda yeşil **Code** düğmesine basın.
2. **Codespaces** sekmesini açın.
3. **Create codespace on main** düğmesine basın.
4. Kurulum tamamlanınca terminalde `npm run dev -- -H 0.0.0.0` çalıştırın.
5. Açılan `3000` portu bağlantısından programı kullanın.

> GitHub Pages yalnızca statik sayfaları yayınlar. Bu uygulama API ve SQLite
> veritabanı kullandığı için GitHub Pages yerine Codespaces veya ayrı bir
> Node.js sunucusunda çalıştırılmalıdır.

## Kullanım

1. “Yeni Mail Adresi Oluştur” düğmesine basın.
2. Sistem bir adres ve `amh_` ile başlayan özel API anahtarı üretir.
3. “Demo Rapor Gönder” düğmesiyle sistemi hemen test edebilirsiniz.
4. Dış bir yapay zekâ aracı rapor gönderecekse `POST /api/messages/report`
   uç noktasını, oluşturulan adresi ve API anahtarını kullanmalıdır.
