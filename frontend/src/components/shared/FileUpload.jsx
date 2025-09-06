import React, { useState, useRef } from 'react';

const FileUpload = ({ 
  label, 
  name, 
  accept = "*/*", 
  multiple = false,
  maxSize = 10, // MB
  onFilesChange,
  existingFiles = [],
  className = ""
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState(existingFiles);
  const [uploadProgress, setUploadProgress] = useState({});
  const inputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file) => {
    // Validar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      return `Arquivo muito grande. Máximo: ${maxSize}MB`;
    }

    // Validar tipo (se especificado)
    if (accept !== "*/*") {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      const mimeType = file.type;
      
      const isValid = acceptedTypes.some(type => {
        if (type.includes('*')) {
          return mimeType.startsWith(type.replace('*', ''));
        }
        return type === mimeType || type === fileExtension;
      });
      
      if (!isValid) {
        return `Tipo de arquivo não permitido. Aceitos: ${accept}`;
      }
    }

    return null;
  };

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList);
    const validFiles = [];
    const errors = [];

    newFiles.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        // Adicionar preview para imagens
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            file.preview = e.target.result;
            setFiles(prev => [...prev]);
          };
          reader.readAsDataURL(file);
        }
        
        validFiles.push({
          file,
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          preview: null
        });
      }
    });

    if (errors.length > 0) {
      alert('Erros encontrados:\n' + errors.join('\n'));
    }

    if (validFiles.length > 0) {
      const updatedFiles = multiple ? [...files, ...validFiles] : validFiles;
      setFiles(updatedFiles);
      onFilesChange(name, updatedFiles);
    }
  };

  const removeFile = (fileId) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onFilesChange(name, updatedFiles);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles) {
      handleFiles(droppedFiles);
    }
  };

  const handleInputChange = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      handleFiles(selectedFiles);
    }
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('doc')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    return '📎';
  };

  return (
    <div className={`file-upload-container ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {/* Drag and Drop Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-2">
          <div className="text-4xl">📁</div>
          <div className="text-sm text-gray-600">
            <span className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
              Clique para selecionar
            </span> ou arraste arquivos aqui
          </div>
          <div className="text-xs text-gray-500">
            {accept !== "*/*" && `Tipos aceitos: ${accept}`}
            {maxSize && ` • Tamanho máximo: ${maxSize}MB`}
            {multiple && ` • Múltiplos arquivos permitidos`}
          </div>
        </div>
      </div>

      {/* Lista de Arquivos */}
      {files.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Arquivos selecionados ({files.length})
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((fileObj) => (
              <div
                key={fileObj.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="text-2xl">
                    {getFileIcon(fileObj.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {fileObj.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(fileObj.size)}
                    </div>
                  </div>

                  {/* Preview para imagens */}
                  {fileObj.preview && (
                    <div className="w-10 h-10 rounded border overflow-hidden">
                      <img
                        src={fileObj.preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeFile(fileObj.id)}
                  className="ml-3 text-red-500 hover:text-red-700 text-lg font-bold"
                  title="Remover arquivo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informações adicionais */}
      <div className="mt-2 text-xs text-gray-500">
        💡 Dica: Você pode arrastar e soltar arquivos diretamente na área acima
      </div>
    </div>
  );
};

export default FileUpload;