import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';

import { registrarPedidoNotificacao } from '@/services/syncService';

const tipos = [
  { label: 'Prévia', value: 'PREVIA' },
  { label: 'Auto lavrado', value: 'AUTO' },
  { label: 'Lembrete de prazo', value: 'LEMBRETE' },
];

const canais = [
  { label: 'E-mail', value: 'EMAIL' },
  { label: 'SMS', value: 'SMS' },
  { label: 'Carta', value: 'CARTA' },
];

export default function NovaNotificacaoScreen() {
  const [autoId, setAutoId] = useState('');
  const [tipo, setTipo] = useState('PREVIA');
  const [canal, setCanal] = useState('EMAIL');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleEnviar() {
    if (!autoId) {
      Alert.alert('Campos obrigatórios', 'Informe o auto vinculado.');
      return;
    }
    try {
      setLoading(true);
      await registrarPedidoNotificacao({
        auto_id: Number(autoId),
        tipo,
        canal_preferencial: canal,
        observacoes,
      });
      Alert.alert('Notificação registrada', 'Pedido enviado para análise do setor.');
      setAutoId('');
      setObservacoes('');
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Não foi possível registrar a notificação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nova Notificação</Text>
      <Text style={styles.helper}>Os pedidos são encaminhados ao DFISC para emissão oficial.</Text>

      <Text style={styles.label}>Auto relacionado (ID)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={autoId}
        onChangeText={setAutoId}
        placeholder="Número interno do auto"
      />

      <Text style={styles.label}>Tipo de notificação</Text>
      <View style={styles.pillGroup}>
        {tipos.map(item => (
          <Pressable
            key={item.value}
            style={[styles.pill, tipo === item.value && styles.pillActive]}
            onPress={() => setTipo(item.value)}
          >
            <Text style={[styles.pillText, tipo === item.value && styles.pillTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Canal preferencial</Text>
      <View style={styles.pillGroup}>
        {canais.map(item => (
          <Pressable
            key={item.value}
            style={[styles.pill, canal === item.value && styles.pillActive]}
            onPress={() => setCanal(item.value)}
          >
            <Text style={[styles.pillText, canal === item.value && styles.pillTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Observações</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        multiline
        numberOfLines={3}
        value={observacoes}
        onChangeText={setObservacoes}
      />

      <Pressable style={[styles.button, loading && styles.buttonDisabled]} disabled={loading} onPress={handleEnviar}>
        <Text style={styles.buttonText}>{loading ? 'Enviando...' : 'Registrar pedido'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#0F172A',
    gap: 16,
  },
  title: {
    color: '#F2F4F7',
    fontSize: 24,
    fontWeight: '700',
  },
  helper: {
    color: '#94A3B8',
  },
  label: {
    color: '#E4E7EC',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    color: '#F8FAFC',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pillGroup: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#475467',
  },
  pillActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  pillText: {
    color: '#E4E7EC',
  },
  pillTextActive: {
    color: '#fff',
  },
  button: {
    marginTop: 12,
    backgroundColor: '#7F56D9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
