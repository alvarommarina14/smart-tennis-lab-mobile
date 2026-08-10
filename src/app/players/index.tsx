import { useQuery } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchPlayers, playerName } from '@/api/players';
import { Button, EmptyState, ErrorBox, ListRow, Loading } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { colors, spacing } from '@/theme/tokens';

export default function PlayerListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data, isPending, error, refetch, isRefetching } = useQuery({
    queryKey: ['players'],
    queryFn: () => fetchPlayers(),
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={data ?? []}
        keyExtractor={(player) => player.id}
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
            <Button title="Nuevo alumno" onPress={() => router.push('/players/new')} />
            {error ? (
              <ErrorBox title="No se pudo traer la lista de alumnos" message={error.message} />
            ) : null}
            {isPending ? <Loading /> : null}
          </View>
        }
        ListEmptyComponent={
          isPending ? null : (
            <EmptyState
              title="Todavía no hay alumnos"
              hint="Cargá al primero para poder crear un partido."
            />
          )
        }
        renderItem={({ item }) => (
          <ListRow
            title={playerName(item)}
            subtitle={item.birthDate ? `Nacimiento ${formatDate(item.birthDate)}` : undefined}
            badge={item.dominantHand === 'LEFT' ? 'Zurdo' : undefined}
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
  separator: {
    height: spacing.sm,
  },
});
