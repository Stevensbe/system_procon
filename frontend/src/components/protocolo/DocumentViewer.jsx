import React, { useState } from 'react';
import { 
  EyeIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon
} from '@heroicons/react/24/outline';

const DocumentViewer = ({ 
  documents = [], 
  onClose, 
  initialDocumentIndex = 0 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialDocumentIndex);
  const [zoom, setZoom] = useState(100);
  const [showOCR, setShowOCR] = useState(false);

  const currentDocument = documents[currentIndex];

  const nextDocument = () => {
    if (currentIndex < documents.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const previousDocument = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const increaseZoom = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const decreaseZoom = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const resetZoom = () => {
    setZoom(100);
  };

  const downloadDocument = () => {
    if (currentDocument?.url) {
      const link = document.createElement('a');
      link.href = currentDocument.url;
      link.download = currentDocument.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const printDocument = () => {
    window.print();
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('text')) return '📃';
    return '📎';
  };

  const renderDocumentContent = () => {
    if (!currentDocument) return null;

    const { type, url, name, ocrText } = currentDocument;

    if (type.includes('image')) {
      return (
        <div className="flex justify-center">
          <img
            src={url || '/placeholder-image.jpg'}
            alt={name}
            className="max-w-full max-h-full object-contain"
            style={{ transform: `scale(${zoom / 100})` }}
          />
        </div>
      );
    }

    if (type.includes('pdf')) {
      return (
        <div className="w-full h-full">
          <iframe
            src={url || '/placeholder-pdf.pdf'}
            className="w-full h-full border-0"
            title={name}
          />
        </div>
      );
    }

    if (type.includes('text')) {
      return (
        <div className="p-4 bg-white rounded-lg">
          <pre className="whitespace-pre-wrap text-sm font-mono">
            {ocrText || 'Conteúdo do documento não disponível'}
          </pre>
        </div>
      );
    }

    // Fallback para outros tipos
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <span className="text-6xl mb-4">{getFileIcon(type)}</span>
        <p className="text-lg font-medium">{name}</p>
        <p className="text-sm">Visualização não disponível para este tipo de arquivo</p>
        <button
          onClick={downloadDocument}
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
          Baixar Arquivo
        </button>
      </div>
    );
  };

  if (!currentDocument) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-gray-500">Nenhum documento selecionado</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <span className="text-2xl">{getFileIcon(currentDocument.type)}</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentDocument.name}
              </h2>
              <p className="text-sm text-gray-500">
                Documento {currentIndex + 1} de {documents.length}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={decreaseZoom}
                className="p-1 hover:bg-gray-200 rounded"
                title="Diminuir zoom"
              >
                <MagnifyingGlassMinusIcon className="w-4 h-4" />
              </button>
              <span className="px-2 text-sm font-medium">{zoom}%</span>
              <button
                onClick={increaseZoom}
                className="p-1 hover:bg-gray-200 rounded"
                title="Aumentar zoom"
              >
                <MagnifyingGlassPlusIcon className="w-4 h-4" />
              </button>
              <button
                onClick={resetZoom}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Reset
              </button>
            </div>

            {/* OCR Toggle */}
            {currentDocument.ocrText && (
              <button
                onClick={() => setShowOCR(!showOCR)}
                className={`inline-flex items-center px-3 py-1 rounded-lg text-sm ${
                  showOCR 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <MagnifyingGlassIcon className="w-4 h-4 mr-1" />
                OCR
              </button>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-1">
              <button
                onClick={downloadDocument}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                title="Baixar"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
              </button>
              <button
                onClick={printDocument}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                title="Imprimir"
              >
                <PrinterIcon className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                title="Fechar"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        {documents.length > 1 && (
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
            <button
              onClick={previousDocument}
              disabled={currentIndex === 0}
              className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Anterior
            </button>

            <div className="flex items-center space-x-2">
              {documents.map((doc, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full ${
                    index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  title={doc.name}
                />
              ))}
            </div>

            <button
              onClick={nextDocument}
              disabled={currentIndex === documents.length - 1}
              className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {showOCR && currentDocument.ocrText ? (
            <div className="flex h-full">
              {/* Document View */}
              <div className="flex-1 overflow-auto p-4">
                {renderDocumentContent()}
              </div>
              
              {/* OCR Panel */}
              <div className="w-96 border-l border-gray-200 bg-gray-50 overflow-auto">
                <div className="p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <MagnifyingGlassIcon className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-medium text-gray-900">
                      Texto Extraído (OCR)
                    </h3>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Palavras-chave detectadas:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {['protocolo', 'documento', 'solicitação', 'requerente', 'data'].map((keyword, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Texto completo:
                        </h4>
                        <div className="bg-gray-50 rounded p-3 max-h-96 overflow-auto">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                            {currentDocument.ocrText}
                          </pre>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Copiar Texto
                        </button>
                        <button className="flex-1 px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                          Buscar no Texto
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-auto p-4">
              {renderDocumentContent()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Tipo: {currentDocument.type}</span>
              <span>Tamanho: {currentDocument.size ? `${(currentDocument.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}</span>
              {currentDocument.uploadDate && (
                <span>Enviado em: {new Date(currentDocument.uploadDate).toLocaleDateString('pt-BR')}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {currentDocument.ocrText && (
                <span className="inline-flex items-center text-green-600">
                  <MagnifyingGlassIcon className="w-4 h-4 mr-1" />
                  OCR disponível
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
