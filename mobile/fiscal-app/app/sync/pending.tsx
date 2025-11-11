import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppSelector } from '@/hooks/useAppSelector';

export default function PendingSyncScreen() {
  const autos = useAppSelector(state => state.offline.autos);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Pendências de sincronização</Text>
      {autos.length === 0 ? (
        <Text style={styles.helper}>Nenhum item pendente.</Text>
      ) : (
        autos.map(auto => (
          <View key={auto.uuid} style={styles.card}>
            <Text style={styles.cardTitle}>{auto.tipo}</Text>
            <Text style={styles.cardSubtitle}>{auto.descricao}</Text>
            <Text style={styles.meta}>Status: {auto.status}</Text>
            {auto.errorMessage ? <Text style={styles.error}>{auto.errorMessage}</Text> : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F2F4F7',
  },
  helper: {
    color: '#94A3B8',
  },
  card: {
    backgroundColor: '#1D2939',
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  cardTitle: {
    color: '#F2F4F7',
    fontSize: 18,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: '#CBD5F5',
  },
  meta: {
    color: '#94A3B8',
    fontSize: 12,
  },
  error: {
    color: '#F97066',
    fontSize: 12,
  },
});
