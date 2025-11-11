import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { DateTime } from 'luxon';

import { enviarAutoInfracao } from '@/services/syncService';

export default function AutoInfracaoScreen() {
  const [autoConstatacaoId, setAutoConstatacaoId] = useState('');
  const [fundamentacao, setFundamentacao] = useState('');
  const [dispositivos, setDispositivos] = useState('Art. 56 do CDC');
  const [valorEstimado, setValorEstimado] = useState('');
  const [finalizarNoOrgao, setFinalizarNoOrgao] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCriarAuto() {
    if (!autoConstatacaoId || !fundamentacao) {
      Alert.alert('Campos obrigatórios', 'Informe o auto de constatação e a fundamentação.');
      return;
    }
    try {
      setLoading(true);
      await enviarAutoInfracao({
        uuid: uuidv4(),
        auto_constatacao_id: Number(autoConstatacaoId),
        fundamentacao,
        dispositivos_legais: dispositivos.split(';').map(item => item.trim()).filter(Boolean),
        valor_multa_estimado: valorEstimado ? Number(valorEstimado) : undefined,
        finalizar_no_orgao: finalizarNoOrgao,
        emitido_em: DateTime.now().toISO(),
      });
      Alert.alert('Auto de infração', 'Documento registrado e enviado para o setor competente.');
      setAutoConstatacaoId('');
      setFundamentacao('');
      setValorEstimado('');
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Não foi possível criar o auto de infração.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Auto de Infração</Text>
      <Text style={styles.helper}>
        Informe os dados principais. O restante da instrução é finalizado no órgão quando necessário.
      </Text>

      <Text style={styles.label}>Auto de Constatação (ID)</Text>
      <TextInput
        style={styles.input}
        placeholder="ID do auto de constatação"
        keyboardType="numeric"
        value={autoConstatacaoId}
        onChangeText={setAutoConstatacaoId}
      />

      <Text style={styles.label}>Fundamentação</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        multiline
        numberOfLines={4}
        value={fundamentacao}
        onChangeText={setFundamentacao}
        placeholder="Descreva os fatos e dispositivos violados"
      />

      <Text style={styles.label}>Dispositivos legais (separados por ponto e vírgula)</Text>
      <TextInput style={styles.input} value={dispositivos} onChangeText={setDispositivos} />

      <Text style={styles.label}>Valor estimado da multa (opcional)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={valorEstimado}
        onChangeText={setValorEstimado}
      />

      <Pressable style={styles.checkbox} onPress={() => setFinalizarNoOrgao(prev => !prev)}>
        <View style={[styles.checkboxSquare, finalizarNoOrgao && styles.checkboxSquareChecked]} />
        <Text style={styles.checkboxLabel}>Finalizar elaboração no órgão</Text>
      </Pressable>

      <Pressable style={[styles.button, loading && styles.buttonDisabled]} disabled={loading} onPress={handleCriarAuto}>
        <Text style={styles.buttonText}>{loading ? 'Enviando...' : 'Registrar auto de infração'}</Text>
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
    height: 120,
    textAlignVertical: 'top',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#475467',
  },
  checkboxSquareChecked: {
    backgroundColor: '#32D583',
    borderColor: '#32D583',
  },
  checkboxLabel: {
    color: '#E4E7EC',
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
