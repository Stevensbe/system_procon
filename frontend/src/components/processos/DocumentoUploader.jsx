import React, { useState, useRef } from 'react';
import { uploadDocumentoProcesso } from '../../services/processosService';

function DocumentoUploader({ processoId, onUploadSuccess, onUploadError }) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);
    
    const [formData, setFormData] = useState({
        tipo_documento: '',
        descricao: '',
        arquivo: null
    });

    const tiposDocumento = [
        { value: 'defesa_previa', label: 'Defesa Prévia' },
        { value: 'recurso', label: 'Recurso' },
        { value: 'parecer_juridico', label: 'Parecer Jurídico' },
        { value: 'notificacao', label: 'Notificação' },
        { value: 'comprovante_pagamento', label: 'Comprovante de Pagamento' },
        { value: 'documento_adicional', label: 'Documento Adicional' },
        { value: 'correspondencia', label: 'Correspondência' },
        { value: 'laudo_tecnico', label: 'Laudo Técnico' },
        { value: 'outros', label: 'Outros' }
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileSelect = (file) => {
        if (file) {
            // Validar tipo de arquivo
            const allowedTypes = [
                'application/pdf',
                'image/jpeg',
                'image/png',
                'image/gif',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ];

            if (!allowedTypes.includes(file.type)) {
                alert('Tipo de arquivo não permitido. Use PDF, imagens, Word ou Excel.');
                return;
            }

            // Validar tamanho (10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('Arquivo muito grande. Máximo permitido: 10MB');
                return;
            }

            setFormData(prev => ({
                ...prev,
                arquivo: file
            }));
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.arquivo) {
            alert('Por favor, selecione um arquivo');
            return;
        }

        if (!formData.tipo_documento) {
            alert('Por favor, selecione o tipo de documento');
            return;
        }

        setUploading(true);

        try {
            const submitFormData = new FormData();
            submitFormData.append('arquivo', formData.arquivo);
            submitFormData.append('tipo_documento', formData.tipo_documento);
            submitFormData.append('descricao', formData.descricao);

            await uploadDocumentoProcesso(processoId, submitFormData);
            
            // Resetar formulário
            setFormData({
                tipo_documento: '',
                descricao: '',
                arquivo: null
            });
            
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            if (onUploadSuccess) {
                onUploadSuccess();
            }

        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            if (onUploadError) {
                onUploadError(error.message || 'Erro ao enviar documento');
            } else {
                alert('Erro ao enviar documento: ' + (error.message || 'Erro desconhecido'));
            }
        } finally {
            setUploading(false);
        }
    };

    const getFileIcon = (fileName) => {
        const extension = fileName?.split('.').pop()?.toLowerCase();
        const icons = {
            pdf: '📄',
            doc: '📝',
            docx: '📝',
            xls: '📊',
            xlsx: '📊',
            jpg: '🖼️',
            jpeg: '🖼️',
            png: '🖼️',
            gif: '🖼️'
        };
        return icons[extension] || '📎';
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Documento</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tipo de Documento */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Documento *
                    </label>
                    <select
                        name="tipo_documento"
                        value={formData.tipo_documento}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Selecione o tipo...</option>
                        {tiposDocumento.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>
                                {tipo.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Descrição */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição
                    </label>
                    <textarea
                        name="descricao"
                        value={formData.descricao}
                        onChange={handleInputChange}
                        placeholder="Descrição opcional do documento..."
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Área de Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Arquivo *
                    </label>
                    
                    {/* Drop Zone */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                            ${dragActive 
                                ? 'border-blue-400 bg-blue-50' 
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileInputChange}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                            className="hidden"
                        />
                        
                        {formData.arquivo ? (
                            <div className="space-y-2">
                                <div className="text-4xl">
                                    {getFileIcon(formData.arquivo.name)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {formData.arquivo.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatFileSize(formData.arquivo.size)}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFormData(prev => ({ ...prev, arquivo: null }));
                                        if (fileInputRef.current) {
                                            fileInputRef.current.value = '';
                                        }
                                    }}
                                    className="text-sm text-red-600 hover:text-red-800"
                                >
                                    Remover arquivo
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Clique para selecionar ou arraste o arquivo aqui
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        PDF, Word, Excel, Imagens - Máximo 10MB
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Botões */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={() => {
                            setFormData({
                                tipo_documento: '',
                                descricao: '',
                                arquivo: null
                            });
                            if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                            }
                        }}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                        Limpar
                    </button>
                    <button
                        type="submit"
                        disabled={uploading || !formData.arquivo || !formData.tipo_documento}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                    >
                        {uploading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Enviando...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                </svg>
                                Enviar Documento
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default DocumentoUploader;
