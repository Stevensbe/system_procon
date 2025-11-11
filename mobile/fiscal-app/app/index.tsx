import { Redirect } from 'expo-router';

import { useAuthSelector } from '@/hooks/useAuth';

export default function Index() {
  const { isAuthenticated } = useAuthSelector();
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/home" />;
}
