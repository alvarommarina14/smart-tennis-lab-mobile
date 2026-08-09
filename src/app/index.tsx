import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchKpiCatalog } from '@/api/kpis';
import { colors, fontSize, radius, spacing } from '@/theme/tokens';

/**
 * Pantalla de humo de la Fase 0: confirma que la app habla con el backend y que el catálogo de
 * KPIs llega completo. En la Fase 2 la reemplaza la lista de partidos.
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data, isPending, error } = useQuery({
    queryKey: ['kpi-catalog', 'SINGLES'],
    queryFn: () => fetchKpiCatalog('SINGLES'),
  });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <Text style={styles.title}>Smart Tennis Lab</Text>
      <Text style={styles.subtitle}>Catálogo de KPIs</Text>

      {isPending && <ActivityIndicator color={colors.primary} style={styles.loader} />}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>No se pudo conectar con el backend</Text>
          <Text style={styles.errorDetail}>{error.message}</Text>
          <Text style={styles.errorHint}>
            Revisá que el backend esté corriendo y que EXPO_PUBLIC_API_URL apunte a la IP de tu
            máquina en la red local (no a localhost, que el celular no ve).
          </Text>
        </View>
      )}

      {data?.categories.map((category) => (
        <View key={category.code} style={styles.category}>
          <Text style={styles.categoryTitle}>{category.label}</Text>
          {category.kpis.map((kpi) => (
            <View key={kpi.code} style={styles.kpiRow}>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
              <Text style={kpi.kind === 'COUNTER' ? styles.badgeCounter : styles.badgeDerived}>
                {kpi.kind === 'COUNTER' ? 'tap' : 'calculado'}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
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
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginTop: -spacing.md,
  },
  loader: {
    marginTop: spacing.xl,
  },
  errorBox: {
    backgroundColor: colors.surface,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  errorTitle: {
    color: colors.danger,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  errorDetail: {
    color: colors.text,
    fontSize: fontSize.sm,
  },
  errorHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  category: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  categoryTitle: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '700',
    marginBottom: spacing.xs,
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
  badgeCounter: {
    color: colors.primaryText,
    backgroundColor: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '600',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  badgeDerived: {
    color: colors.textMuted,
    borderColor: colors.border,
    borderWidth: 1,
    fontSize: fontSize.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});
