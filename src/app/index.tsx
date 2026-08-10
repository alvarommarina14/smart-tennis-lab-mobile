import { useQuery } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MatchSummary } from '@/api/matches';
import { useAuthStore } from '@/auth/store';
import { Button, EmptyState, ErrorBox, ListRow, Loading } from '@/components/ui';
import { formatDateTime, statusLabel } from '@/lib/format';
import { loadMatchFeed } from '@/lib/matchFeed';
import { useSync } from '@/sync/useSync';
import { colors, fontSize, radius, spacing } from '@/theme/tokens';

export default function MatchListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const coach = useAuthStore((state) => state.coach);
  const signOut = useAuthStore((state) => state.signOut);
  const { pending, syncing, sync, refreshPending } = useSync();

  const { data, isPending, error, refetch, isRefetching } = useQuery({
    queryKey: ['matches'],
    queryFn: () => loadMatchFeed(),
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
      refreshPending();
    }, [refetch, refreshPending])
  );

  const openMatch = (match: MatchSummary) => {
    router.push({ pathname: '/match/[id]/capture', params: { id: match.id } });
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={data ?? []}
        keyExtractor={(match) => match.id}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            {coach ? <Text style={styles.greeting}>Hola, {coach.fullName}</Text> : null}

            {pending > 0 ? (
              <View style={styles.pendingBox}>
                <Text style={styles.pendingText}>
                  {pending} {pending === 1 ? 'tap sin sincronizar' : 'taps sin sincronizar'}
                </Text>
                <Button
                  title="Sincronizar"
                  variant="secondary"
                  loading={syncing}
                  onPress={() => sync()}
                  style={styles.pendingButton}
                />
              </View>
            ) : null}

            <Button
              title="Nuevo partido"
              onPress={() => router.push('/match/new')}
            />
            <View style={styles.secondaryActions}>
              <Button
                title="Alumnos"
                variant="secondary"
                onPress={() => router.push('/players')}
                style={styles.flexButton}
              />
              <Button
                title="Salir"
                variant="secondary"
                onPress={signOut}
                style={styles.flexButton}
              />
            </View>

            {error ? (
              <ErrorBox
                title="No se pudo traer la lista de partidos"
                message={error.message}
              />
            ) : null}
            {isPending ? <Loading /> : null}
          </View>
        }
        ListEmptyComponent={
          isPending ? null : (
            <EmptyState
              title="Todavía no hay partidos"
              hint="Creá uno y empezá a contar los puntos en la cancha."
            />
          )
        }
        renderItem={({ item }) => (
          <ListRow
            title={item.playerName ?? 'Alumno sin nombre'}
            subtitle={`${item.opponentName ? `vs ${item.opponentName} · ` : ''}${formatDateTime(item.startedAt)}`}
            badge={statusLabel(item.status)}
            onPress={() => openMatch(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
  },
  header: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  greeting: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  pendingBox: {
    backgroundColor: colors.surface,
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pendingText: {
    color: colors.warning,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  pendingButton: {
    minHeight: 44,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flexButton: {
    flex: 1,
  },
  separator: {
    height: spacing.sm,
  },
});
