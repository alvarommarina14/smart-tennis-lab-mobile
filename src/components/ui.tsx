import { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dmyToIso, isoToDmy, isPastIso, maskDate } from '@/lib/dateInput';
import { colors, fontSize, labelText, radius, spacing, MIN_TAP_TARGET } from '@/theme/tokens';

export type BadgeTone = 'live' | 'done' | 'neutral';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        pressed && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.primaryText : colors.text} />
      ) : (
        <Text
          style={[
            styles.buttonLabel,
            variant === 'primary' ? styles.buttonLabelPrimary : styles.buttonLabelOnDark,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

type FieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function Field({ label, error, style, onFocus, onBlur, ...inputProps }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        {...inputProps}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          focused ? styles.inputFocused : null,
          error ? styles.inputError : null,
          style,
        ]}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

type DateFieldProps = {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  error?: string;
};

export function DateField({ label, value, onChange, error }: DateFieldProps) {
  const [text, setText] = useState(() => isoToDmy(value));
  const [localError, setLocalError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  function handleChange(next: string) {
    const masked = maskDate(next);
    setText(masked);

    if (masked.length < 10) {
      setLocalError(null);
      onChange('');
      return;
    }

    const iso = dmyToIso(masked);
    if (!iso) {
      setLocalError('Fecha inválida');
      onChange('');
      return;
    }
    if (!isPastIso(iso)) {
      setLocalError('La fecha de nacimiento tiene que ser pasada');
      onChange('');
      return;
    }

    setLocalError(null);
    onChange(iso);
  }

  const shown = localError ?? error;

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        placeholder="dd/mm/aaaa"
        keyboardType="number-pad"
        maxLength={10}
        value={text}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          focused ? styles.inputFocused : null,
          shown ? styles.inputError : null,
        ]}
      />
      {shown ? <Text style={styles.fieldError}>{shown}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type Option<T> = { value: T; label: string };

type SegmentedProps<T> = {
  label?: string;
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
};

export function Segmented<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={styles.segmented}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.segment,
                selected && styles.segmentSelected,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={selected ? styles.segmentLabelSelected : styles.segmentLabel}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type SelectProps<T> = {
  label?: string;
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  placeholder?: string;
  error?: string;
};

export function Select<T extends string>({
  label,
  options,
  value,
  onChange,
  placeholder = 'Elegí una opción',
  error,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find((option) => option.value === value) ?? null;

  return (
    <View style={styles.field}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.input,
          styles.selectTrigger,
          error ? styles.inputError : null,
          pressed ? styles.buttonPressed : null,
        ]}
      >
        <Text style={selected ? styles.selectValue : styles.selectPlaceholder} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.selectChevron}>▾</Text>
      </Pressable>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + spacing.sm }]}
            onPress={(event) => event.stopPropagation()}
          >
            {label ? <Text style={styles.sheetTitle}>{label}</Text> : null}
            <ScrollView bounces={false}>
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.optionRow,
                      pressed ? styles.optionRowPressed : null,
                    ]}
                  >
                    <Text style={isSelected ? styles.optionLabelSelected : styles.optionLabel}>
                      {option.label}
                    </Text>
                    {isSelected ? <Text style={styles.optionCheck}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

type ListRowProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeTone?: BadgeTone;
  onPress?: () => void;
  selected?: boolean;
};

export function ListRow({ title, subtitle, badge, badgeTone, onPress, selected }: ListRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && styles.buttonPressed,
      ]}
    >
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {badge ? <Badge tone={badgeTone}>{badge}</Badge> : null}
      {selected ? <Text style={styles.rowCheck}>✓</Text> : null}
    </Pressable>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: string; tone?: BadgeTone }) {
  return (
    <Text
      style={[
        styles.badge,
        tone === 'live' && styles.badgeLive,
        tone === 'done' && styles.badgeDone,
      ]}
    >
      {children}
    </Text>
  );
}

export function ErrorBox({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorTitle}>{title}</Text>
      {message ? <Text style={styles.errorDetail}>{message}</Text> : null}
    </View>
  );
}

type EmptyStateAction = {
  label: string;
  onPress: () => void;
};

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: EmptyStateAction;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {hint ? <Text style={styles.emptyHint}>{hint}</Text> : null}
      {action ? (
        <Button title={action.label} onPress={action.onPress} style={styles.emptyAction} />
      ) : null}
    </View>
  );
}

export function Loading() {
  return <ActivityIndicator color={colors.primary} style={styles.loading} />;
}

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TAP_TARGET,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDanger: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  buttonLabelPrimary: {
    color: colors.primaryText,
  },
  buttonLabelOnDark: {
    color: colors.text,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...labelText,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    color: colors.text,
    fontSize: fontSize.md,
    minHeight: MIN_TAP_TARGET,
    paddingHorizontal: spacing.lg,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  fieldError: {
    color: colors.danger,
    fontSize: fontSize.xs,
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  selectValue: {
    color: colors.text,
    fontSize: fontSize.md,
    flexShrink: 1,
  },
  selectPlaceholder: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    flexShrink: 1,
  },
  selectChevron: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 5, 8, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface2,
    borderTopWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '70%',
    paddingTop: spacing.md,
  },
  sheetTitle: {
    ...labelText,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  optionRow: {
    minHeight: MIN_TAP_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  optionRowPressed: {
    backgroundColor: colors.surfaceRaised,
  },
  optionLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    flexShrink: 1,
  },
  optionLabelSelected: {
    color: colors.textStrong,
    fontSize: fontSize.md,
    fontWeight: '600',
    flexShrink: 1,
  },
  optionCheck: {
    color: colors.primaryBright,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  segmented: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  segment: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    minHeight: MIN_TAP_TARGET / 2,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  segmentSelected: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  segmentLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  segmentLabelSelected: {
    color: colors.primaryBright,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  row: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderColor: colors.border,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TAP_TARGET,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowSelected: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  rowCheck: {
    color: colors.primaryBright,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: colors.textStrong,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  rowSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  badge: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  badgeLive: {
    color: colors.warning,
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
    borderColor: 'transparent',
  },
  badgeDone: {
    color: colors.success,
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
    borderColor: 'transparent',
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
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.md,
  },
  emptyTitle: {
    color: colors.textStrong,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  emptyHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
  loading: {
    marginTop: spacing.xl,
  },
});
