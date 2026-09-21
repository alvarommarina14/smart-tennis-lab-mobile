import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchMatchReport, formatKpiValue, type KpiValue } from '@/api/reports';
import { Button, ErrorBox, Loading } from '@/components/ui';
import { formatDateTime, formatDuration, statusLabel } from '@/lib/format';
import { useSync } from '@/sync/useSync';
import { colors, fontSize, labelText, mono, radius, spacing } from '@/theme/tokens';

export default function MatchReportScreen() {
  const insets = useSafeAreaInsets();
  const { id: matchId } = useLocalSearchParams<{ id: string }>();
  const { pending, syncing, sync } = useSync();
  const [syncedOnOpen, setSyncedOnOpen] = useState(false);

  const { data, isPending, error, refetch, isRefetching } = useQuery({
    queryKey: ['match-report', matchId],
    queryFn: () => fetchMatchReport(matchId),
    enabled: syncedOnOpen,
  });

  useEffect(() => {
    sync().finally(() => setSyncedOnOpen(true));
  }, [sync]);

  async function syncAndRefresh() {
    await sync();
    await refetch();
  }

  if (!syncedOnOpen || isPending) {
    return (
      <View style={styles.screen}>
        <Loading />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
    >
      {error ? (
        <ErrorBox
          title="No se pudo traer el reporte"
          message={`${error.message}. El reporte lo calcula el backend, así que necesita conexión.`}
        />
      ) : null}

      {pending > 0 ? (
        <View style={styles.pendingBox}>
          <Text style={styles.pendingText}>
            Quedan {pending} taps sin subir: el reporte todavía no los cuenta.
          </Text>
        </View>
      ) : null}

      {data ? (
        <>
          <View style={styles.headerCard}>
            <Text style={styles.title}>{data.playerName ?? 'Alumno sin nombre'}</Text>
            {data.opponentName ? (
              <Text style={styles.subtitle}>vs {data.opponentName}</Text>
            ) : null}
            {data.tournament ? <Text style={styles.subtitle}>{data.tournament}</Text> : null}
            <Text style={styles.meta}>
              {formatDateTime(data.startedAt)} · {statusLabel(data.status)}
            </Text>
            <Text style={styles.meta}>
              {formatDuration(data.durationMinutes)} · {data.totalEvents} eventos
            </Text>
          </View>

          {data.categories.map((category) => (
            <View key={category.code} style={styles.card}>
              <Text style={styles.cardTitle}>{category.label}</Text>
              {category.kpis.map((kpi) => (
                <KpiRow key={kpi.code} kpi={kpi} />
              ))}
            </View>
          ))}

          {data.sets.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Por set</Text>
              {data.sets.map((set) => {
                const relevant = set.kpis.filter((kpi) => kpi.value !== 0);
                return (
                  <View key={set.setId} style={styles.card}>
                    <Text style={styles.cardTitle}>Set {set.setNumber}</Text>
                    {relevant.length === 0 ? (
                      <Text style={styles.emptySet}>Sin taps en este set</Text>
                    ) : (
                      relevant.map((kpi) => <KpiRow key={kpi.code} kpi={kpi} />)
                    )}
                  </View>
                );
              })}
            </>
          ) : null}
        </>
      ) : null}

      <Button
        title="Sincronizar y actualizar"
        variant="secondary"
        onPress={syncAndRefresh}
        loading={syncing || isRefetching}
      />
    </ScrollView>
  );
}

function KpiRow({ kpi }: { kpi: KpiValue }) {
  return (
    <View style={styles.kpiRow}>
      <Text style={styles.kpiLabel}>{kpi.label}</Text>
      <Text style={kpi.kind === 'DERIVED' ? styles.kpiValueDerived : styles.kpiValue}>
        {formatKpiValue(kpi)}
      </Text>
    </View>
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
    gap: spacing.md,
  },
  headerCard: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    color: colors.textStrong,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.text,
    fontSize: fontSize.md,
  },
  meta: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  sectionTitle: {
    ...labelText,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    ...labelText,
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  kpiLabel: {
    color: colors.text,
    fontSize: fontSize.sm,
    flexShrink: 1,
  },
  kpiValue: {
    ...mono,
    color: colors.textStrong,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  kpiValueDerived: {
    ...mono,
    color: colors.primaryBright,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  emptySet: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  pendingBox: {
    backgroundColor: colors.surface,
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  pendingText: {
    color: colors.warning,
    fontSize: fontSize.sm,
  },
});
