import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchKpiCatalog, type Kpi } from '@/api/kpis';
import { Button, ErrorBox, Loading } from '@/components/ui';
import {
  countsByKpi,
  finishLocalMatch,
  finishLocalSet,
  getLocalMatch,
  insertLocalSet,
  listPointOutcomes,
  listSets,
  newId,
  recordTap,
  undoLastTap,
  type LocalMatch,
  type LocalSet,
} from '@/db/localMatches';
import { buildScoreboard, type PointOutcome } from '@/lib/tennisScore';
import { useSync } from '@/sync/useSync';
import { colors, fontSize, radius, spacing, MIN_TAP_TARGET } from '@/theme/tokens';

const AUTO_SYNC_INTERVAL_MS = 30_000;

function isPointKpi(code: string) {
  return code === 'POINT_WON' || code === 'POINT_LOST';
}

export default function CaptureScreen() {
  useKeepAwake();

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: matchId } = useLocalSearchParams<{ id: string }>();
  const { pending, syncing, sync, refreshPending } = useSync();

  const [match, setMatch] = useState<LocalMatch | null>(null);
  const [sets, setSets] = useState<LocalSet[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [points, setPoints] = useState<PointOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);

  const currentSet = sets.length > 0 ? sets[sets.length - 1] : null;
  const scoreboard = buildScoreboard(
    sets.map((set) => set.id),
    points,
    match?.format
  );
  const inSuperTiebreak = scoreboard.currentSet.kind === 'SUPER_TIEBREAK';

  const { data: catalog, error: catalogError } = useQuery({
    queryKey: ['kpi-catalog', match?.discipline ?? 'SINGLES'],
    queryFn: () => fetchKpiCatalog(match?.discipline ?? 'SINGLES'),
    enabled: match !== null,
    staleTime: Infinity,
  });

  const reload = useCallback(async () => {
    const [loadedMatch, loadedSets, loadedCounts, loadedPoints] = await Promise.all([
      getLocalMatch(matchId),
      listSets(matchId),
      countsByKpi(matchId),
      listPointOutcomes(matchId),
    ]);
    setMatch(loadedMatch);
    setSets(loadedSets);
    setCounts(loadedCounts);
    setPoints(loadedPoints);
    setLoading(false);
  }, [matchId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const timer = setInterval(() => sync(), AUTO_SYNC_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [sync]);

  async function tap(kpi: Kpi) {
    setCounts((previous) => ({ ...previous, [kpi.code]: (previous[kpi.code] ?? 0) + 1 }));
    if (isPointKpi(kpi.code)) {
      setPoints((previous) => [
        ...previous,
        { setId: currentSet?.id ?? null, won: kpi.code === 'POINT_WON' },
      ]);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await recordTap({ matchId, setId: currentSet?.id ?? null, kpiCode: kpi.code });
    refreshPending();
  }

  async function undo() {
    const removed = await undoLastTap(matchId);
    if (!removed) {
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setCounts((previous) => ({
      ...previous,
      [removed.kpi_code]: Math.max(0, (previous[removed.kpi_code] ?? 0) - 1),
    }));
    if (isPointKpi(removed.kpi_code)) {
      setPoints((previous) => previous.slice(0, -1));
    }
    refreshPending();
  }

  async function startNextSet() {
    const startedAt = new Date().toISOString();
    if (currentSet) {
      await finishLocalSet(currentSet.id, startedAt);
    }
    await insertLocalSet({
      id: newId(),
      matchId,
      setNumber: (currentSet?.set_number ?? 0) + 1,
      startedAt,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await reload();
  }

  function confirmFinish() {
    Alert.alert('Terminar el partido', '¿Cerrás el partido y vas al reporte?', [
      { text: 'Seguir contando', style: 'cancel' },
      { text: 'Terminar', style: 'destructive', onPress: finish },
    ]);
  }

  async function finish() {
    setFinishing(true);
    const finishedAt = new Date().toISOString();
    if (currentSet && !currentSet.finished_at) {
      await finishLocalSet(currentSet.id, finishedAt);
    }
    await finishLocalMatch(matchId, 'FINISHED', finishedAt);
    await sync();
    router.replace({ pathname: '/match/[id]/report', params: { id: matchId } });
  }

  if (loading) {
    return (
      <View style={styles.screen}>
        <Loading />
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.centered}>
        <ErrorBox
          title="Ese partido no está en este dispositivo"
          message="Solo se puede contar en el celular donde arrancó el partido."
        />
      </View>
    );
  }

  const won = counts.POINT_WON ?? 0;
  const lost = counts.POINT_LOST ?? 0;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: match.player_name ?? 'Captura' }} />

      <View style={styles.scoreboard}>
        <View style={styles.scoreRow}>
          <View style={styles.side}>
            <Text style={styles.sideName} numberOfLines={1}>
              {match.player_name ?? 'Alumno'}
            </Text>
            <Text style={styles.gamePoints}>{scoreboard.currentGame.player}</Text>
            {inSuperTiebreak ? null : (
              <Text style={styles.games}>{scoreboard.currentSet.player}</Text>
            )}
          </View>

          <View style={styles.middle}>
            <Text style={styles.setLabel}>
              {inSuperTiebreak ? 'Super TB' : `Set ${currentSet?.set_number ?? 1}`}
            </Text>
            {inSuperTiebreak ? (
              <Text style={styles.tiebreak}>a 10</Text>
            ) : scoreboard.currentGame.tiebreak ? (
              <Text style={styles.tiebreak}>TIEBREAK</Text>
            ) : (
              <Text style={styles.gamesLabel}>juegos</Text>
            )}
            {scoreboard.previousSets.length > 0 ? (
              <Text style={styles.previousSets}>
                {scoreboard.previousSets
                  .map((set) => `${set.player}-${set.opponent}`)
                  .join('  ')}
              </Text>
            ) : null}
          </View>

          <View style={styles.side}>
            <Text style={styles.sideName} numberOfLines={1}>
              {match.opponent_name ?? 'Rival'}
            </Text>
            <Text style={styles.gamePoints}>{scoreboard.currentGame.opponent}</Text>
            {inSuperTiebreak ? null : (
              <Text style={styles.games}>{scoreboard.currentSet.opponent}</Text>
            )}
          </View>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.totals}>
            Puntos {won}–{lost}
          </Text>
          {pending > 0 ? (
            <Text style={styles.pendingLabel}>{pending} sin subir</Text>
          ) : (
            <Text style={styles.syncedLabel}>{syncing ? 'Sincronizando…' : 'Al día'}</Text>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
      >
        {catalogError ? (
          <ErrorBox
            title="No se pudo traer el catálogo de KPIs"
            message="Conectate una vez para descargarlo y después podés contar sin señal."
          />
        ) : null}

        {catalog?.categories.map((category) => {
          const counters = category.kpis.filter((kpi) => kpi.kind === 'COUNTER');
          if (counters.length === 0) {
            return null;
          }
          return (
            <View key={category.code} style={styles.category}>
              <Text style={styles.categoryTitle}>{category.label}</Text>
              <View style={styles.grid}>
                {counters.map((kpi) => (
                  <CounterButton
                    key={kpi.code}
                    label={kpi.label}
                    count={counts[kpi.code] ?? 0}
                    onPress={() => tap(kpi)}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button title="Deshacer" variant="secondary" onPress={undo} style={styles.footerButton} />
        <Button
          title="Nuevo set"
          variant="secondary"
          onPress={startNextSet}
          style={styles.footerButton}
        />
        <Button
          title="Terminar"
          variant="danger"
          onPress={confirmFinish}
          loading={finishing}
          style={styles.footerButton}
        />
      </View>
    </View>
  );
}

function CounterButton({
  label,
  count,
  onPress,
}: {
  label: string;
  count: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.counter, pressed && styles.counterPressed]}
    >
      <Text style={styles.counterValue}>{count}</Text>
      <Text style={styles.counterLabel} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  scoreboard: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  sideName: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
  },
  gamePoints: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  games: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  middle: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
  },
  setLabel: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  gamesLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
  },
  tiebreak: {
    color: colors.warning,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  previousSets: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totals: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  pendingLabel: {
    color: colors.warning,
    fontSize: fontSize.xs,
  },
  syncedLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  category: {
    gap: spacing.sm,
  },
  categoryTitle: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  counter: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: MIN_TAP_TARGET + spacing.lg,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    gap: 2,
  },
  counterPressed: {
    backgroundColor: colors.primary,
  },
  counterValue: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  counterLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    backgroundColor: colors.surface,
  },
  footerButton: {
    flex: 1,
  },
});
