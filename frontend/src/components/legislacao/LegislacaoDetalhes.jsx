import React, { useState, useEffect } from 'react';
import {
  BookOpenIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ScaleIcon,
  TagIcon,
  EyeIcon,
  PrinterIcon,
  ShareIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  LinkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { HeartIcon, BookmarkIcon } from '@heroicons/react/24/solid';

const LegislacaoDetalhes = ({ lei, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('conteudo');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFullText, setShowFullText] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [relatedLaws, setRelatedLaws] = useState([]);
  const [amendments, setAmendments] = useState([]);
  const [jurisprudence, setJurisprudence] = useState([]);

  useEffect(() => {
    if (lei && isOpen) {
      // Simular carregamento de dados relacionados
      setRelatedLaws([
        {
          id: 1,
          numero: '8078',
          ano: 1990,
          titulo: 'Código de Defesa do Consumidor',
          tipo: 'LEI',
          relacao: 'Relacionada'
        },
        {
          id: 2,
          numero: '12529',
          ano: 2011,
          titulo: 'Sistema Nacional de Defesa do Consumidor',
          tipo: 'LEI',
          relacao: 'Complementar'
        }
      ]);

      setAmendments([
        {
          id: 1,
          numero: '14181',
          ano: 2021,
          titulo: 'Altera o Marco Civil da Internet',
          tipo: 'alteracao',
          data: '2021-07-01',
          artigos: ['Art. 7º', 'Art. 15']
        }
      ]);

      setJurisprudence([
        {
          id: 1,
          tribunal: 'STJ',
          numero: 'REsp 1.234.567',
          ementa: 'Relação de consumo. Aplicação do CDC...',
          data: '2024-03-15',
          relevancia: 'alta'
        }
      ]);
    }
  }, [lei, isOpen]);

  if (!isOpen || !lei) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'VIGENTE':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'REVOGADA':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'SUSPENSA':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'VIGENTE': return 'bg-green-100 text-green-800';
      case 'REVOGADA': return 'bg-red-100 text-red-800';
      case 'SUSPENSA': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'LEI': return <ScaleIcon className="h-5 w-5" />;
      case 'DECRETO': return <DocumentTextIcon className="h-5 w-5" />;
      case 'PORTARIA': return <BuildingOfficeIcon className="h-5 w-5" />;
      default: return <BookOpenIcon className="h-5 w-5" />;
    }
  };

  const highlightSearchTerm = (text) => {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: lei.titulo,
          text: lei.ementa,
          url: window.location.href
        });
      } catch (error) {
        console.log('Erro ao compartilhar:', error);
      }
    } else {
      // Fallback - copiar para clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('lei-content');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${lei.titulo}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .content { line-height: 1.6; }
            .article { margin: 20px 0; }
            h1 { color: #333; }
            h2 { color: #666; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${lei.titulo}</h1>
            <p><strong>Número:</strong> ${lei.numero}/${lei.ano}</p>
            <p><strong>Data de Publicação:</strong> ${new Date(lei.data_publicacao).toLocaleDateString()}</p>
          </div>
          <div class="content">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-6xl">
          <div className="h-full flex flex-col bg-white shadow-xl">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-white">
                  {getTipoIcon(lei.tipo)}
                  <div className="ml-3">
                    <h2 className="text-xl font-semibold">
                      {lei.tipo} Nº {lei.numero}/{lei.ano}
                    </h2>
                    <p className="text-blue-100 text-sm">{lei.titulo}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(lei.status)}`}>
                    {getStatusIcon(lei.status)}
                    <span className="ml-1">{lei.status}</span>
                  </span>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setIsFavorite(!isFavorite)}
                      className="p-2 text-white hover:bg-blue-500 rounded"
                      title="Favoritar"
                    >
                      <HeartIcon className={`h-5 w-5 ${isFavorite ? 'text-red-300' : ''}`} />
                    </button>
                    
                    <button
                      onClick={() => setIsBookmarked(!isBookmarked)}
                      className="p-2 text-white hover:bg-blue-500 rounded"
                      title="Salvar"
                    >
                      <BookmarkIcon className={`h-5 w-5 ${isBookmarked ? 'text-yellow-300' : ''}`} />
                    </button>
                    
                    <button
                      onClick={handleShare}
                      className="p-2 text-white hover:bg-blue-500 rounded"
                      title="Compartilhar"
                    >
                      <ShareIcon className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={handlePrint}
                      className="p-2 text-white hover:bg-blue-500 rounded"
                      title="Imprimir"
                    >
                      <PrinterIcon className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={onClose}
                      className="p-2 text-white hover:bg-blue-500 rounded"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              {[
                { id: 'conteudo', label: 'Conteúdo', icon: DocumentTextIcon },
                { id: 'metadados', label: 'Metadados', icon: TagIcon },
                { id: 'relacionadas', label: 'Leis Relacionadas', icon: LinkIcon },
                { id: 'alteracoes', label: 'Alterações', icon: ClockIcon },
                { id: 'jurisprudencia', label: 'Jurisprudência', icon: ScaleIcon }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              
              {/* Conteúdo da Lei */}
              {activeTab === 'conteudo' && (
                <div className="p-6">
                  {/* Busca no texto */}
                  <div className="mb-6 flex items-center space-x-4">
                    <div className="flex-1 relative">
                      <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar no texto da lei..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => setShowFullText(!showFullText)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      {showFullText ? 'Resumir' : 'Texto Completo'}
                    </button>
                  </div>

                  <div id="lei-content" className="prose prose-lg max-w-none">
                    {/* Ementa */}
                    <div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-400">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">Ementa</h3>
                      <p 
                        className="text-blue-800"
                        dangerouslySetInnerHTML={{ __html: highlightSearchTerm(lei.ementa) }}
                      />
                    </div>

                    {/* Texto da Lei */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-gray-900">Texto da Lei</h3>
                      
                      {showFullText ? (
                        <div className="space-y-4">
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Art. 1º</h4>
                            <p dangerouslySetInnerHTML={{ __html: highlightSearchTerm('Esta lei estabelece normas de proteção e defesa do consumidor, de ordem pública e interesse social, nos termos dos arts. 5º, inciso XXXII, 170, inciso V da Constituição Federal e art. 48 de suas Disposições Transitórias.') }} />
                          </div>
                          
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Art. 2º</h4>
                            <p dangerouslySetInnerHTML={{ __html: highlightSearchTerm('Consumidor é toda pessoa física ou jurídica que adquire ou utiliza produto ou serviço como destinatário final.') }} />
                            <p className="mt-2 text-sm text-gray-600">
                              Parágrafo único. Equipara-se a consumidor a coletividade de pessoas, ainda que indetermináveis, que haja intervindo nas relações de consumo.
                            </p>
                          </div>
                          
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Art. 3º</h4>
                            <p dangerouslySetInnerHTML={{ __html: highlightSearchTerm('Fornecedor é toda pessoa física ou jurídica, pública ou privada, nacional ou estrangeira, bem como os entes despersonalizados, que desenvolvem atividade de produção, montagem, criação, construção, transformação, importação, exportação, distribuição ou comercialização de produtos ou prestação de serviços.') }} />
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-gray-700">
                            Esta lei estabelece normas de proteção e defesa do consumidor... 
                            <span className="text-blue-600 cursor-pointer" onClick={() => setShowFullText(true)}>
                              [Clique para ver o texto completo]
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Metadados */}
              {activeTab === 'metadados' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Informações Básicas */}
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                        Informações Básicas
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Número:</span>
                          <span className="font-medium">{lei.numero}/{lei.ano}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tipo:</span>
                          <span className="font-medium">{lei.tipo}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(lei.status)}`}>
                            {lei.status}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Data de Publicação:</span>
                          <span className="font-medium">
                            {new Date(lei.data_publicacao).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Categoria:</span>
                          <span className="font-medium">{lei.categoria}</span>
                        </div>
                      </div>
                    </div>

                    {/* Estatísticas */}
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <EyeIcon className="h-5 w-5 mr-2 text-green-600" />
                        Estatísticas
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Visualizações:</span>
                          <span className="font-medium">{lei.visualizacoes?.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Downloads:</span>
                          <span className="font-medium">1,234</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Citações:</span>
                          <span className="font-medium">856</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Última Atualização:</span>
                          <span className="font-medium">
                            {new Date().toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Publicação */}
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <BuildingOfficeIcon className="h-5 w-5 mr-2 text-purple-600" />
                        Publicação
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Órgão:</span>
                          <span className="font-medium">Congresso Nacional</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Autor:</span>
                          <span className="font-medium">Executivo Federal</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Diário Oficial:</span>
                          <span className="font-medium">DOU Seção 1</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Página:</span>
                          <span className="font-medium">45-52</span>
                        </div>
                      </div>
                    </div>

                    {/* Downloads */}
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <DocumentArrowDownIcon className="h-5 w-5 mr-2 text-orange-600" />
                        Downloads
                      </h3>
                      
                      <div className="space-y-3">
                        <button className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <span>PDF Oficial</span>
                          <DocumentArrowDownIcon className="h-4 w-4" />
                        </button>
                        
                        <button className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <span>Texto Integral</span>
                          <DocumentArrowDownIcon className="h-4 w-4" />
                        </button>
                        
                        <button className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <span>Versão Anotada</span>
                          <DocumentArrowDownIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Leis Relacionadas */}
              {activeTab === 'relacionadas' && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-6">Legislação Relacionada</h3>
                  
                  <div className="space-y-4">
                    {relatedLaws.map(related => (
                      <div key={related.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-blue-600">
                              {related.tipo} Nº {related.numero}/{related.ano}
                            </p>
                            <p className="text-gray-900 mt-1">{related.titulo}</p>
                            <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {related.relacao}
                            </span>
                          </div>
                          <button className="text-blue-600 hover:text-blue-800">
                            <EyeIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alterações */}
              {activeTab === 'alteracoes' && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-6">Histórico de Alterações</h3>
                  
                  <div className="space-y-4">
                    {amendments.map(amendment => (
                      <div key={amendment.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-blue-600">
                              {amendment.tipo.toUpperCase()} Nº {amendment.numero}/{amendment.ano}
                            </p>
                            <p className="text-gray-900 mt-1">{amendment.titulo}</p>
                            <p className="text-sm text-gray-600 mt-2">
                              Artigos alterados: {amendment.artigos.join(', ')}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              Data: {new Date(amendment.data).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Jurisprudência */}
              {activeTab === 'jurisprudencia' && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-6">Jurisprudência Relacionada</h3>
                  
                  <div className="space-y-4">
                    {jurisprudence.map(case_ => (
                      <div key={case_.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-blue-600">{case_.tribunal}</span>
                              <span className="text-gray-600">{case_.numero}</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                case_.relevancia === 'alta' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {case_.relevancia === 'alta' ? 'Alta Relevância' : 'Média Relevância'}
                              </span>
                            </div>
                            <p className="text-gray-900 mt-2">{case_.ementa}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              Data: {new Date(case_.data).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegislacaoDetalhes;