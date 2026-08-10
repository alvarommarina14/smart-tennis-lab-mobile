import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Surface } from '@/api/matches';
import { fetchPlayers, playerName } from '@/api/players';
import { Button, EmptyState, ErrorBox, Field, ListRow, Loading, Segmented } from '@/components/ui';
import { insertLocalMatch, insertLocalSet, newId } from '@/db/localMatches';
import { SURFACE_OPTIONS } from '@/lib/format';
import type { MatchFormat } from '@/lib/tennisScore';
import { syncNow } from '@/sync/sync';
import { colors, fontSize, spacing } from '@/theme/tokens';

const FORMAT_OPTIONS: { value: MatchFormat; label: string }[] = [
  { value: 'BEST_OF_3_SETS', label: '3 sets' },
  { value: 'TWO_SETS_SUPER_TIEBREAK', label: '2 sets y super tiebreak' },
];

const FORMAT_HINTS: Record<MatchFormat, string> = {
  BEST_OF_3_SETS: 'Si empatan los dos primeros, el tercero es un set completo.',
  TWO_SETS_SUPER_TIEBREAK:
    'Si empatan los dos primeros, el tercer set se reemplaza por un tiebreak a 10 con 2 de diferencia.',
};

export default function NewMatchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [playerId, setPlayerId] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState('');
  const [tournament, setTournament] = useState('');
  const [surface, setSurface] = useState<Surface | null>(null);
  const [format, setFormat] = useState<MatchFormat>('BEST_OF_3_SETS');
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: players, isPending, error: playersError } = useQuery({
    queryKey: ['players'],
    queryFn: () => fetchPlayers(),
  });

  const selectedPlayer = players?.find((player) => player.id === playerId) ?? null;

  async function start() {
    if (!selectedPlayer) {
      return;
    }

    setStarting(true);
    setError(null);

    try {
      const matchId = newId();
      const startedAt = new Date().toISOString();

      await insertLocalMatch({
        id: matchId,
        playerId: selectedPlayer.id,
        playerName: playerName(selectedPlayer),
        opponentName: opponentName.trim() || null,
        tournament: tournament.trim() || null,
        surface,
        discipline: 'SINGLES',
        format,
        startedAt,
      });
      await insertLocalSet({ id: newId(), matchId, setNumber: 1, startedAt });

      void syncNow();
      router.replace({ pathname: '/match/[id]/capture', params: { id: matchId } });
    } catch {
      setError('No se pudo crear el partido en el dispositivo');
      setStarting(false);
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
        {error ? <ErrorBox title={error} /> : null}
        {playersError ? (
          <ErrorBox title="No se pudo traer la lista de alumnos" message={playersError.message} />
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alumno</Text>
          <Text style={styles.sectionHint}>Tocá el alumno para elegirlo.</Text>
        </View>
        {isPending ? <Loading /> : null}
        {players?.length === 0 ? (
          <EmptyState
            title="No tenés alumnos cargados"
            hint="Un partido siempre es de un alumno: cargá al primero desde la pantalla de alumnos."
          />
        ) : null}
        <View style={styles.players}>
          {players?.map((player) => (
            <ListRow
              key={player.id}
              title={playerName(player)}
              selected={player.id === playerId}
              onPress={() => setPlayerId(player.id)}
            />
          ))}
        </View>

        <Field
          label="Rival (opcional)"
          value={opponentName}
          onChangeText={setOpponentName}
          autoCapitalize="words"
        />
        <Field
          label="Torneo (opcional)"
          value={tournament}
          onChangeText={setTournament}
          autoCapitalize="sentences"
        />
        <Segmented
          label="Superficie (opcional)"
          options={SURFACE_OPTIONS}
          value={surface}
          onChange={setSurface}
        />

        <Segmented
          label="Formato"
          options={FORMAT_OPTIONS}
          value={format}
          onChange={setFormat}
        />
        <Text style={styles.formatHint}>{FORMAT_HINTS[format]}</Text>

        <Button
          title={selectedPlayer ? `Empezar partido de ${playerName(selectedPlayer)}` : 'Empezar partido'}
          onPress={start}
          loading={starting}
          disabled={!selectedPlayer}
        />
        <Text style={styles.hint}>
          {selectedPlayer
            ? 'El partido arranca en el dispositivo. Si no hay señal se sincroniza solo cuando vuelve.'
            : 'Elegí un alumno de la lista para poder empezar.'}
        </Text>
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
  section: {
    gap: 2,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  sectionHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  players: {
    gap: spacing.sm,
  },
  formatHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: -spacing.sm,
  },
  hint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});
