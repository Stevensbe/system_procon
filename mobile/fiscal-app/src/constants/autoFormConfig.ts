export type AutoFieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'select';

export interface AutoField {
  key: string;
  label: string;
  type: AutoFieldType;
  placeholder?: string;
  options?: { label: string; value: string }[];
}

export interface AutoSection {
  title: string;
  description?: string;
  fields: AutoField[];
}

const bancoBooleanFields: AutoField[] = [
  { key: 'check_tempo_fila', label: 'Tempo de fila dentro do limite legal?', type: 'boolean' },
  { key: 'check_cartaz_filas', label: 'Cartazes sobre tempo máximo visíveis?', type: 'boolean' },
  { key: 'check_prioritario', label: 'Atendimento prioritário sinalizado/funcional?', type: 'boolean' },
  { key: 'check_senha_padrao', label: 'Senhas com identificação e horários obrigatórios?', type: 'boolean' },
  { key: 'check_profissional_libras', label: 'Profissional / recurso LIBRAS disponível?', type: 'boolean' },
  { key: 'check_caixas_funcionando', label: 'Totens/caixas suficientes em operação?', type: 'boolean' },
];

const comercianteIdentificacaoFields: AutoField[] = [
  { key: 'porte', label: 'Porte', type: 'text', placeholder: 'Ex: Médio porte' },
  { key: 'atuacao', label: 'Atuação', type: 'text', placeholder: 'Segmento principal' },
  { key: 'atividade', label: 'Atividade', type: 'text', placeholder: 'Resumo da atividade fiscalizada' },
];

const postoCombustiveisFields: AutoField[] = [
  { key: 'preco_gasolina_comum', label: 'Preço Gasolina Comum (R$/litro)', type: 'text', placeholder: 'Ex: 5,79' },
  { key: 'preco_gasolina_aditivada', label: 'Preço Gasolina Aditivada (R$/litro)', type: 'text' },
  { key: 'preco_etanol', label: 'Preço Etanol (R$/litro)', type: 'text' },
  { key: 'preco_diesel_comum', label: 'Preço Diesel Comum (R$/litro)', type: 'text' },
  { key: 'preco_diesel_s10', label: 'Preço Diesel S10 (R$/litro)', type: 'text' },
  { key: 'preco_gnv', label: 'Preço GNV (R$/m³)', type: 'text' },
];

const supermercadoIrregularidades: AutoField[] = [
  { key: 'check_produtos_vencidos', label: 'Produtos vencidos', type: 'boolean' },
  { key: 'check_embalagem_violada', label: 'Embalagens violadas', type: 'boolean' },
  { key: 'check_precificador', label: 'Precificador inoperante', type: 'boolean' },
  { key: 'check_desconto_visivel', label: 'Descontos sem visibilidade adequada', type: 'boolean' },
  { key: 'check_cdc_indisponivel', label: 'Exemplar do CDC indisponível', type: 'boolean' },
  { key: 'check_troco_substituido', label: 'Troco substituído sem consentimento', type: 'boolean' },
];

const diversosIrregularidades: AutoField[] = [
  { key: 'check_publicidade_enganosa', label: 'Publicidade enganosa/abusiva', type: 'boolean' },
  { key: 'check_precos_fora_padrao', label: 'Preços fora do padrão legal', type: 'boolean' },
  { key: 'check_afixacao_precos', label: 'Ausência de afixação de preços', type: 'boolean' },
  { key: 'check_descontos_visiveis', label: 'Descontos sem destaque', type: 'boolean' },
  { key: 'check_cdc_disponivel', label: 'CDC disponível ao consumidor?', type: 'boolean' },
  { key: 'check_troco_correspondente', label: 'Troco fornecido corretamente?', type: 'boolean' },
];

const apreensaoCampos: AutoField[] = [
  { key: 'auto_constatacao_numero', label: 'Número do auto de constatação relacionado', type: 'text' },
  { key: 'cominacao_legal', label: 'Cominação legal utilizada', type: 'textarea', placeholder: 'Informe as bases legais da apreensão' },
  { key: 'itens_detalhes', label: 'Descrição dos itens apreendidos/inutilizados', type: 'textarea', placeholder: 'Descrição, quantidade, destino...' },
  { key: 'depositario', label: 'Nome do depositário fiel', type: 'text' },
  { key: 'necessita_pericia', label: 'Necessita perícia?', type: 'boolean' },
  { key: 'justificativa_pericia', label: 'Justificativa da perícia (se marcada)', type: 'textarea' },
];

export const autoFormConfig: Record<string, AutoSection[]> = {
  BANCO: [
    {
      title: 'Identificação do estabelecimento',
      fields: comercianteIdentificacaoFields,
    },
    {
      title: 'Checklist da fiscalização',
      description: 'Marque as situações constatadas durante a visita.',
      fields: bancoBooleanFields,
    },
    {
      title: 'Observações complementares',
      fields: [
        {
          key: 'cominacao_legal',
          label: 'Cominação legal aplicada',
          type: 'textarea',
          placeholder: 'Descreva os dispositivos legais utilizados',
        },
      ],
    },
  ],
  POSTO: [
    {
      title: 'Identificação do estabelecimento',
      fields: comercianteIdentificacaoFields,
    },
    {
      title: 'Preços informados no totem',
      description: 'Registre os valores praticados na data da fiscalização.',
      fields: postoCombustiveisFields,
    },
    {
      title: 'Situação observada',
      fields: [
        { key: 'nada_consta', label: 'Sem irregularidades consumeristas', type: 'boolean' },
        {
          key: 'irregularidades_posto',
          label: 'Outras irregularidades constatadas',
          type: 'textarea',
          placeholder: 'Ex.: bombas sem lacre, publicidade irregular...',
        },
      ],
    },
  ],
  SUPERMERCADO: [
    {
      title: 'Identificação do estabelecimento',
      fields: comercianteIdentificacaoFields,
    },
    {
      title: 'Irregularidades verificadas',
      fields: supermercadoIrregularidades,
    },
    {
      title: 'Narrativa dos fatos',
      fields: [
        {
          key: 'narrativa_fatos',
          label: 'Relato detalhado',
          type: 'textarea',
          placeholder: 'Descreva os fatos observados, locais, setores, produtos, etc.',
        },
      ],
    },
  ],
  DIVERSOS: [
    {
      title: 'Identificação do estabelecimento',
      fields: comercianteIdentificacaoFields,
    },
    {
      title: 'Ocorrências consumeristas',
      fields: diversosIrregularidades,
    },
    {
      title: 'Narrativa dos fatos',
      fields: [
        {
          key: 'narrativa_fatos',
          label: 'Relato detalhado',
          type: 'textarea',
          placeholder: 'Conte a narrativa dos fatos constatados',
        },
      ],
    },
  ],
  INUTILIZACAO: [
    {
      title: 'Dados da operação',
      fields: apreensaoCampos,
    },
  ],
};

export const defaultFieldValue = (field: AutoField) => {
  switch (field.type) {
    case 'boolean':
      return false;
    case 'select':
      return field.options && field.options.length ? field.options[0].value : '';
    default:
      return '';
  }
};
