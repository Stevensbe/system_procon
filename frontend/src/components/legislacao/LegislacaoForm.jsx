import React, { useState, useRef } from 'react';
import {
  DocumentTextIcon,
  CalendarDaysIcon,
  TagIcon,
  BuildingOfficeIcon,
  UserIcon,
  BookOpenIcon,
  CloudArrowUpIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const LegislacaoForm = ({ lei = null, isOpen, onClose, onSave }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Dados básicos
    tipo: lei?.tipo || '',
    numero: lei?.numero || '',
    ano: lei?.ano || new Date().getFullYear(),
    titulo: lei?.titulo || '',
    ementa: lei?.ementa || '',
    categoria: lei?.categoria || '',
    subcategoria: lei?.subcategoria || '',
    
    // Dados de publicação
    data_publicacao: lei?.data_publicacao || '',
    data_vigencia: lei?.data_vigencia || '',
    orgao_publicador: lei?.orgao_publicador || '',
    diario_oficial: lei?.diario_oficial || '',
    pagina_inicio: lei?.pagina_inicio || '',
    pagina_fim: lei?.pagina_fim || '',
    
    // Autoria e tramitação
    autor: lei?.autor || '',
    relator: lei?.relator || '',
    origem: lei?.origem || '',
    processo_legislativo: lei?.processo_legislativo || '',
    
    // Conteúdo
    texto_integral: lei?.texto_integral || '',
    observacoes: lei?.observacoes || '',
    palavras_chave: lei?.palavras_chave || [],
    
    // Status e controle
    status: lei?.status || 'VIGENTE',
    lei_revogadora: lei?.lei_revogadora || '',
    data_revogacao: lei?.data_revogacao || '',
    motivo_revogacao: lei?.motivo_revogacao || '',
    
    // Relacionamentos
    leis_relacionadas: lei?.leis_relacionadas || [],
    leis_alteradas: lei?.leis_alteradas || [],
    
    // Anexos
    anexos: lei?.anexos || []
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const fileInputRef = useRef(null);

  const steps = [
    { id: 1, title: 'Dados Básicos', icon: DocumentTextIcon },
    { id: 2, title: 'Publicação', icon: CalendarDaysIcon },
    { id: 3, title: 'Autoria', icon: UserIcon },
    { id: 4, title: 'Conteúdo', icon: BookOpenIcon },
    { id: 5, title: 'Relacionamentos', icon: TagIcon },
    { id: 6, title: 'Finalização', icon: CheckIcon }
  ];

  const tiposLegislacao = [
    { value: 'LEI', label: 'Lei' },
    { value: 'DECRETO', label: 'Decreto' },
    { value: 'PORTARIA', label: 'Portaria' },
    { value: 'RESOLUCAO', label: 'Resolução' },
    { value: 'INSTRUCAO_NORMATIVA', label: 'Instrução Normativa' },
    { value: 'MEDIDA_PROVISORIA', label: 'Medida Provisória' }
  ];

  const categorias = [
    { value: 'DIREITO_CONSUMIDOR', label: 'Direito do Consumidor' },
    { value: 'DEFESA_CONCORRENCIA', label: 'Defesa da Concorrência' },
    { value: 'REGULACAO_MERCADO', label: 'Regulação de Mercado' },
    { value: 'TELECOMUNICACOES', label: 'Telecomunicações' },
    { value: 'ENERGIA', label: 'Energia' },
    { value: 'TRANSPORTE', label: 'Transporte' },
    { value: 'SAUDE', label: 'Saúde' },
    { value: 'EDUCACAO', label: 'Educação' },
    { value: 'MEIO_AMBIENTE', label: 'Meio Ambiente' }
  ];

  const statusOptions = [
    { value: 'VIGENTE', label: 'Vigente', color: 'green' },
    { value: 'REVOGADA', label: 'Revogada', color: 'red' },
    { value: 'SUSPENSA', label: 'Suspensa', color: 'yellow' },
    { value: 'EM_TRAMITACAO', label: 'Em Tramitação', color: 'blue' }
  ];

  if (!isOpen) return null;

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

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.tipo) newErrors.tipo = 'Tipo é obrigatório';
        if (!formData.numero) newErrors.numero = 'Número é obrigatório';
        if (!formData.ano) newErrors.ano = 'Ano é obrigatório';
        if (!formData.titulo) newErrors.titulo = 'Título é obrigatório';
        if (!formData.ementa) newErrors.ementa = 'Ementa é obrigatória';
        break;
        
      case 2:
        if (!formData.data_publicacao) newErrors.data_publicacao = 'Data de publicação é obrigatória';
        if (!formData.orgao_publicador) newErrors.orgao_publicador = 'Órgão publicador é obrigatório';
        break;
        
      case 4:
        if (!formData.texto_integral) newErrors.texto_integral = 'Texto integral é obrigatório';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !formData.palavras_chave.includes(newKeyword.trim())) {
      handleInputChange('palavras_chave', [...formData.palavras_chave, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword) => {
    handleInputChange('palavras_chave', formData.palavras_chave.filter(k => k !== keyword));
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));
    
    handleInputChange('anexos', [...formData.anexos, ...newFiles]);
  };

  const handleRemoveFile = (fileId) => {
    handleInputChange('anexos', formData.anexos.filter(f => f.id !== fileId));
  };

  const handleSave = async () => {
    if (!validateStep(currentStep)) return;
    
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Dados Básicos da Legislação</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Legislação *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => handleInputChange('tipo', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.tipo ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione o tipo</option>
                  {tiposLegislacao.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                  ))}
                </select>
                {errors.tipo && <p className="text-red-500 text-xs mt-1">{errors.tipo}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número *
                </label>
                <input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => handleInputChange('numero', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.numero ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: 8078"
                />
                {errors.numero && <p className="text-red-500 text-xs mt-1">{errors.numero}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ano *
                </label>
                <input
                  type="number"
                  value={formData.ano}
                  onChange={(e) => handleInputChange('ano', parseInt(e.target.value))}
                  min="1800"
                  max={new Date().getFullYear() + 5}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.ano ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.ano && <p className="text-red-500 text-xs mt-1">{errors.ano}</p>}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título da Legislação *
              </label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => handleInputChange('titulo', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.titulo ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Código de Defesa do Consumidor"
              />
              {errors.titulo && <p className="text-red-500 text-xs mt-1">{errors.titulo}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ementa *
              </label>
              <textarea
                value={formData.ementa}
                onChange={(e) => handleInputChange('ementa', e.target.value)}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.ementa ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Descreva o objeto e finalidade da legislação..."
              />
              {errors.ementa && <p className="text-red-500 text-xs mt-1">{errors.ementa}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => handleInputChange('categoria', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione a categoria</option>
                  {categorias.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Dados de Publicação</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Publicação *
                </label>
                <input
                  type="date"
                  value={formData.data_publicacao}
                  onChange={(e) => handleInputChange('data_publicacao', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.data_publicacao ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.data_publicacao && <p className="text-red-500 text-xs mt-1">{errors.data_publicacao}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Vigência
                </label>
                <input
                  type="date"
                  value={formData.data_vigencia}
                  onChange={(e) => handleInputChange('data_vigencia', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Órgão Publicador *
              </label>
              <input
                type="text"
                value={formData.orgao_publicador}
                onChange={(e) => handleInputChange('orgao_publicador', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.orgao_publicador ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Presidência da República"
              />
              {errors.orgao_publicador && <p className="text-red-500 text-xs mt-1">{errors.orgao_publicador}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diário Oficial
                </label>
                <input
                  type="text"
                  value={formData.diario_oficial}
                  onChange={(e) => handleInputChange('diario_oficial', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: DOU Seção 1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Página Inicial
                </label>
                <input
                  type="text"
                  value={formData.pagina_inicio}
                  onChange={(e) => handleInputChange('pagina_inicio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Página Final
                </label>
                <input
                  type="text"
                  value={formData.pagina_fim}
                  onChange={(e) => handleInputChange('pagina_fim', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Autoria e Tramitação</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Autor
                </label>
                <input
                  type="text"
                  value={formData.autor}
                  onChange={(e) => handleInputChange('autor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Deputado João Silva"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relator
                </label>
                <input
                  type="text"
                  value={formData.relator}
                  onChange={(e) => handleInputChange('relator', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Origem
                </label>
                <select
                  value={formData.origem}
                  onChange={(e) => handleInputChange('origem', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione a origem</option>
                  <option value="EXECUTIVO">Poder Executivo</option>
                  <option value="LEGISLATIVO">Poder Legislativo</option>
                  <option value="JUDICIARIO">Poder Judiciário</option>
                  <option value="MINISTERIO_PUBLICO">Ministério Público</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Processo Legislativo
                </label>
                <input
                  type="text"
                  value={formData.processo_legislativo}
                  onChange={(e) => handleInputChange('processo_legislativo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: PL 1234/2024"
                />
              </div>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Conteúdo da Legislação</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texto Integral *
              </label>
              <textarea
                value={formData.texto_integral}
                onChange={(e) => handleInputChange('texto_integral', e.target.value)}
                rows={12}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                  errors.texto_integral ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Digite ou cole o texto completo da legislação..."
              />
              {errors.texto_integral && <p className="text-red-500 text-xs mt-1">{errors.texto_integral}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Palavras-chave
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Adicionar palavra-chave"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.palavras_chave.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Observações adicionais sobre a legislação..."
              />
            </div>
            
            {/* Upload de Anexos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anexos
              </label>
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400"
              >
                <CloudArrowUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">Clique para upload ou arraste arquivos aqui</p>
                <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX (máx. 10MB)</p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx"
                className="hidden"
              />
              
              {formData.anexos.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.anexos.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <DocumentArrowDownIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Relacionamentos</h3>
            
            {formData.status === 'REVOGADA' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Dados de Revogação</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">
                      Lei Revogadora
                    </label>
                    <input
                      type="text"
                      value={formData.lei_revogadora}
                      onChange={(e) => handleInputChange('lei_revogadora', e.target.value)}
                      className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Ex: Lei 12345/2023"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">
                      Data de Revogação
                    </label>
                    <input
                      type="date"
                      value={formData.data_revogacao}
                      onChange={(e) => handleInputChange('data_revogacao', e.target.value)}
                      className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-red-700 mb-1">
                    Motivo da Revogação
                  </label>
                  <textarea
                    value={formData.motivo_revogacao}
                    onChange={(e) => handleInputChange('motivo_revogacao', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Descreva o motivo da revogação..."
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Legislação Relacionada
              </label>
              <p className="text-sm text-gray-500 mb-4">
                Adicione leis, decretos ou normas que se relacionam com esta legislação.
              </p>
              
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-center text-gray-600">
                  Sistema de relacionamento será implementado na próxima versão.
                </p>
              </div>
            </div>
          </div>
        );
        
      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Revisão e Finalização</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Resumo da Legislação</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Tipo:</strong> {formData.tipo} Nº {formData.numero}/{formData.ano}</p>
                <p><strong>Título:</strong> {formData.titulo}</p>
                <p><strong>Status:</strong> {formData.status}</p>
                <p><strong>Categoria:</strong> {formData.categoria}</p>
                <p><strong>Data de Publicação:</strong> {formData.data_publicacao}</p>
                <p><strong>Palavras-chave:</strong> {formData.palavras_chave.join(', ') || 'Nenhuma'}</p>
                <p><strong>Anexos:</strong> {formData.anexos.length} arquivo(s)</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="preview"
                checked={previewMode}
                onChange={(e) => setPreviewMode(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="preview" className="text-sm text-gray-700">
                Visualizar como será exibida no sistema
              </label>
            </div>
            
            {previewMode && (
              <div className="border rounded-lg p-4 bg-white">
                <div className="flex items-center space-x-2 mb-3">
                  <BookOpenIcon className="h-6 w-6 text-blue-600" />
                  <h4 className="text-lg font-semibold text-blue-600">
                    {formData.tipo} Nº {formData.numero}/{formData.ano}
                  </h4>
                </div>
                
                <h5 className="font-medium text-gray-900 mb-2">{formData.titulo}</h5>
                <p className="text-sm text-gray-600 mb-3">{formData.ementa}</p>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Publicada em: {formData.data_publicacao}</span>
                  <span>•</span>
                  <span>Status: {formData.status}</span>
                  {formData.categoria && (
                    <>
                      <span>•</span>
                      <span>{formData.categoria}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-full flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {lei ? 'Editar Legislação' : 'Nova Legislação'}
              </h2>
              <p className="text-sm text-gray-600">
                Passo {currentStep} de {steps.length}: {steps.find(s => s.id === currentStep)?.title}
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between p-6 bg-gray-50 border-b">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckIcon className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div
                      className={`w-12 h-1 mx-2 ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderStepContent()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            
            <div className="flex space-x-3">
              {currentStep === steps.length ? (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Legislação'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Próximo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegislacaoForm;