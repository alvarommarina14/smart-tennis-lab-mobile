import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthStore } from '@/auth/store';
import { getDatabase } from '@/db/database';
import { colors } from '@/theme/tokens';

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const status = useAuthStore((state) => state.status);
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    getDatabase();
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    const onLoginScreen = segments[0] === 'login';

    if (status === 'signedOut' && !onLoginScreen) {
      router.replace('/login');
    } else if (status === 'signedIn' && onLoginScreen) {
      router.replace('/');
    }
  }, [status, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.textStrong,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ title: 'Partidos' }} />
      <Stack.Screen name="profile" options={{ title: 'Mi perfil' }} />
      <Stack.Screen name="players/index" options={{ title: 'Alumnos' }} />
      <Stack.Screen name="players/new" options={{ title: 'Nuevo alumno' }} />
      <Stack.Screen name="players/[id]" options={{ title: 'Alumno' }} />
      <Stack.Screen name="match/new" options={{ title: 'Nuevo partido' }} />
      <Stack.Screen name="match/[id]/capture" options={{ title: 'Captura' }} />
      <Stack.Screen name="match/[id]/report" options={{ title: 'Reporte' }} />
    </Stack>
  );
}
