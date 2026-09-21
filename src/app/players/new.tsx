import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { createPlayer, type DominantHand } from '@/api/players';
import { Button, DateField, ErrorBox, Field, Segmented } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';

export default function NewPlayerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [dominantHand, setDominantHand] = useState<DominantHand | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () =>
      createPlayer({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate: birthDate.trim() || null,
        dominantHand,
        notes: notes.trim() || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['players'] });
      router.back();
    },
    onError: (caught) => {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setFields(caught.fields ?? {});
      } else {
        setError('No se pudo guardar el alumno');
      }
    },
  });

  const submit = () => {
    setError(null);
    setFields({});
    mutation.mutate();
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
      >
        {error ? <ErrorBox title={error} /> : null}

        <Field
          label="Nombre"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          error={fields.firstName}
        />
        <Field
          label="Apellido"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          error={fields.lastName}
        />
        <DateField
          label="Fecha de nacimiento (opcional)"
          value={birthDate}
          onChange={setBirthDate}
          error={fields.birthDate}
        />

        <Segmented
          label="Mano hábil (opcional)"
          options={[
            { value: 'RIGHT', label: 'Diestro' },
            { value: 'LEFT', label: 'Zurdo' },
          ]}
          value={dominantHand}
          onChange={setDominantHand}
        />

        <Field
          label="Notas (opcional)"
          value={notes}
          onChangeText={setNotes}
          multiline
          style={styles.notes}
          error={fields.notes}
        />

        <Button
          title="Guardar alumno"
          onPress={submit}
          loading={mutation.isPending}
          disabled={!firstName.trim() || !lastName.trim()}
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
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  notes: {
    minHeight: 96,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
});
