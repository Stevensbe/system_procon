import React, { useState } from 'react';
import { 
  StarIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import portalCidadaoService from '../../services/portalCidadaoService';

const AvaliacaoServico = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [avaliacao, setAvaliacao] = useState({
    tipo_servico: 'GERAL',
    nota: 5,
    comentario: '',
    sugestao: '',
    nome: '',
    email: '',
    numero_protocolo: ''
  });
  const [errors, setErrors] = useState({});

  const tiposServico = [
    { value: 'ATENDIMENTO', label: 'Atendimento Presencial/Telefônico' },
    { value: 'PORTAL', label: 'Portal Online' },
    { value: 'PROCESSO', label: 'Tramitação de Processo' },
    { value: 'ORIENTACAO', label: 'Orientação Recebida' },
    { value: 'RESOLUCAO', label: 'Resolução do Problema' },
    { value: 'GERAL', label: 'Avaliação Geral dos Serviços' }
  ];

  const handleInputChange = (field, value) => {
    setAvaliacao(prev => ({
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

  const validarFormulario = () => {
    const novosErrors = {};
    
    if (!avaliacao.tipo_servico) {
      novosErrors.tipo_servico = 'Selecione o tipo de serviço';
    }
    
    if (!avaliacao.nota || avaliacao.nota < 1 || avaliacao.nota > 5) {
      novosErrors.nota = 'Selecione uma nota de 1 a 5 estrelas';
    }
    
    if (avaliacao.comentario && avaliacao.comentario.length > 1000) {
      novosErrors.comentario = 'Comentário deve ter no máximo 1000 caracteres';
    }
    
    if (avaliacao.email && !/\S+@\S+\.\S+/.test(avaliacao.email)) {
      novosErrors.email = 'E-mail inválido';
    }
    
    setErrors(novosErrors);
    return Object.keys(novosErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }
    
    setLoading(true);
    try {
      await portalCidadaoService.enviarAvaliacao(avaliacao);
      setEnviado(true);
      onSuccess && onSuccess();
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      setErrors({
        geral: 'Erro ao enviar avaliação. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const obterMensagemNota = (nota) => {
    const mensagens = {
      1: { texto: 'Muito insatisfeito', icon: '😠', cor: 'text-red-600' },
      2: { texto: 'Insatisfeito', icon: '😕', cor: 'text-orange-600' },
      3: { texto: 'Neutro', icon: '😐', cor: 'text-yellow-600' },
      4: { texto: 'Satisfeito', icon: '😊', cor: 'text-blue-600' },
      5: { texto: 'Muito satisfeito', icon: '😍', cor: 'text-green-600' }
    };
    
    return mensagens[nota] || mensagens[5];
  };

  if (enviado) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Obrigado pela sua avaliação! 🎉
        </h3>
        <p className="text-gray-600 mb-6">
          Sua opinião é muito importante para melhorarmos nossos serviços.
        </p>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(star => (
                <StarSolid
                  key={star}
                  className={`h-6 w-6 ${star <= avaliacao.nota ? 'text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span className="text-lg font-semibold text-green-700">
              {obterMensagemNota(avaliacao.nota).texto}
            </span>
            <span className="text-2xl">{obterMensagemNota(avaliacao.nota).icon}</span>
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <p>✅ Sua avaliação foi registrada em nosso sistema</p>
          <p>📊 Ela será analisada pela nossa equipe de melhoria contínua</p>
          <p>🚀 Trabalhamos constantemente para melhorar nossos serviços</p>
        </div>
        
        <button
          onClick={() => {
            setEnviado(false);
            setAvaliacao({
              tipo_servico: 'GERAL',
              nota: 5,
              comentario: '',
              sugestao: '',
              nome: '',
              email: '',
              numero_protocolo: ''
            });
          }}
          className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Fazer Nova Avaliação
        </button>
      </div>
    );
  }

  const mensagemNota = obterMensagemNota(avaliacao.nota);

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <StarIcon className="h-6 w-6 mr-2 text-yellow-500" />
          Avalie Nossos Serviços
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Sua opinião é fundamental para melhorarmos continuamente
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* Erro Geral */}
        {errors.geral && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{errors.geral}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Tipo de Serviço */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Que serviço você está avaliando? *
          </label>
          <div className="grid md:grid-cols-2 gap-3">
            {tiposServico.map(tipo => (
              <label key={tipo.value} className="relative">
                <input
                  type="radio"
                  name="tipo_servico"
                  value={tipo.value}
                  checked={avaliacao.tipo_servico === tipo.value}
                  onChange={(e) => handleInputChange('tipo_servico', e.target.value)}
                  className="sr-only"
                />
                <div className={`border-2 rounded-lg p-3 cursor-pointer transition-colors ${
                  avaliacao.tipo_servico === tipo.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <p className="text-sm font-medium">{tipo.label}</p>
                </div>
              </label>
            ))}
          </div>
          {errors.tipo_servico && (
            <p className="text-sm text-red-600 mt-1">{errors.tipo_servico}</p>
          )}
        </div>
        
        {/* Avaliação por Estrelas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Como você avalia este serviço? *
          </label>
          <div className="flex items-center space-x-4 mb-2">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleInputChange('nota', star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  {star <= avaliacao.nota ? (
                    <StarSolid className="h-8 w-8 text-yellow-400" />
                  ) : (
                    <StarIcon className="h-8 w-8 text-gray-300 hover:text-yellow-400" />
                  )}
                </button>
              ))}
            </div>
            
            <div className={`flex items-center space-x-2 ${mensagemNota.cor}`}>
              <span className="font-medium">{mensagemNota.texto}</span>
              <span className="text-xl">{mensagemNota.icon}</span>
            </div>
          </div>
          
          {/* Indicadores visuais */}
          <div className="flex justify-between text-xs text-gray-500 mb-3">
            <span className="flex items-center">
              <HandThumbDownIcon className="h-3 w-3 mr-1" />
              Péssimo
            </span>
            <span className="flex items-center">
              <HandThumbUpIcon className="h-3 w-3 mr-1" />
              Excelente
            </span>
          </div>
          
          {errors.nota && (
            <p className="text-sm text-red-600 mt-1">{errors.nota}</p>
          )}
        </div>
        
        {/* Comentário */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comentários (opcional)
          </label>
          <textarea
            value={avaliacao.comentario}
            onChange={(e) => handleInputChange('comentario', e.target.value)}
            placeholder="Conte-nos mais sobre sua experiência... O que foi bom? O que pode melhorar?"
            rows={4}
            maxLength={1000}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.comentario ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          <div className="flex justify-between mt-1">
            {errors.comentario && (
              <p className="text-sm text-red-600">{errors.comentario}</p>
            )}
            <p className="text-sm text-gray-500">
              {avaliacao.comentario.length}/1000 caracteres
            </p>
          </div>
        </div>
        
        {/* Sugestão */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sugestões de Melhoria (opcional)
          </label>
          <textarea
            value={avaliacao.sugestao}
            onChange={(e) => handleInputChange('sugestao', e.target.value)}
            placeholder="Como podemos melhorar nossos serviços? Suas sugestões são muito valiosas para nós."
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            {avaliacao.sugestao.length}/500 caracteres
          </p>
        </div>
        
        {/* Dados Opcionais */}
        <div className="border-t pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Dados para Contato (opcional)
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Deixe seus dados se quiser que entremos em contato sobre sua avaliação
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome
              </label>
              <input
                type="text"
                value={avaliacao.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Seu nome completo"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={avaliacao.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="seu@email.com"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número do Protocolo (se aplicável)
            </label>
            <input
              type="text"
              value={avaliacao.numero_protocolo}
              onChange={(e) => handleInputChange('numero_protocolo', e.target.value)}
              placeholder="2025-0000123"
              className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Se sua avaliação é sobre um processo específico
            </p>
          </div>
        </div>
        
        {/* Botão de Envio */}
        <div className="border-t pt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
            {loading ? 'Enviando Avaliação...' : 'Enviar Avaliação'}
          </button>
          
          <p className="text-xs text-gray-500 text-center mt-3">
            Sua avaliação nos ajuda a melhorar nossos serviços continuamente
          </p>
        </div>
      </form>
    </div>
  );
};

export default AvaliacaoServico;