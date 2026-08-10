import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { useAuthStore } from '@/auth/store';
import { Button, ErrorBox, Field } from '@/components/ui';
import { colors, fontSize, radius, spacing } from '@/theme/tokens';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const coach = useAuthStore((state) => state.coach);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const changePassword = useAuthStore((state) => state.changePassword);

  const [email, setEmail] = useState(coach?.email ?? '');
  const [fullName, setFullName] = useState(coach?.fullName ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileFields, setProfileFields] = useState<Record<string, string>>({});
  const [profileSaved, setProfileSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordFields, setPasswordFields] = useState<Record<string, string>>({});
  const [passwordSaved, setPasswordSaved] = useState(false);

  const profileChanged = email.trim() !== coach?.email || fullName.trim() !== coach?.fullName;

  async function saveProfile() {
    setSavingProfile(true);
    setProfileError(null);
    setProfileFields({});
    setProfileSaved(false);

    try {
      await updateProfile(email.trim(), fullName.trim());
      setProfileSaved(true);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setProfileError(caught.message);
        setProfileFields(caught.fields ?? {});
      } else {
        setProfileError('No se pudo guardar el perfil');
      }
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword() {
    setSavingPassword(true);
    setPasswordError(null);
    setPasswordFields({});
    setPasswordSaved(false);

    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordSaved(true);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setPasswordError(caught.message);
        setPasswordFields(caught.fields ?? {});
      } else {
        setPasswordError('No se pudo cambiar la contraseña');
      }
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tus datos</Text>

          {profileError ? <ErrorBox title={profileError} /> : null}
          {profileSaved ? <Text style={styles.saved}>Perfil actualizado.</Text> : null}

          <Field
            label="Nombre y apellido"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            error={profileFields.fullName}
          />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            error={profileFields.email}
          />

          <Button
            title="Guardar cambios"
            onPress={saveProfile}
            loading={savingProfile}
            disabled={!email.trim() || !fullName.trim() || !profileChanged}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cambiar contraseña</Text>

          {passwordError ? <ErrorBox title={passwordError} /> : null}
          {passwordSaved ? <Text style={styles.saved}>Contraseña actualizada.</Text> : null}

          <Field
            label="Contraseña actual"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            error={passwordFields.currentPassword}
          />
          <Field
            label="Contraseña nueva"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            error={passwordFields.newPassword}
          />

          <Button
            title="Cambiar contraseña"
            onPress={savePassword}
            loading={savingPassword}
            disabled={currentPassword.length === 0 || newPassword.length < 8}
          />
          <Text style={styles.hint}>
            Mínimo 8 caracteres. Al cambiarla se cierra la sesión en los otros dispositivos, pero
            en este seguís adentro.
          </Text>
        </View>
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
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  saved: {
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  hint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
});
