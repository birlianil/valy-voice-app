# Repository Relationships

## This Repository

`valy-voice-app` is the mobile client sample:

- UI for connection parameters
- Token fetch and LiveKit join
- Dev build setup for Android/iOS

## Core Repositories

Core backend logic is maintained outside this repo:

- Main backend monorepo:
  - https://github.com/birlianil/voiceagentlive-openai
- Split repos:
  - https://github.com/birlianil/va-voice-agent-worker
  - https://github.com/birlianil/va-voice-token-server
  - https://github.com/birlianil/va-voice-tools-api
  - https://github.com/birlianil/va-voice-sdk-js

## Integration Contract

This app assumes:

- Token endpoint: `GET /token?room=<room>&identity=<identity>`
- Token response body includes `token`
- LiveKit WS endpoint is reachable by device

## Ownership Recommendation

- Keep this repo focused on mobile UX and connectivity.
- Keep backend/agent changes in backend repos.
- Version API contracts in backend/openapi repos.
