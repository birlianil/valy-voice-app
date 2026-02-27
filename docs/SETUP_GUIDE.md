# VAly Voice App Setup Guide

This guide explains how to run the mobile client from scratch.

## 1. Prerequisites

- Node.js 20+
- npm 10+
- Backend services running on the same network
- Android device (recommended) or iOS simulator/dev build

## 2. Install

```bash
cd /Users/anilbirli/Documents/va-voice-codex
npm install
```

## 3. Start Backend Services

In the main backend repository, make sure these are running:

- `token-server` on port `3000`
- `livekit` on port `7880`
- `agent-worker` connected to LiveKit

Main backend repo:
- https://github.com/birlianil/voiceagentlive-openai

## 4. Start Development Server

```bash
npm run start:dev
```

## 5. Connect from Device

In the app, set:

- Token Server URL: `http://<MAC_LAN_IP>:3000`
- LiveKit WS URL: `ws://<MAC_LAN_IP>:7880`
- Room Name: e.g. `va_voice_room`
- Identity: e.g. `mobile_user_01`

Note: on physical devices, do not use `127.0.0.1`; use your computer's LAN IP.

## 6. Validate Connection

- Status should become `Connected`
- Agent worker logs should show room/participant activity
- You should receive voice responses after speaking

## 7. Common Issues

### Connected but no response

- Check if `agent-worker` is running
- Check agent dispatch configuration
- Check microphone permission

### Device cannot connect

- Ensure device and computer are on the same Wi-Fi
- Ensure ports `3000` and `7880` are reachable
- Ensure URLs use LAN IP, not `127.0.0.1`

### Expo Go screen appears

- This app requires a development build, not Expo Go
