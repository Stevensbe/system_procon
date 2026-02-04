import React, { useState, useEffect } from 'react';
import { 
  DocumentCheckIcon,
  ScaleIcon,
  BookOpenIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  CalendarDaysIcon,
  PaperClipIcon,
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import analiseJuridicaService from '../../services/analiseJuridicaService';

const ParecerForm = ({ recurso, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [formData, setFormData] = useState({
    tipo_parecer: 'DEFINITIVO',
    conclusao: '',
    relatório: '',
    fundamentacao: '',
    base_legal: '',
    dispositivo: '',
    observacoes: '',
    jurisprudencia: '',
    doutrina: '',
    anexos: []
  });
  const [errors, setErrors] = useState({});
  const [modelos, setModelos] = useState([]);
  const [jurisprudenciasSugeridas, setJurisprudenciasSugeridas] = useState([]);

  const etapas = [
    { numero: 1, titulo: 'Relatório', icon: DocumentCheckIcon },
    { numero: 2, titulo: 'Fundamentação', icon: ScaleIcon },
    { numero: 3, titulo: 'Base Legal', icon: BookOpenIcon },
    { numero: 4, titulo: 'Dispositivo', icon: CheckCircleIcon },
    { numero: 5, titulo: 'Revisão', icon: MagnifyingGlassIcon }
  ];

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [modelosData, jurisprudencias] = await Promise.all([
        analiseJuridicaService.listarModelosPareceres(),
        analiseJuridicaService.buscarJurisprudencias(recurso.tipo_recurso)
      ]);
      
      setModelos(modelosData.results || []);
      setJurisprudenciasSugeridas(jurisprudencias.results || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Dados simulados
      setModelos([
        { id: 1, nome: 'Parecer Padrão - Multa', categoria: 'MULTA' },
        { id: 2, nome: 'Parecer Padrão - Auto de Infração', categoria: 'AUTO_INFRACAO' }
      ]);
      
      setJurisprudenciasSugeridas([
        {
          id: 1,
          numero: 'STJ REsp 1.234.567',
          ementa: 'Consumidor. Direito de informação. Propaganda enganosa...',
          data: '2024-03-15'
        }
      ]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const novosAnexos = [];
    
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB
        setErrors(prev => ({
          ...prev,
          anexos: 'Arquivos devem ter no máximo 10MB'
        }));
        return;
      }
      
      novosAnexos.push(file);
    });
    
    setFormData(prev => ({
      ...prev,
      anexos: [...prev.anexos, ...novosAnexos]
    }));
  };

  const removerAnexo = (index) => {
    setFormData(prev => ({
      ...prev,
      anexos: prev.anexos.filter((_, i) => i !== index)
    }));
  };

  const aplicarModelo = (modelo) => {
    // Simular aplicação de modelo
    setFormData(prev => ({
      ...prev,
      relatório: `RELATÓRIO\n\nTrata-se de recurso administrativo interposto por ${recurso.requerente_nome} contra ${recurso.tipo_recurso}...\n\nOs fatos são os seguintes:\n\n[Descrever os fatos relevantes]`,
      fundamentacao: `FUNDAMENTAÇÃO JURÍDICA\n\n1. DO DIREITO APLICÁVEL\n\nO presente recurso deve ser analisado à luz das disposições do Código de Defesa do Consumidor...\n\n2. DA ANÁLISE DO CASO CONCRETO\n\n[Análise específica do caso]`,
      base_legal: 'Lei nº 8.078/90 (Código de Defesa do Consumidor), arts. 6º, 37, 39;\nDecreto nº 2.181/97;\nPortaria PROCON nº ...',
      dispositivo: `DISPOSITIVO\n\nIsto posto, com fulcro no art. [...], opina-se pelo ${formData.conclusao === 'DEFERIMENTO' ? 'DEFERIMENTO' : 'INDEFERIMENTO'} do presente recurso.`
    }));
  };

  const validarEtapa = (etapa) => {
    const novosErrors = {};
    
    switch (etapa) {
      case 1: // Relatório
        if (!formData.relatório || formData.relatório.length < 50) {
          novosErrors.relatório = 'Relatório deve ter pelo menos 50 caracteres';
        }
        break;
      case 2: // Fundamentação
        if (!formData.fundamentacao || formData.fundamentacao.length < 100) {
          novosErrors.fundamentacao = 'Fundamentação deve ter pelo menos 100 caracteres';
        }
        break;
      case 3: // Base Legal
        if (!formData.base_legal) {
          novosErrors.base_legal = 'Base legal é obrigatória';
        }
        break;
      case 4: // Dispositivo
        if (!formData.conclusao) {
          novosErrors.conclusao = 'Conclusão é obrigatória';
        }
        if (!formData.dispositivo) {
          novosErrors.dispositivo = 'Dispositivo é obrigatório';
        }
        break;
    }
    
    setErrors(novosErrors);
    return Object.keys(novosErrors).length === 0;
  };

  const proximaEtapa = () => {
    if (validarEtapa(etapaAtual)) {
      setEtapaAtual(prev => Math.min(prev + 1, etapas.length));
    }
  };

  const etapaAnterior = () => {
    setEtapaAtual(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validarEtapa(4)) return;
    
    setLoading(true);
    try {
      const parecer = await analiseJuridicaService.emitirParecer(recurso.id, formData);
      onSuccess && onSuccess(parecer);
    } catch (error) {
      console.error('Erro ao emitir parecer:', error);
      setErrors({
        geral: 'Erro ao emitir parecer. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-6xl mx-auto">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <DocumentCheckIcon className="h-6 w-6 mr-2 text-blue-600" />
              Emitir Parecer Jurídico
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Recurso: {analiseJuridicaService.formatarNumeroRecurso(recurso.numero_recurso)}
            </p>
            <p className="text-sm text-gray-600">
              Requerente: {recurso.requerente_nome}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500">Etapa</p>
            <p className="text-2xl font-bold text-blue-600">{etapaAtual}/5</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {etapas.map((etapa, index) => {
            const Icon = etapa.icon;
            const isAtiva = etapaAtual === etapa.numero;
            const isConcluida = etapaAtual > etapa.numero;
            
            return (
              <div key={etapa.numero} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isConcluida
                      ? 'bg-green-500 border-green-500 text-white'
                      : isAtiva
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    isAtiva ? 'text-blue-600' : isConcluida ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {etapa.titulo}
                  </p>
                </div>
                
                {index < etapas.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    isConcluida ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6">
        {/* Erro Geral */}
        {errors.geral && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{errors.geral}</p>
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 1: RELATÓRIO */}
        {etapaAtual === 1 && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Relatório do Caso</h4>
              <p className="text-sm text-gray-600 mb-4">
                Descreva os fatos relevantes e o histórico do processo de forma objetiva e cronológica.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Parecer *
                  </label>
                  <select
                    value={formData.tipo_parecer}
                    onChange={(e) => handleInputChange('tipo_parecer', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PRELIMINAR">Parecer Preliminar</option>
                    <option value="DEFINITIVO">Parecer Definitivo</option>
                    <option value="COMPLEMENTAR">Parecer Complementar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relatório dos Fatos *
                  </label>
                  <textarea
                    value={formData.relatório}
                    onChange={(e) => handleInputChange('relatório', e.target.value)}
                    rows={8}
                    placeholder="Descreva cronologicamente os fatos que deram origem ao processo..."
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.relatório ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.relatório && (
                    <p className="text-sm text-red-600 mt-1">{errors.relatório}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.relatório.length} caracteres (mínimo 50)
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Modelos Disponíveis</h5>
                  <div className="space-y-2">
                    {modelos.filter(m => m.categoria === recurso.tipo_recurso).map(modelo => (
                      <button
                        key={modelo.id}
                        onClick={() => aplicarModelo(modelo)}
                        className="w-full text-left px-3 py-2 border border-gray-200 rounded-md hover:bg-gray-50 text-sm"
                      >
                        {modelo.nome}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-blue-800 mb-2">Dados do Recurso</h5>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p><strong>Número:</strong> {recurso.numero_recurso}</p>
                    <p><strong>Tipo:</strong> {recurso.tipo_recurso}</p>
                    <p><strong>Requerente:</strong> {recurso.requerente_nome}</p>
                    <p><strong>Data:</strong> {new Date(recurso.data_abertura).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 2: FUNDAMENTAÇÃO */}
        {etapaAtual === 2 && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Fundamentação Jurídica</h4>
              <p className="text-sm text-gray-600 mb-4">
                Apresente a análise jurídica detalhada, citando doutrina e jurisprudência aplicáveis.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fundamentação Jurídica *
                  </label>
                  <textarea
                    value={formData.fundamentacao}
                    onChange={(e) => handleInputChange('fundamentacao', e.target.value)}
                    rows={10}
                    placeholder="Desenvolva a análise jurídica do caso, abordando os aspectos legais relevantes..."
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.fundamentacao ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.fundamentacao && (
                    <p className="text-sm text-red-600 mt-1">{errors.fundamentacao}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.fundamentacao.length} caracteres (mínimo 100)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jurisprudência Citada
                  </label>
                  <textarea
                    value={formData.jurisprudencia}
                    onChange={(e) => handleInputChange('jurisprudencia', e.target.value)}
                    rows={4}
                    placeholder="Cite julgados relevantes dos tribunais superiores..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doutrina Referenciada
                  </label>
                  <textarea
                    value={formData.doutrina}
                    onChange={(e) => handleInputChange('doutrina', e.target.value)}
                    rows={3}
                    placeholder="Referencie autores e obras jurídicas consultadas..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Jurisprudência Sugerida</h5>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {jurisprudenciasSugeridas.map(jurisp => (
                      <div
                        key={jurisp.id}
                        className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          const novaJurisprudencia = `${jurisp.numero}\nEmenta: ${jurisp.ementa}\nData: ${jurisp.data}\n\n`;
                          handleInputChange('jurisprudencia', formData.jurisprudencia + novaJurisprudencia);
                        }}
                      >
                        <p className="text-xs font-medium text-gray-900">{jurisp.numero}</p>
                        <p className="text-xs text-gray-600 mt-1">{jurisp.ementa.substring(0, 100)}...</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 3: BASE LEGAL */}
        {etapaAtual === 3 && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Base Legal</h4>
              <p className="text-sm text-gray-600 mb-4">
                Cite as normas legais e infralegais que fundamentam o parecer.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Legislação Aplicável *
              </label>
              <textarea
                value={formData.base_legal}
                onChange={(e) => handleInputChange('base_legal', e.target.value)}
                rows={6}
                placeholder="Liste as leis, decretos, portarias e demais normas aplicáveis..."
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.base_legal ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.base_legal && (
                <p className="text-sm text-red-600 mt-1">{errors.base_legal}</p>
              )}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Legislação Sugerida</h5>
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="font-medium text-gray-900">Lei nº 8.078/90 (CDC)</p>
                  <p className="text-gray-600">Código de Defesa do Consumidor</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Decreto nº 2.181/97</p>
                  <p className="text-gray-600">Organização SNDC</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Lei nº 9.784/99</p>
                  <p className="text-gray-600">Processo Administrativo</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">CF/88, art. 5º</p>
                  <p className="text-gray-600">Direitos Fundamentais</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 4: DISPOSITIVO */}
        {etapaAtual === 4 && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Dispositivo e Conclusão</h4>
              <p className="text-sm text-gray-600 mb-4">
                Apresente a conclusão do parecer e o dispositivo final.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conclusão do Parecer *
                </label>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { value: 'DEFERIMENTO', label: '✅ Favorável ao Deferimento', color: 'green' },
                    { value: 'INDEFERIMENTO', label: '❌ Favorável ao Indeferimento', color: 'red' },
                    { value: 'PARCIAL', label: '⚖️ Deferimento Parcial', color: 'yellow' },
                    { value: 'DILIGENCIA', label: '🔍 Necessária Diligência', color: 'blue' },
                  ].map(opcao => (
                    <label key={opcao.value} className="relative">
                      <input
                        type="radio"
                        name="conclusao"
                        value={opcao.value}
                        checked={formData.conclusao === opcao.value}
                        onChange={(e) => handleInputChange('conclusao', e.target.value)}
                        className="sr-only"
                      />
                      <div className={`border-2 rounded-lg p-3 cursor-pointer transition-colors ${
                        formData.conclusao === opcao.value
                          ? `border-${opcao.color}-500 bg-${opcao.color}-50 text-${opcao.color}-700`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <p className="text-sm font-medium">{opcao.label}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.conclusao && (
                  <p className="text-sm text-red-600 mt-1">{errors.conclusao}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dispositivo *
                </label>
                <textarea
                  value={formData.dispositivo}
                  onChange={(e) => handleInputChange('dispositivo', e.target.value)}
                  rows={4}
                  placeholder="Redija o dispositivo final do parecer..."
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.dispositivo ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.dispositivo && (
                  <p className="text-sm text-red-600 mt-1">{errors.dispositivo}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações Adicionais
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  rows={3}
                  placeholder="Observações complementares, se necessário..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 5: REVISÃO */}
        {etapaAtual === 5 && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Revisão Final</h4>
              <p className="text-sm text-gray-600 mb-4">
                Revise todas as informações antes de emitir o parecer.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-6">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Dados do Parecer</h5>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Tipo:</span>
                    <span className="ml-2 font-medium">{formData.tipo_parecer}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Conclusão:</span>
                    <span className="ml-2 font-medium">{formData.conclusao}</span>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-900 mb-2">Relatório</h5>
                <p className="text-sm text-gray-700 bg-white rounded p-3 max-h-32 overflow-y-auto">
                  {formData.relatório}
                </p>
              </div>

              <div>
                <h5 className="font-medium text-gray-900 mb-2">Fundamentação</h5>
                <p className="text-sm text-gray-700 bg-white rounded p-3 max-h-32 overflow-y-auto">
                  {formData.fundamentacao}
                </p>
              </div>

              <div>
                <h5 className="font-medium text-gray-900 mb-2">Base Legal</h5>
                <p className="text-sm text-gray-700 bg-white rounded p-3 max-h-20 overflow-y-auto">
                  {formData.base_legal}
                </p>
              </div>

              <div>
                <h5 className="font-medium text-gray-900 mb-2">Dispositivo</h5>
                <p className="text-sm text-gray-700 bg-white rounded p-3">
                  {formData.dispositivo}
                </p>
              </div>
            </div>

            {/* Anexos */}
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Anexos do Parecer</h5>
              <div className="mb-4">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Arquivos aceitos: PDF, DOC, DOCX (máximo 10MB cada)
                </p>
              </div>
              
              {formData.anexos.length > 0 && (
                <div className="space-y-2">
                  {formData.anexos.map((arquivo, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <div className="flex items-center">
                        <PaperClipIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700">{arquivo.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({(arquivo.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removerAnexo(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Botões de Navegação */}
      <div className="border-t bg-gray-50 px-6 py-4">
        <div className="flex justify-between">
          <div className="flex space-x-3">
            {etapaAtual > 1 && (
              <button
                onClick={etapaAnterior}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Anterior
              </button>
            )}
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            {etapaAtual < etapas.length ? (
              <button
                onClick={proximaEtapa}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Próxima
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Emitindo Parecer...' : 'Emitir Parecer'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParecerForm;
