import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useBootstrap } from '@/hooks/useBootstrap';

export default function AgendamentosScreen() {
  const { status } = useBootstrap();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Agendamentos</Text>
      <Text style={styles.helper}>
        {status === 'synced'
          ? 'Agendamentos sincronizados serão exibidos aqui.'
          : 'Sincronize para carregar os agendamentos.'}
      </Text>
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
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F2F4F7',
  },
  helper: {
    marginTop: 12,
    color: '#94A3B8',
  },
});
