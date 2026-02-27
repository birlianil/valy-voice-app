# Stack and Versions

This page records the stack used by the sample app and the referenced backend system.

Last verified: 2026-02-27

## Mobile App (this repo)

From `package.json`:

- `expo`: `~55.0.4`
- `expo-dev-client`: `~55.0.10`
- `react`: `19.2.0`
- `react-native`: `0.83.2`
- `@livekit/react-native`: `^2.9.6`
- `@livekit/react-native-webrtc`: `^137.0.2`
- `@livekit/react-native-expo-plugin`: `^1.0.1`
- `livekit-client`: `^2.17.2`
- `typescript`: `~5.9.2`

## Backend Reference (voiceagentlive-openai)

From backend repository configs:

- LiveKit docker image: `livekit/livekit-server:latest`
- LiveKit running local version (container): `1.9.11`
- Token server SDK: `livekit-server-sdk ^2.13.0`
- Agent runtime packages:
  - `@livekit/agents ^1.0.47`
  - `@livekit/agents-plugin-openai ^1.0.47`
  - `@livekit/rtc-node ^0.13.24`

Infrastructure images in compose:

- `postgres:16-alpine`
- `redis:7-alpine`

## OpenAI Defaults (backend `.env.example`)

- `OPENAI_MODEL=gpt-4.1-nano`
- `OPENAI_STT_MODEL=gpt-4o-mini-transcribe`
- `OPENAI_TTS_MODEL=gpt-4o-mini-tts`
- `OPENAI_TTS_VOICE=marin`

## Database / Supabase

Default local DB:
- `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/va_voice`

Optional Supabase connection pattern:
- `SUPABASE_DB_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require`
- set `DATABASE_URL=${SUPABASE_DB_URL}`

## Important Note on LiveKit Versioning

Current compose uses `livekit/livekit-server:latest`.

For production stability, pin an explicit LiveKit image tag (or digest) and update with controlled release cadence.
