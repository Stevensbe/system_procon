import React from 'react';

function HistoricoTimeline({ historico = [] }) {
    const getEventIcon = (tipo) => {
        const icons = {
            'criacao': '🆕',
            'status_change': '🔄',
            'documento_upload': '📄',
            'prazo_vencido': '⚠️',
            'notificacao': '📬',
            'defesa': '⚖️',
            'recurso': '📋',
            'julgamento': '🏛️',
            'finalizacao': '✅',
            'default': '📝'
        };
        return icons[tipo] || icons.default;
    };

    const getEventColor = (tipo) => {
        const colors = {
            'criacao': 'bg-blue-100 text-blue-800 border-blue-200',
            'status_change': 'bg-purple-100 text-purple-800 border-purple-200',
            'documento_upload': 'bg-green-100 text-green-800 border-green-200',
            'prazo_vencido': 'bg-red-100 text-red-800 border-red-200',
            'notificacao': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'defesa': 'bg-indigo-100 text-indigo-800 border-indigo-200',
            'recurso': 'bg-orange-100 text-orange-800 border-orange-200',
            'julgamento': 'bg-purple-100 text-purple-800 border-purple-200',
            'finalizacao': 'bg-green-100 text-green-800 border-green-200',
            'default': 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colors[tipo] || colors.default;
    };

    const formatarData = (dataStr) => {
        try {
            const data = new Date(dataStr);
            return {
                data: data.toLocaleDateString('pt-BR'),
                hora: data.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })
            };
        } catch (error) {
            return { data: 'Data inválida', hora: '' };
        }
    };

    if (!historico || historico.length === 0) {
        return (
            <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum histórico disponível</h3>
                <p className="mt-1 text-sm text-gray-500">O histórico de tramitação aparecerá aqui conforme o processo for movimentado.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Tramitação</h3>
            
            <div className="flow-root">
                <ul className="-mb-8">
                    {historico.map((evento, index) => {
                        const isUltimo = index === historico.length - 1;
                        const { data, hora } = formatarData(evento.data_ocorrencia);
                        
                        return (
                            <li key={evento.id || index}>
                                <div className="relative pb-8">
                                    {!isUltimo && (
                                        <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                    )}
                                    
                                    <div className="relative flex items-start space-x-3">
                                        {/* Ícone do evento */}
                                        <div className="relative">
                                            <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center text-lg ${getEventColor(evento.tipo)}`}>
                                                {getEventIcon(evento.tipo)}
                                            </div>
                                        </div>
                                        
                                        {/* Conteúdo do evento */}
                                        <div className="flex-1 min-w-0">
                                            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-medium text-gray-900">
                                                            {evento.titulo || evento.descricao_mudanca}
                                                        </h4>
                                                        
                                                        {evento.descricao && evento.descricao !== evento.titulo && (
                                                            <p className="mt-1 text-sm text-gray-600">
                                                                {evento.descricao}
                                                            </p>
                                                        )}
                                                        
                                                        {evento.detalhes && (
                                                            <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                                                {evento.detalhes}
                                                            </div>
                                                        )}
                                                        
                                                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                                            <span className="flex items-center">
                                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                                </svg>
                                                                {data}
                                                            </span>
                                                            
                                                            {hora && (
                                                                <span className="flex items-center">
                                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                                    </svg>
                                                                    {hora}
                                                                </span>
                                                            )}
                                                            
                                                            {evento.usuario_responsavel && (
                                                                <span className="flex items-center">
                                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                                                    </svg>
                                                                    {evento.usuario_responsavel}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {evento.status_anterior && evento.status_novo && (
                                                        <div className="ml-4 flex-shrink-0">
                                                            <div className="text-xs text-gray-500">
                                                                <span className="px-2 py-1 bg-gray-100 rounded">
                                                                    {evento.status_anterior}
                                                                </span>
                                                                <span className="mx-1">→</span>
                                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                                                    {evento.status_novo}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {evento.anexos && evento.anexos.length > 0 && (
                                                    <div className="mt-3 border-t border-gray-100 pt-3">
                                                        <h5 className="text-xs font-medium text-gray-700 mb-2">Anexos:</h5>
                                                        <div className="flex flex-wrap gap-2">
                                                            {evento.anexos.map((anexo, anexoIndex) => (
                                                                <a
                                                                    key={anexoIndex}
                                                                    href={anexo.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                                                                >
                                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                                                                    </svg>
                                                                    {anexo.nome}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
            
            {/* Resumo da timeline */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                        <strong>{historico.length}</strong> eventos no histórico
                    </span>
                    {historico.length > 0 && (
                        <span>
                            Último movimento: {formatarData(historico[0].data_ocorrencia).data}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default HistoricoTimeline;
