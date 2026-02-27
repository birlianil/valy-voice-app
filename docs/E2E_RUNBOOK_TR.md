# VAly Voice App E2E Runbook (TR)

Bu runbook, mobil istemciden sesli yanıt alana kadar uçtan uca test akışını tanımlar.

## A. Servis Durumu

Beklenen servisler:

- `token-server` -> `http://<host>:3000`
- `livekit` -> `ws://<host>:7880`
- `agent-worker` -> LiveKit'e bağlı worker

## B. Sağlık Kontrolleri

```bash
curl "http://127.0.0.1:3000/token?room=va_voice_room&identity=healthcheck"
curl "http://127.0.0.1:7880/"
```

Beklenti:

- `/token` JSON içinde `token` alanı döner
- LiveKit kök endpoint `OK` döner

## C. Mobil Uygulama Adımları

1. Uygulamayı development build ile aç
2. Token/LiveKit URL alanlarını LAN IP ile gir
3. `Connect` butonuna bas
4. Status `Connected` olmasını doğrula
5. Mikrofona konuş ve ses cevabı bekle

## D. Başarısızlıkta Tanı Akışı

### 1) Token alınıyor mu?

- App error panelinde `Token request failed` var mı
- `x-api-key` gerekiyorsa doğru girildi mi

### 2) Room bağlantısı var mı?

- Status `Connecting to LiveKit...` -> `Connected` geçiyor mu
- LiveKit loglarında participant görülüyor mu

### 3) Agent tetikleniyor mu?

- Worker logunda room join ve turn event'leri var mı
- Yanlış `agentName` veya dispatch kuralı var mı

### 4) Ses hattı çalışıyor mu?

- Cihaz mikrofon izni açık mı
- Çevresel ses seviyesi çok düşük mü
- Network jitter/paket kaybı var mı

## E. Uygun Test Senaryoları

- Kısa selamlama: "Merhaba, beni duyuyor musun?"
- Bilgi sorgusu: "VA loan için temel şartlar neler?"
- Tool çağrısı tetikleyen soru: "Randevu oluşturabilir misin?"
