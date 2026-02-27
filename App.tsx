import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AudioSession, LiveKitRoom, registerGlobals } from '@livekit/react-native';

registerGlobals();

type ConnectionSettings = {
  tokenServerUrl: string;
  livekitWsUrl: string;
  apiKey: string;
  roomName: string;
  identity: string;
};

const DEFAULTS: ConnectionSettings = {
  tokenServerUrl: 'http://127.0.0.1:3000',
  livekitWsUrl: 'ws://127.0.0.1:7880',
  apiKey: '',
  roomName: 'va_voice_room',
  identity: `user_${Math.random().toString(36).slice(2, 8)}`,
};

function cleanBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

export default function App() {
  const [settings, setSettings] = useState<ConnectionSettings>(DEFAULTS);
  const [token, setToken] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [error, setError] = useState<string | null>(null);

  const tokenEndpoint = useMemo(() => {
    const base = cleanBaseUrl(settings.tokenServerUrl);
    const room = encodeURIComponent(settings.roomName.trim());
    const identity = encodeURIComponent(settings.identity.trim());
    return `${base}/token?room=${room}&identity=${identity}`;
  }, [settings.tokenServerUrl, settings.roomName, settings.identity]);

  async function connectVoice(): Promise<void> {
    setConnecting(true);
    setError(null);
    setStatus('Requesting token...');

    try {
      const headers: Record<string, string> = {};
      const maybeApiKey = settings.apiKey.trim();
      if (maybeApiKey) headers['x-api-key'] = maybeApiKey;

      const tokenResponse = await fetch(tokenEndpoint, { headers });
      if (!tokenResponse.ok) {
        const body = await tokenResponse.text();
        throw new Error(`Token request failed (${tokenResponse.status}): ${body || 'empty response'}`);
      }

      const payload = (await tokenResponse.json()) as { token?: string };
      if (!payload.token) {
        throw new Error('Token response did not include "token" field.');
      }

      await AudioSession.startAudioSession();
      setToken(payload.token);
      setStatus('Connecting to LiveKit...');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('Failed');
    } finally {
      setConnecting(false);
    }
  }

  async function disconnectVoice(): Promise<void> {
    setToken(null);
    setStatus('Disconnected');
    try {
      await AudioSession.stopAudioSession();
    } catch {
      // no-op
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {token ? (
          <View style={styles.flex}>
            <LiveKitRoom
              serverUrl={settings.livekitWsUrl.trim()}
              token={token}
              connect
              audio
              video={false}
              onConnected={() => setStatus('Connected')}
              onDisconnected={() => setStatus('Disconnected')}
              onError={(e) => {
                setError(e?.message ?? 'Unknown room error');
                setStatus('Room error');
              }}
            >
              <View style={styles.connectedWrap}>
                <Text style={styles.title}>VAly Voice App</Text>
                <Text style={styles.meta}>Room: {settings.roomName}</Text>
                <Text style={styles.meta}>Identity: {settings.identity}</Text>
                <Text style={styles.status}>Status: {status}</Text>
                {!!error && <Text style={styles.error}>{error}</Text>}
                <Pressable style={[styles.button, styles.secondary]} onPress={disconnectVoice}>
                  <Text style={styles.buttonText}>Disconnect</Text>
                </Pressable>
              </View>
            </LiveKitRoom>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>VAly Voice App</Text>
            <Text style={styles.sub}>Configure backend and connect.</Text>

            <Text style={styles.label}>Token Server URL</Text>
            <TextInput
              value={settings.tokenServerUrl}
              onChangeText={(v) => setSettings((prev) => ({ ...prev, tokenServerUrl: v }))}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              placeholder="http://127.0.0.1:3000"
              placeholderTextColor="#6b7280"
            />

            <Text style={styles.label}>LiveKit WebSocket URL</Text>
            <TextInput
              value={settings.livekitWsUrl}
              onChangeText={(v) => setSettings((prev) => ({ ...prev, livekitWsUrl: v }))}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              placeholder="ws://127.0.0.1:7880"
              placeholderTextColor="#6b7280"
            />

            <Text style={styles.label}>API Key (optional)</Text>
            <TextInput
              value={settings.apiKey}
              onChangeText={(v) => setSettings((prev) => ({ ...prev, apiKey: v }))}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              placeholder="x-api-key"
              placeholderTextColor="#6b7280"
            />

            <Text style={styles.label}>Room Name</Text>
            <TextInput
              value={settings.roomName}
              onChangeText={(v) => setSettings((prev) => ({ ...prev, roomName: v }))}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              placeholderTextColor="#6b7280"
            />

            <Text style={styles.label}>Identity</Text>
            <TextInput
              value={settings.identity}
              onChangeText={(v) => setSettings((prev) => ({ ...prev, identity: v }))}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              placeholderTextColor="#6b7280"
            />

            <Text style={styles.status}>Status: {status}</Text>
            {!!error && <Text style={styles.error}>{error}</Text>}

            <Pressable style={styles.button} disabled={connecting} onPress={connectVoice}>
              {connecting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Connect</Text>}
            </Pressable>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0b1020',
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 18,
    gap: 8,
  },
  connectedWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    gap: 12,
    backgroundColor: '#0b1020',
  },
  title: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
  },
  sub: {
    color: '#94a3b8',
    marginBottom: 8,
  },
  label: {
    color: '#cbd5e1',
    marginTop: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#111827',
    color: '#fff',
    borderRadius: 10,
    borderColor: '#1f2937',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  status: {
    color: '#93c5fd',
    marginTop: 8,
  },
  error: {
    color: '#fca5a5',
    marginTop: 4,
  },
  meta: {
    color: '#cbd5e1',
  },
  button: {
    marginTop: 12,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: '#374151',
    minWidth: 180,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
