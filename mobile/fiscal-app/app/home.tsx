import { StyleSheet, View, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuthSelector } from '@/hooks/useAuth';
import { useBootstrap } from '@/hooks/useBootstrap';
import { SyncStatusBadge } from '@/components/SyncStatusBadge';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthSelector();
  const { lastSyncAt, pendingCount } = useBootstrap();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fiscalização PROCON-AM</Text>
      <Text style={styles.subtitle}>Olá, {user?.nome || 'Fiscal'}!</Text>
      <SyncStatusBadge lastSyncAt={lastSyncAt} pendingCount={pendingCount} />

      <View style={styles.actions}>
        <Pressable style={styles.card} onPress={() => router.push('/autos/new')}>
          <Text style={styles.cardTitle}>Nova fiscalização</Text>
          <Text style={styles.cardDescription}>Abrir auto de constatação ou vistoria</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => router.push('/agendamentos')}>
          <Text style={styles.cardTitle}>Agendamentos</Text>
          <Text style={styles.cardDescription}>Planejar operações e check-ins</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => router.push('/sync/pending')}>
          <Text style={styles.cardTitle}>Pendências</Text>
          <Text style={styles.cardDescription}>Sincronizar autos e registros offline</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101828',
    paddingTop: 96,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F2F4F7',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#D0D5DD',
  },
  actions: {
    marginTop: 32,
    gap: 16,
  },
  card: {
    backgroundColor: '#1D2939',
    padding: 24,
    borderRadius: 16,
  },
  cardTitle: {
    color: '#F2F4F7',
    fontSize: 18,
    fontWeight: '600',
  },
  cardDescription: {
    marginTop: 8,
    color: '#98A2B3',
    fontSize: 14,
  },
});
