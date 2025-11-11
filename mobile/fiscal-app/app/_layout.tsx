import { useEffect } from 'react';
import { Stack } from 'expo-router';

import { AppProviders } from '@/providers/AppProviders';
import { useBootstrap } from '@/hooks/useBootstrap';
import { useAuthSelector } from '@/hooks/useAuth';

function RootStack() {
  const { initialize } = useBootstrap();
  const { isAuthenticated } = useAuthSelector();

  useEffect(() => {
    if (isAuthenticated) {
      initialize();
    }
  }, [initialize, isAuthenticated]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" options={{ presentation: 'modal' }} />
      <Stack.Screen name="offline" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function Layout() {
  return (
    <AppProviders>
      <RootStack />
    </AppProviders>
  );
}
