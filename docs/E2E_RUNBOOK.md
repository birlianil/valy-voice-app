# VAly Voice App End-to-End Runbook

This runbook defines the full validation flow from mobile connect to voice response.

## A. Required Services

Expected services:

- `token-server` -> `http://<host>:3000`
- `livekit` -> `ws://<host>:7880`
- `agent-worker` -> connected LiveKit worker

## B. Health Checks

```bash
curl "http://127.0.0.1:3000/token?room=va_voice_room&identity=healthcheck"
curl "http://127.0.0.1:7880/"
```

Expected:

- `/token` returns JSON with `token`
- LiveKit root endpoint returns `OK`

## C. Mobile Test Steps

1. Open app with development build
2. Set token/livekit URLs with LAN IP
3. Tap `Connect`
4. Confirm status is `Connected`
5. Speak and verify audio response

## D. Troubleshooting Flow

### 1) Token retrieval

- Check app error panel for token request failures
- If API key is required, ensure `x-api-key` is set

### 2) Room connection

- Verify status transitions to `Connected`
- Verify participant appears in LiveKit logs

### 3) Agent dispatch

- Verify worker receives room events
- Verify dispatch/agent name mapping is correct

### 4) Audio path

- Verify microphone permission
- Verify input level is not too low
- Verify network quality/packet loss

## E. Suggested Test Prompts

- "Hello, can you hear me?"
- "What are the basic requirements for a VA loan?"
- "Can you help me schedule an appointment?"
