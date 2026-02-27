# VAly Voice App Kurulum Rehberi (TR)

Bu belge, projeyi sıfırdan ayağa kaldırmak için adım adım rehberdir.

## 1. Ön Koşullar

- Node.js 20+
- npm 10+
- Aynı ağda çalışan backend servisleri
- Android cihaz (önerilen) veya iOS simulator/dev build

## 2. Projeyi Hazırla

```bash
cd /Users/anilbirli/Documents/va-voice-codex
npm install
```

## 3. Backend Servislerini Ayağa Kaldır

Ana backend reposunda aşağıdakiler çalışır durumda olmalı:

- `token-server` (`:3000`)
- `livekit` (`:7880`)
- `agent-worker` (LiveKit'e bağlı)

Ana backend repo:
- https://github.com/birlianil/voiceagentlive-openai

## 4. Development Server Başlat

```bash
npm run start:dev
```

## 5. Cihazdan Bağlan

Uygulama içinde:

- Token Server URL: `http://<MAC_LAN_IP>:3000`
- LiveKit WS URL: `ws://<MAC_LAN_IP>:7880`
- Room Name: örn. `va_voice_room`
- Identity: örn. `mobile_user_01`

Not: Telefonda `127.0.0.1` kullanılmaz, bilgisayarın LAN IP'si kullanılır.

## 6. Connect Sonrası Doğrulama

- `Connected` görünmeli
- Agent worker loglarında ilgili room/participant görülmeli
- Konuşma sonrası ses dönüşü alınmalı

## 7. Sık Sorunlar

### Connected yazıyor ama cevap yok

- `agent-worker` çalışıyor mu kontrol et
- Doğru room'a dispatch oluyor mu kontrol et
- Mikrofon izni verildi mi kontrol et

### Telefon bağlanamıyor

- Cihaz ve bilgisayar aynı Wi-Fi'da mı
- `3000` ve `7880` portları dış ağa açık mı
- URL'lerde `127.0.0.1` yerine LAN IP kullanıldı mı

### Expo Go ekranı geliyor

- Bu proje Expo Go ile değil, development build ile çalışır
