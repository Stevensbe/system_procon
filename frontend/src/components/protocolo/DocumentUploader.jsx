import React, { useState, useRef } from 'react';
import { 
  DocumentArrowUpIcon,
  DocumentTextIcon,
  EyeIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import useNotification from '../../hooks/useNotification';

const DocumentUploader = ({ 
  onDocumentsUploaded, 
  maxFiles = 10, 
  maxSizeMB = 10,
  acceptedTypes = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'txt'],
  enableOCR = true 
}) => {
  const { showNotification } = useNotification();
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [processingOCR, setProcessingOCR] = useState({});
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    validateAndAddFiles(files);
  };

  const validateAndAddFiles = (files) => {
    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      // Verificar tamanho
      if (file.size > maxSizeMB * 1024 * 1024) {
        errors.push(`${file.name}: Arquivo muito grande (máximo ${maxSizeMB}MB)`);
        return;
      }

      // Verificar tipo
      const extension = file.name.split('.').pop().toLowerCase();
      if (!acceptedTypes.includes(extension)) {
        errors.push(`${file.name}: Tipo de arquivo não suportado`);
        return;
      }

      // Verificar limite de arquivos
      if (documents.length + validFiles.length >= maxFiles) {
        errors.push(`Limite de ${maxFiles} arquivos atingido`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      errors.forEach(error => showNotification(error, 'error'));
    }

    if (validFiles.length > 0) {
      addFilesToDocuments(validFiles);
    }
  };

  const addFilesToDocuments = (files) => {
    const newDocuments = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0,
      ocrText: '',
      preview: null,
      uploaded: false
    }));

    setDocuments(prev => [...prev, ...newDocuments]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    
    const files = Array.from(e.dataTransfer.files);
    validateAndAddFiles(files);
  };

  const uploadDocument = async (document) => {
    try {
      setProcessingOCR(prev => ({ ...prev, [document.id]: true }));
      
      // Simular upload progressivo
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setDocuments(prev => 
          prev.map(doc => 
            doc.id === document.id 
              ? { ...doc, progress: i }
              : doc
          )
        );
      }

      // Simular processamento OCR
      if (enableOCR && ['pdf', 'jpg', 'jpeg', 'png'].includes(document.type.split('/')[1])) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simular texto extraído do OCR
        const mockOCRText = `Texto extraído do documento ${document.name} via OCR.
        
Este é um exemplo de texto que seria extraído automaticamente do documento através do processamento de reconhecimento óptico de caracteres.

O sistema analisa o conteúdo do documento e extrai o texto para permitir buscas e indexação automática.`;
        
        setDocuments(prev => 
          prev.map(doc => 
            doc.id === document.id 
              ? { ...doc, ocrText: mockOCRText, status: 'completed' }
              : doc
          )
        );
      } else {
        setDocuments(prev => 
          prev.map(doc => 
            doc.id === document.id 
              ? { ...doc, status: 'completed' }
              : doc
          )
        );
      }

      showNotification(`${document.name} processado com sucesso`, 'success');
      
    } catch (error) {
      console.error('Erro ao processar documento:', error);
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === document.id 
            ? { ...doc, status: 'error' }
            : doc
        )
      );
      showNotification(`Erro ao processar ${document.name}`, 'error');
    } finally {
      setProcessingOCR(prev => ({ ...prev, [document.id]: false }));
    }
  };

  const uploadAllDocuments = async () => {
    if (documents.length === 0) {
      showNotification('Nenhum documento para enviar', 'warning');
      return;
    }

    setUploading(true);
    
    try {
      const pendingDocuments = documents.filter(doc => doc.status === 'pending');
      
      for (const document of pendingDocuments) {
        await uploadDocument(document);
      }

      // Notificar componente pai
      const completedDocuments = documents.filter(doc => doc.status === 'completed');
      onDocumentsUploaded && onDocumentsUploaded(completedDocuments);
      
      showNotification(`${completedDocuments.length} documentos processados com sucesso`, 'success');
      
    } catch (error) {
      console.error('Erro ao enviar documentos:', error);
      showNotification('Erro ao enviar documentos', 'error');
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = (documentId) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('text')) return '📃';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'uploading': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <DocumentTextIcon className="w-5 h-5" />;
      case 'uploading': return <ArrowPathIcon className="w-5 h-5 animate-spin" />;
      case 'completed': return <CheckCircleIcon className="w-5 h-5" />;
      case 'error': return <ExclamationTriangleIcon className="w-5 h-5" />;
      default: return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Área de Upload */}
      <div
        className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors ${
          uploading ? 'opacity-50 pointer-events-none' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <label htmlFor="file-upload" className="cursor-pointer">
            <span className="mt-2 block text-sm font-semibold text-gray-900">
              Arraste arquivos aqui ou clique para selecionar
            </span>
            <span className="mt-1 block text-xs text-gray-500">
              {acceptedTypes.join(', ').toUpperCase()} até {maxSizeMB}MB cada
            </span>
          </label>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="sr-only"
            multiple
            accept={acceptedTypes.map(type => `.${type}`).join(',')}
            onChange={handleFileSelect}
            ref={fileInputRef}
          />
        </div>
        
        {enableOCR && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2">
              <MagnifyingGlassIcon className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                OCR automático habilitado para PDF e imagens
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Documentos */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Documentos ({documents.length}/{maxFiles})
            </h3>
            <button
              onClick={uploadAllDocuments}
              disabled={uploading || documents.every(doc => doc.status === 'completed')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
                  Processar Todos
                </>
              )}
            </button>
          </div>

          <div className="space-y-2">
            {documents.map((document) => (
              <div
                key={document.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(document.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {document.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(document.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Status */}
                    <div className={`flex items-center space-x-1 ${getStatusColor(document.status)}`}>
                      {getStatusIcon(document.status)}
                      <span className="text-xs capitalize">{document.status}</span>
                    </div>

                    {/* Progress Bar */}
                    {document.status === 'uploading' && (
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${document.progress}%` }}
                        />
                      </div>
                    )}

                    {/* OCR Status */}
                    {processingOCR[document.id] && (
                      <div className="flex items-center space-x-1 text-blue-600">
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        <span className="text-xs">OCR</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-1">
                      {document.ocrText && (
                        <button
                          onClick={() => {
                            // Mostrar preview do texto OCR
                            alert(`Texto extraído via OCR:\n\n${document.ocrText}`);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Ver texto extraído"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => removeDocument(document.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Remover"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* OCR Text Preview */}
                {document.ocrText && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <MagnifyingGlassIcon className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-medium text-green-800">
                        Texto extraído via OCR
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 line-clamp-3">
                      {document.ocrText}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;
