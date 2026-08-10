import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { useAuthStore } from '@/auth/store';
import { Button, ErrorBox, Field } from '@/components/ui';
import { colors, fontSize, spacing } from '@/theme/tokens';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);

  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const isSignUp = mode === 'signUp';

  async function submit() {
    setBusy(true);
    setError(null);
    setFields({});

    try {
      if (isSignUp) {
        await signUp(email.trim(), password, fullName.trim());
      } else {
        await signIn(email.trim(), password);
      }
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setFields(caught.fields ?? {});
      } else {
        setError('No se pudo conectar con el backend');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Smart Tennis Lab</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'Creá tu cuenta de profe' : 'Entrá para ver tus partidos'}
          </Text>
        </View>

        {error ? <ErrorBox title={error} /> : null}

        {isSignUp ? (
          <Field
            label="Nombre y apellido"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            error={fields.fullName}
          />
        ) : null}

        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          error={fields.email}
        />

        <Field
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={fields.password}
        />

        <Button
          title={isSignUp ? 'Crear cuenta' : 'Entrar'}
          onPress={submit}
          loading={busy}
          disabled={!email || !password || (isSignUp && !fullName)}
        />

        <Button
          title={isSignUp ? 'Ya tengo cuenta' : 'Crear una cuenta nueva'}
          variant="secondary"
          onPress={() => {
            setMode(isSignUp ? 'signIn' : 'signUp');
            setError(null);
            setFields({});
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
});
