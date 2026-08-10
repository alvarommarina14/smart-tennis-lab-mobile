import { useQuery } from '@tanstack/react-query';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MatchSummary } from '@/api/matches';
import { fetchPlayer, playerName } from '@/api/players';
import { EmptyState, ErrorBox, ListRow, Loading } from '@/components/ui';
import { formatDate, formatDateTime, statusLabel } from '@/lib/format';
import { loadMatchFeed } from '@/lib/matchFeed';
import { colors, fontSize, radius, spacing } from '@/theme/tokens';

export default function PlayerMatchesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: playerId } = useLocalSearchParams<{ id: string }>();

  const { data: player } = useQuery({
    queryKey: ['player', playerId],
    queryFn: () => fetchPlayer(playerId),
  });

  const { data: matches, isPending, error, refetch, isRefetching } = useQuery({
    queryKey: ['matches', playerId],
    queryFn: () => loadMatchFeed(playerId),
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const openMatch = (match: MatchSummary) => {
    if (match.status === 'IN_PROGRESS') {
      router.push({ pathname: '/match/[id]/capture', params: { id: match.id } });
    } else {
      router.push({ pathname: '/match/[id]/report', params: { id: match.id } });
    }
  };

  const played = matches?.length ?? 0;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: player ? playerName(player) : 'Alumno' }} />
      <FlatList
        data={matches ?? []}
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
            {player ? (
              <View style={styles.card}>
                <Text style={styles.name}>{playerName(player)}</Text>
                {player.birthDate ? (
                  <Text style={styles.meta}>Nacimiento {formatDate(player.birthDate)}</Text>
                ) : null}
                {player.dominantHand ? (
                  <Text style={styles.meta}>
                    {player.dominantHand === 'LEFT' ? 'Zurdo' : 'Diestro'}
                  </Text>
                ) : null}
                {player.notes ? <Text style={styles.notes}>{player.notes}</Text> : null}
                <Text style={styles.count}>
                  {played === 1 ? '1 partido' : `${played} partidos`}
                </Text>
              </View>
            ) : null}

            {error ? (
              <ErrorBox title="No se pudieron traer los partidos" message={error.message} />
            ) : null}
            {isPending ? <Loading /> : null}
          </View>
        }
        ListEmptyComponent={
          isPending ? null : (
            <EmptyState
              title="Este alumno todavía no tiene partidos"
              hint="Creá uno desde la lista de partidos para empezar a medirlo."
            />
          )
        }
        renderItem={({ item }) => (
          <ListRow
            title={item.opponentName ? `vs ${item.opponentName}` : 'Partido'}
            subtitle={formatDateTime(item.startedAt)}
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  meta: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  notes: {
    color: colors.text,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  count: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  separator: {
    height: spacing.sm,
  },
});
