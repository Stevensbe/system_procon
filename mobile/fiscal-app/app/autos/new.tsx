import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View, Pressable, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { DateTime } from 'luxon';
import { v4 as uuidv4 } from 'uuid';

import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { useAppSelector } from '@/hooks/useAppSelector';
import { autoFormConfig, defaultFieldValue, AutoField, AutoSection } from '@/constants/autoFormConfig';

const origens = [
  { label: 'Fiscalizacao', value: 'FISCALIZACAO' },
  { label: 'Denuncia', value: 'DENUNCIA' },
  { label: 'Operacao especial / Forca-tarefa', value: 'FORCA_TAREFA' },
  { label: 'Outros', value: 'OUTROS' },
];

export default function NovoAutoScreen() {
  const { addAutoDraft } = useOfflineQueue();
  const empresas = useAppSelector(state => state.bootstrap.empresas);
  const checklists = useAppSelector(state => state.bootstrap.checklists);
  const [tipo, setTipo] = useState<string>('BANCO');
  const [empresaId, setEmpresaId] = useState<string>('');
  const [descricao, setDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [origem, setOrigem] = useState('FISCALIZACAO');
  const [enviando, setEnviando] = useState(false);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const emitidoEm = useMemo(() => DateTime.now().toISO(), []);
  const checklistItens = useMemo(() => checklists[tipo] ?? [], [checklists, tipo]);
  const formSections: AutoSection[] = useMemo(() => autoFormConfig[tipo] ?? [], [tipo]);
  const empresaSelecionada = useMemo(() => {
    if (!empresaId) return null;
    const id = Number(empresaId);
    if (Number.isNaN(id)) return null;
    return empresas.find(emp => emp.id === id) ?? null;
  }, [empresaId, empresas]);

  const formValido = useMemo(() => descricao.trim().length >= 15, [descricao]);

  useEffect(() => {
    const defaults: Record<string, any> = {};
    formSections.forEach(section => {
      section.fields.forEach(field => {
        defaults[field.key] = defaultFieldValue(field);
      });
    });
    setFormValues(defaults);
  }, [formSections]);

  useEffect(() => {
    if (checklistItens.length === 0) {
      setChecklistState({});
      return;
    }
    setChecklistState(prev => {
      const next: Record<string, boolean> = {};
      checklistItens.forEach(item => {
        next[item] = prev[item] ?? false;
      });
      return next;
    });
  }, [checklistItens.join('|')]);

  function handleToggleChecklist(item: string, value: boolean) {
    setChecklistState(prev => ({
      ...prev,
      [item]: value,
    }));
  }

  function handleFieldChange(field: AutoField, value: any) {
    setFormValues(prev => ({
      ...prev,
      [field.key]: value,
    }));
  }

  function renderField(field: AutoField) {
    const value = formValues[field.key];
    switch (field.type) {
      case 'text':
        return (
          <View key={field.key} style={styles.fieldWrapper}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={field.placeholder}
              value={value}
              onChangeText={text => handleFieldChange(field, text)}
            />
          </View>
        );
      case 'number':
        return (
          <View key={field.key} style={styles.fieldWrapper}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={field.placeholder}
              keyboardType="numeric"
              value={value}
              onChangeText={text => handleFieldChange(field, text)}
            />
          </View>
        );
      case 'textarea':
        return (
          <View key={field.key} style={styles.fieldWrapper}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
              placeholder={field.placeholder}
              value={value}
              onChangeText={text => handleFieldChange(field, text)}
            />
          </View>
        );
      case 'boolean':
        return (
          <View key={field.key} style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{field.label}</Text>
            <Switch value={!!value} onValueChange={val => handleFieldChange(field, val)} />
          </View>
        );
      case 'select':
        return (
          <View key={field.key} style={styles.fieldWrapper}>
            <Text style={styles.label}>{field.label}</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={value} onValueChange={itemValue => handleFieldChange(field, String(itemValue))}>
                {field.options?.map(option => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
              </Picker>
            </View>
          </View>
        );
      default:
        return null;
    }
  }

  async function handleSalvar() {
    if (!formValido) {
      Alert.alert('Informacoes insuficientes', 'Descreva a irregularidade encontrada.');
      return;
    }

    const itensMarcados = Object.entries(checklistState)
      .filter(([, marcado]) => marcado)
      .map(([item]) => item);

    const camposDinamicosResumo = formSections
      .flatMap(section =>
      section.fields
          .map(field => {
            const rawValue = formValues[field.key];
            if (field.type === 'boolean') {
              return `${field.label}: ${rawValue ? 'Sim' : 'Nao'}`;
            }
            if (!rawValue) return null;
            return `${field.label}: ${rawValue}`;
          })
          .filter(Boolean),
      )
      .filter(Boolean)
      .join('\n');

    const observacoesComChecklist = [
      observacoes.trim(),
      itensMarcados.length ? `Checklist marcado:\n${itensMarcados.map(item => `- ${item}`).join('\n')}` : '',
      camposDinamicosResumo ? `Dados adicionais do formulario:\n${camposDinamicosResumo}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')
      .trim();

    const empresaIdValue = (() => {
      if (empresaSelecionada) return empresaSelecionada.id;
      if (!empresaId) return null;
      const parsed = Number(empresaId);
      return Number.isNaN(parsed) ? null : parsed;
    })();

    try {
      setEnviando(true);
      await addAutoDraft({
        uuid: uuidv4(),
        empresa_id: empresaIdValue,
        tipo,
        descricao,
        observacoes: observacoesComChecklist || undefined,
        origem,
        emitido_em: emitidoEm,
      });
      Alert.alert('Auto registrado', 'O auto foi salvo e sera sincronizado assim que possivel.');
      setDescricao('');
      setObservacoes('');
      setEmpresaId('');
      setChecklistState({});
    } catch (error: any) {
      Alert.alert('Erro ao enviar', error?.message || 'Nao foi possivel registrar o auto.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.timestamp}>Emissao automatica: {DateTime.fromISO(emitidoEm).toFormat('dd/MM/yyyy HH:mm')}</Text>

      <Text style={styles.title}>Novo Auto</Text>
      <Text style={styles.subtitle}>Preencha as informacoes conforme o formulario oficial.</Text>

      <Text style={styles.section}>Tipo de documento</Text>
      <View style={styles.pickerWrapper}>
        <Picker selectedValue={tipo} onValueChange={itemValue => setTipo(String(itemValue))}>
          {Object.entries({
            BANCO: 'Auto de Constatacao - Banco',
            SUPERMERCADO: 'Auto de Constatacao - Supermercado',
            POSTO: 'Auto de Constatacao - Posto',
            DIVERSOS: 'Auto de Constatacao - Diversos',
            INUTILIZACAO: 'Auto de Inutilizacao / Apreensao',
          }).map(([value, label]) => (
            <Picker.Item key={value} label={label} value={value} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Empresa (ID opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="ID interno da empresa"
        keyboardType="numeric"
        value={empresaId}
        onChangeText={setEmpresaId}
      />

      {empresaSelecionada ? (
        <View style={styles.empresaCard}>
          <Text style={styles.empresaTitulo}>{empresaSelecionada.razao_social}</Text>
          {empresaSelecionada.nome_fantasia ? (
            <Text style={styles.empresaLinha}>Fantasia: {empresaSelecionada.nome_fantasia}</Text>
          ) : null}
          {empresaSelecionada.cnpj ? (
            <Text style={styles.empresaLinha}>CNPJ: {empresaSelecionada.cnpj}</Text>
          ) : null}
          {empresaSelecionada.endereco ? (
            <Text style={styles.empresaLinha}>{empresaSelecionada.endereco}</Text>
          ) : null}
          {empresaSelecionada.telefone ? (
            <Text style={styles.empresaLinha}>Telefone: {empresaSelecionada.telefone}</Text>
          ) : null}
        </View>
      ) : empresaId ? (
        <Text style={styles.alertaEmpresa}>Empresa nao encontrada entre os dados sincronizados.</Text>
      ) : null}

      <Text style={styles.label}>Descricao da fiscalizacao</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        multiline
        numberOfLines={4}
        value={descricao}
        onChangeText={setDescricao}
        placeholder="Relate as irregularidades encontradas de forma clara"
      />

      <Text style={styles.label}>Observacoes adicionais</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        multiline
        numberOfLines={3}
        value={observacoes}
        onChangeText={setObservacoes}
      />

      {checklistItens.length > 0 ? (
        <>
          <Text style={styles.section}>Itens de checklist</Text>
          <View style={styles.checklistContainer}>
            {checklistItens.map((item, index) => (
              <View
                key={item}
                style={[
                  styles.checklistItem,
                  index === checklistItens.length - 1 ? styles.checklistItemLast : undefined,
                ]}
              >
                <Text style={styles.checklistLabel}>{item}</Text>
                <Switch value={!!checklistState[item]} onValueChange={value => handleToggleChecklist(item, value)} />
              </View>
            ))}
          </View>
        </>
      ) : null}

      {formSections.map(section => (
        <View key={section.title} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.description ? <Text style={styles.sectionDescription}>{section.description}</Text> : null}
          <View style={styles.sectionBody}>
            {section.fields.map(field => (
              <View key={field.key}>{renderField(field)}</View>
            ))}
          </View>
        </View>
      ))}

      <Text style={styles.section}>Origem da acao</Text>
      <View style={styles.pickerWrapper}>
        <Picker selectedValue={origem} onValueChange={itemValue => setOrigem(String(itemValue))}>
          {origens.map(item => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>

      <Text style={styles.helper}>Os campos de data e hora sao preenchidos automaticamente. Ajustes requerem justificativa no orgao.</Text>

      <Pressable
        style={[styles.button, !formValido || enviando ? styles.buttonDisabled : undefined]}
        disabled={!formValido || enviando}
        onPress={handleSalvar}
      >
        <Text style={styles.buttonText}>{enviando ? 'Enviando...' : 'Salvar auto'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#0F172A',
    paddingBottom: 48,
  },
  timestamp: {
    color: '#98A2B3',
    fontSize: 12,
    textAlign: 'right',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F2F4F7',
  },
  subtitle: {
    fontSize: 14,
    color: '#D0D5DD',
  },
  section: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#E4E7EC',
  },
  label: {
    fontSize: 14,
    color: '#D0D5DD',
    marginTop: 12,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    color: '#F8FAFC',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  pickerWrapper: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
  },
  helper: {
    fontSize: 12,
    color: '#94A3B8',
  },
  button: {
    marginTop: 12,
    backgroundColor: '#475467',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  empresaCard: {
    backgroundColor: '#1E2B45',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  empresaTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F2F4F7',
  },
  empresaLinha: {
    color: '#E4E7EC',
    fontSize: 13,
    marginTop: 2,
  },
  alertaEmpresa: {
    color: '#F79009',
    fontSize: 12,
    marginTop: 4,
  },
  checklistContainer: {
    backgroundColor: '#1E2B45',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  checklistItemLast: {
    marginBottom: 0,
  },
  checklistLabel: {
    flex: 1,
    color: '#E4E7EC',
    fontSize: 14,
    marginRight: 12,
  },
  sectionCard: {
    backgroundColor: '#13203B',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F2F4F7',
  },
  sectionDescription: {
    fontSize: 13,
    color: '#98A2B3',
    marginTop: 4,
  },
  sectionBody: {
    marginTop: 12,
  },
  fieldWrapper: {
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
    gap: 12,
  },
  toggleLabel: {
    flex: 1,
    color: '#E4E7EC',
    fontSize: 14,
    marginRight: 12,
  },
});
