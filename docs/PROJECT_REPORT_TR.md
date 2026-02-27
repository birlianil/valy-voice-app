# VAly Voice App Proje Raporu (TR)

## Amaç

Bu repo, VAly ses deneyiminin mobil istemci referansı olarak ayrıştırıldı.

## Yapılanlar

1. Uygulama adı `VAly Voice App` olarak güncellendi.
2. Expo development build akışı aktif hale getirildi.
3. Android/iOS yapılandırmaları ve EAS profilleri eklendi.
4. Uçtan uca kurulum rehberi ve runbook dokümanları yazıldı.
5. Ana backend kodlarının farklı repoda olduğu açıkça belgelendi.

## Teknik Kapsam

- React Native + Expo
- LiveKit room connect
- Token server integration
- Device testing with development build

## Repo Sınırı

Bu repo sadece mobil istemciyi içerir. Backend tarafı için:
- https://github.com/birlianil/voiceagentlive-openai

## Yayın Notu

GitHub Pages için `docs/` klasörü hazırdır. Repo ayarlarından Pages source olarak `main` branch + `/docs` seçilmelidir.
