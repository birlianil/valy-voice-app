import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
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

function createTokenEndpoint(value: ConnectionSettings): string {
  const base = cleanBaseUrl(value.tokenServerUrl);
  const room = encodeURIComponent(value.roomName.trim());
  const identity = encodeURIComponent(value.identity.trim());
  return `${base}/token?room=${room}&identity=${identity}`;
}

export default function App() {
  const [settings, setSettings] = useState<ConnectionSettings>(DEFAULTS);
  const [draftSettings, setDraftSettings] = useState<ConnectionSettings>(DEFAULTS);
  const [token, setToken] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  const pulse = useRef(new Animated.Value(0)).current;

  const tokenEndpoint = useMemo(() => createTokenEndpoint(settings), [settings]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  async function connectVoice(): Promise<void> {
    if (connecting || token) return;

    setConnecting(true);
    setError(null);
    setStatus('Connecting to VAly...');

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
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('Connection failed');
    } finally {
      setConnecting(false);
    }
  }

  async function disconnectVoice(): Promise<void> {
    setConnecting(false);
    setToken(null);
    setError(null);
    setStatus('');

    try {
      await AudioSession.stopAudioSession();
    } catch {
      // no-op
    }
  }

  async function testConnection(): Promise<void> {
    setTestingConnection(true);
    setSettingsFeedback('Testing token server...');

    try {
      const headers: Record<string, string> = {};
      const maybeApiKey = draftSettings.apiKey.trim();
      if (maybeApiKey) headers['x-api-key'] = maybeApiKey;

      const response = await fetch(createTokenEndpoint(draftSettings), { headers });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Test failed (${response.status}): ${body || 'empty response'}`);
      }

      const payload = (await response.json()) as { token?: string };
      if (!payload.token) {
        throw new Error('Token field is missing in response.');
      }

      setSettingsFeedback('Connection test passed.');
    } catch (err) {
      setSettingsFeedback(err instanceof Error ? err.message : String(err));
    } finally {
      setTestingConnection(false);
    }
  }

  function openSettings(): void {
    setDraftSettings(settings);
    setSettingsFeedback(null);
    setSettingsVisible(true);
  }

  function saveSettings(): void {
    const next: ConnectionSettings = {
      ...draftSettings,
      tokenServerUrl: cleanBaseUrl(draftSettings.tokenServerUrl),
      livekitWsUrl: draftSettings.livekitWsUrl.trim(),
      apiKey: draftSettings.apiKey.trim(),
      roomName: draftSettings.roomName.trim() || settings.roomName,
    };

    setSettings(next);
    setSettingsFeedback('Settings saved.');
    setStatus(token ? status : '');
    setSettingsVisible(false);
  }

  const isConnected = Boolean(token);
  const isBusy = connecting;

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0.06],
  });

  const primaryButtonStyle = [
    styles.callButton,
    isBusy ? styles.callButtonConnecting : isConnected ? styles.callButtonConnected : styles.callButtonIdle,
  ];

  const showStatusPill = Boolean(status || error);

  const statusPillStyle = [styles.statusPill, error ? styles.statusPillError : isConnected ? styles.statusPillConnected : styles.statusPillBusy];

  const statusDotStyle = [
    styles.statusDot,
    error ? styles.dotError : isConnected ? styles.dotConnected : styles.dotBusy,
  ];

  const callButtonText = isBusy ? '...' : isConnected ? 'END' : 'CALL';

  async function handlePrimaryPress(): Promise<void> {
    if (isBusy) return;
    if (isConnected) {
      await disconnectVoice();
      return;
    }
    await connectVoice();
  }

  const homeScreen = (
    <View style={styles.screen}>
      <View style={styles.bgGlowTop} />
      <View style={styles.bgGlowBottom} />

      <View style={styles.headerRow}>
        <View>
          <Text style={styles.brand}>VAly</Text>
          <Text style={styles.subtitle}>Voice Assistant</Text>
        </View>

        <Pressable style={styles.settingsButton} onPress={openSettings}>
          <Text style={styles.settingsButtonIcon}>⚙</Text>
        </Pressable>
      </View>

      <View style={styles.heroSection}>
        <View style={styles.ringWrap}>
          <View style={[styles.ring, styles.ringLarge]} />
          <View style={[styles.ring, styles.ringMedium]} />
          <View style={[styles.ring, styles.ringSmall]} />

          <Animated.View
            style={[
              styles.ring,
              styles.ringLarge,
              styles.ringPulse,
              {
                opacity: pulseOpacity,
                transform: [{ scale: pulseScale }],
              },
            ]}
          />

          <View style={styles.avatarShell}>
            <Image source={require('./assets/icon.png')} style={styles.avatarImage} />
          </View>
        </View>

        {showStatusPill ? (
          <View style={statusPillStyle}>
            <View style={statusDotStyle} />
            <Text style={styles.statusPillText}>{status || 'Connection issue'}</Text>
          </View>
        ) : null}

        <View style={styles.conversationCard}>
          <Text style={styles.conversationPlaceholder}>Conversation will appear here</Text>
          {!!error && <Text style={styles.conversationError}>{error}</Text>}
        </View>
      </View>

      <View style={styles.callSection}>
        <Pressable style={primaryButtonStyle} onPress={() => void handlePrimaryPress()}>
          {isBusy ? <ActivityIndicator color="#111827" /> : <Text style={styles.callButtonText}>{callButtonText}</Text>}
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {token ? (
          <LiveKitRoom
            serverUrl={settings.livekitWsUrl.trim()}
            token={token}
            connect
            audio
            video={false}
            onConnected={() => {
              setError(null);
              setStatus('Connected to VAly');
            }}
            onDisconnected={() => {
              setToken(null);
              setStatus('');
              void AudioSession.stopAudioSession().catch(() => undefined);
            }}
            onError={(e) => {
              setError(e?.message ?? 'Unknown room error');
              setStatus('Connection failed');
              setToken(null);
              void AudioSession.stopAudioSession().catch(() => undefined);
            }}
          >
            {homeScreen}
          </LiveKitRoom>
        ) : (
          homeScreen
        )}

        <Modal
          visible={settingsVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setSettingsVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Settings</Text>
                <Pressable style={styles.closeButton} onPress={() => setSettingsVisible(false)}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
                <View style={styles.configInfoCard}>
                  <Text style={styles.configInfoTitle}>Backend Configuration</Text>
                  <Text style={styles.configInfoText}>
                    Connect to your voice agent platform. A running token server and LiveKit instance are required.
                  </Text>
                </View>

                <Text style={styles.fieldLabel}>
                  Token Server URL <Text style={styles.requiredMark}>*</Text>
                </Text>
                <TextInput
                  value={draftSettings.tokenServerUrl}
                  onChangeText={(v) => setDraftSettings((prev) => ({ ...prev, tokenServerUrl: v }))}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  style={styles.fieldInput}
                  placeholder="http://192.168.1.12:3000"
                  placeholderTextColor="#5a708f"
                />

                <Text style={styles.fieldLabel}>
                  LiveKit WebSocket URL <Text style={styles.requiredMark}>*</Text>
                </Text>
                <TextInput
                  value={draftSettings.livekitWsUrl}
                  onChangeText={(v) => setDraftSettings((prev) => ({ ...prev, livekitWsUrl: v }))}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  style={styles.fieldInput}
                  placeholder="ws://192.168.1.12:7880"
                  placeholderTextColor="#5a708f"
                />

                <Text style={styles.fieldLabel}>API Key (optional)</Text>
                <TextInput
                  value={draftSettings.apiKey}
                  onChangeText={(v) => setDraftSettings((prev) => ({ ...prev, apiKey: v }))}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.fieldInput}
                  placeholder="x-api-key header value"
                  placeholderTextColor="#5a708f"
                />

                <Text style={styles.fieldLabel}>Room Name</Text>
                <TextInput
                  value={draftSettings.roomName}
                  onChangeText={(v) => setDraftSettings((prev) => ({ ...prev, roomName: v }))}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.fieldInput}
                  placeholder="va_voice_room"
                  placeholderTextColor="#5a708f"
                />

                <Text style={styles.identityHint}>Identity is generated automatically per app session.</Text>

                {!!settingsFeedback && <Text style={styles.settingsFeedback}>{settingsFeedback}</Text>}

                <Pressable
                  style={[styles.secondaryAction, testingConnection && styles.actionDisabled]}
                  onPress={() => void testConnection()}
                  disabled={testingConnection}
                >
                  {testingConnection ? (
                    <ActivityIndicator color="#4cc1ff" />
                  ) : (
                    <Text style={styles.secondaryActionText}>Test Connection</Text>
                  )}
                </Pressable>

                <Pressable style={styles.primaryAction} onPress={saveSettings}>
                  <Text style={styles.primaryActionText}>Save Settings</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#040a1d',
  },
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 18 : 12,
    paddingBottom: 22,
    backgroundColor: '#040a1d',
  },
  bgGlowTop: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: '#133d6a',
    opacity: 0.24,
  },
  bgGlowBottom: {
    position: 'absolute',
    bottom: -140,
    left: -120,
    width: 340,
    height: 340,
    borderRadius: 999,
    backgroundColor: '#0a2c54',
    opacity: 0.2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  brand: {
    color: '#f2f7ff',
    fontSize: 43,
    lineHeight: 46,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 3,
    color: '#9ab0ca',
    fontSize: 15,
    fontWeight: '500',
  },
  settingsButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#1a3654',
    backgroundColor: '#0a1a32',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  settingsButtonIcon: {
    color: '#9cb3cf',
    fontSize: 20,
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  ringWrap: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#1a4f85',
    borderRadius: 999,
  },
  ringLarge: {
    width: 260,
    height: 260,
    opacity: 0.2,
  },
  ringMedium: {
    width: 214,
    height: 214,
    opacity: 0.24,
  },
  ringSmall: {
    width: 168,
    height: 168,
    opacity: 0.3,
  },
  ringPulse: {
    borderColor: '#35b0ff',
    borderWidth: 1.5,
  },
  avatarShell: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 2,
    borderColor: '#235a90',
    backgroundColor: '#081c35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1794f4',
    shadowOpacity: 0.44,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  avatarImage: {
    width: 106,
    height: 106,
    borderRadius: 53,
  },
  statusPill: {
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  statusPillBusy: {
    borderColor: '#644f1b',
    backgroundColor: '#2f260d',
  },
  statusPillConnected: {
    borderColor: '#1a6eb3',
    backgroundColor: '#102941',
  },
  statusPillError: {
    borderColor: '#7a2d36',
    backgroundColor: '#35171d',
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  dotBusy: {
    backgroundColor: '#f4bf33',
  },
  dotConnected: {
    backgroundColor: '#34d399',
  },
  dotError: {
    backgroundColor: '#fb7185',
  },
  statusPillText: {
    color: '#d2def1',
    fontSize: 15,
    fontWeight: '600',
  },
  conversationCard: {
    width: '100%',
    minHeight: 126,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#173858',
    backgroundColor: '#081a30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 4,
  },
  conversationPlaceholder: {
    color: '#6c86a7',
    fontSize: 18,
    fontStyle: 'italic',
  },
  conversationError: {
    marginTop: 10,
    color: '#fca5a5',
    textAlign: 'center',
    fontSize: 13,
  },
  callSection: {
    alignItems: 'center',
    paddingBottom: 42,
  },
  callButton: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 1,
    borderColor: 'rgba(150, 193, 235, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3f8ed6',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },
  callButtonIdle: {
    backgroundColor: 'rgba(47, 95, 146, 0.74)',
  },
  callButtonConnected: {
    backgroundColor: 'rgba(156, 62, 86, 0.86)',
    shadowColor: '#c05877',
  },
  callButtonConnecting: {
    backgroundColor: 'rgba(156, 122, 43, 0.84)',
    shadowColor: '#c9a55a',
  },
  callButtonText: {
    color: '#f3f7ff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(1, 6, 17, 0.72)',
  },
  modalCard: {
    maxHeight: '86%',
    backgroundColor: '#08172c',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: '#173653',
  },
  modalHeader: {
    height: 72,
    borderBottomWidth: 1,
    borderBottomColor: '#16314b',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 18,
  },
  modalTitle: {
    color: '#eff4ff',
    fontSize: 30,
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#0f243d',
    borderWidth: 1,
    borderColor: '#1d3a57',
  },
  closeButtonText: {
    color: '#9db2cc',
    fontWeight: '600',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 42,
    gap: 12,
  },
  configInfoCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e77b7',
    backgroundColor: '#12385a',
    padding: 14,
    marginBottom: 8,
  },
  configInfoTitle: {
    color: '#53bbff',
    fontSize: 17,
    fontWeight: '700',
  },
  configInfoText: {
    marginTop: 6,
    color: '#a2bed8',
    fontSize: 14,
    lineHeight: 20,
  },
  fieldLabel: {
    marginTop: 8,
    color: '#dce7f7',
    fontSize: 16,
    fontWeight: '700',
  },
  requiredMark: {
    color: '#fb7185',
  },
  fieldInput: {
    marginTop: 8,
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1b3754',
    backgroundColor: '#041127',
    color: '#f3f7ff',
    fontSize: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  identityHint: {
    marginTop: 4,
    color: '#6f86a3',
    fontSize: 13,
  },
  settingsFeedback: {
    marginTop: 8,
    color: '#7ac9ff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryAction: {
    marginTop: 8,
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2f4963',
    backgroundColor: '#17293e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: '#58beff',
    fontSize: 18,
    fontWeight: '700',
  },
  primaryAction: {
    marginTop: 14,
    minHeight: 58,
    borderRadius: 14,
    backgroundColor: '#22b2ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22b2ff',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  primaryActionText: {
    color: '#05203b',
    fontSize: 20,
    fontWeight: '800',
  },
  actionDisabled: {
    opacity: 0.75,
  },
});
