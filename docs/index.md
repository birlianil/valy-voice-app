# VAly Voice App

![VAly Voice App](assets/icon.png)

Client-facing mobile app for VAly voice sessions.

## Product Snapshot

- Platform: React Native + Expo Development Build
- Realtime: LiveKit voice room
- Auth: Token-based join via token-server
- Use case: Fast mobile validation for VAly voice experiences

## Start Here

- [Setup Guide](SETUP_GUIDE.md)
- [End-to-End Runbook](E2E_RUNBOOK.md)
- [Repo Relationships](REPO_RELATIONS.md)
- [Project Report](PROJECT_REPORT.md)

## What Is In This Repo

- Mobile app UI + LiveKit room join flow
- Token request flow (`/token`)
- Development build setup (`eas.json`, `expo-dev-client`)

## What Is NOT In This Repo

- Agent orchestration runtime
- Token-server implementation
- Tools backend implementation

For those, see:
- [voiceagentlive-openai](https://github.com/birlianil/voiceagentlive-openai)

## End-to-End Flow

```mermaid
sequenceDiagram
  participant User as Mobile User
  participant App as VAly Voice App
  participant TS as Token Server
  participant LK as LiveKit
  participant AW as Agent Worker

  User->>App: Connect
  App->>TS: GET /token?room&identity
  TS-->>App: JWT token
  App->>LK: connect(room, token)
  LK->>AW: dispatch agent
  AW-->>LK: audio responses
  LK-->>App: playback stream
```
