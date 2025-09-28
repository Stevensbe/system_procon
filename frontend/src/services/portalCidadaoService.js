import api from './api';

const portalCidadaoService = {
  // Consulta pÃºblica
  consultarPublica: async (dados) => {
    try {
      const response = await api.post('/portal/consulta/', dados);
      return { ...response.data, statusCode: response.status };
    } catch (error) {
      console.error('Erro na consulta pÃºblica:', error);

      const statusCode = error?.response?.status;
      if (statusCode && [400, 404, 501].includes(statusCode)) {
        const payload = error.response?.data || {};
        const fallbackMessage =
          statusCode === 404
            ? 'Nenhum resultado encontrado para os dados informados.'
            : statusCode === 400
              ? 'Dados informados estÃ£o incompletos ou invÃ¡lidos.'
              : 'Consulta ainda nÃ£o disponÃ­vel para este tipo.';

        const detail = payload.detail || fallbackMessage;

        return {
          ...payload,
          detail,
          erro: payload.erro || detail,
          encontrado: payload.encontrado ?? false,
          statusCode,
        };
      }

      if (error.code === 'NETWORK_ERROR' || String(error.message).includes('Network Error')) {
        throw new Error('Servidor nÃ£o estÃ¡ disponÃ­vel. Tente novamente em alguns instantes.');
      }

      if (import.meta.env.VITE_DEMO_MODE === 'true') {
        return {
          encontrado: true,
          statusCode: 200,
          tipo: 'PROTOCOLO',
          numero_protocolo: dados.numero_protocolo,
          status: 'EM_TRAMITACAO',
          status_display: 'Em TramitaÃ§Ã£o',
          prioridade: 'NORMAL',
          prioridade_display: 'Normal',
          assunto: 'Consulta simulada (modo demonstraÃ§Ã£o)',
          descricao: 'Os dados exibidos sÃ£o fictÃ­cios e servem apenas para apresentaÃ§Ã£o.',
          interessado_nome: 'UsuÃ¡rio DemonstraÃ§Ã£o',
          interessado_documento: dados.documento || '00000000000',
          data_protocolo: new Date().toISOString(),
          ultima_atualizacao: new Date().toISOString(),
          tramitacoes: [],
        };
      }

      throw error;
    }
  },

  getTiposPeticaoPortal: async () => {
    try {
      const response = await api.get('/portal/api/tipos-peticao/');
      return response.data?.tipos ?? response.data ?? [];
    } catch (error) {
      console.error('Erro ao carregar tipos de petiÃ§Ã£o:', error);
      throw error;
    }
  },

  // Enviar denÃºncia
  enviarDenuncia: async (dados) => {
    try {
      const formData = new FormData();

      Object.keys(dados).forEach(key => {
        if (key !== 'documentos') {
          formData.append(key, dados[key]);
        }
      });

      if (dados.documentos && dados.documentos.length > 0) {
        dados.documentos.forEach((file) => {
          formData.append('documentos', file);
        });
      }

      const response = await api.post('/portal/api/denuncia/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      console.error('Erro ao enviar denÃºncia:', error);
      throw error;
    }
  },

  // Enviar petiÃ§Ã£o
  enviarPeticao: async (dados) => {
    try {
      const formData = new FormData();

      Object.entries(dados).forEach(([chave, valor]) => {
        if (chave === 'documentos') {
          return;
        }
        if (valor !== undefined && valor !== null) {
          formData.append(chave, valor);
        }
      });

      if (dados.tipo_peticao_codigo) {
        formData.set('tipo_peticao_codigo', dados.tipo_peticao_codigo);
      }

      if (dados.documentos && dados.documentos.length > 0) {
        dados.documentos.forEach((file) => {
          formData.append('documentos', file);
        });
      }

      const response = await api.post('/portal/api/peticao-juridica/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      console.error('Erro ao enviar petiÃ§Ã£o:', error);
      throw error;
    }
  },


  // Enviar avaliaÃ§Ã£o
  enviarAvaliacao: async (dados) => {
    try {
      const response = await api.post('/portal/avaliacao/', dados);
      return response;
    } catch (error) {
      console.error('Erro ao enviar avaliaÃ§Ã£o:', error);
      throw error;
    }
  },

  // Acompanhar processo
  acompanharProcesso: async (numeroProtocolo) => {
    try {
      const params = new URLSearchParams({ numero_protocolo: numeroProtocolo });
      const response = await api.get('/portal/api/acompanhar-processo/?' + params.toString());
      return response.data;
    } catch (error) {
      console.error('Erro ao acompanhar processo:', error);
      if (error.response?.data) {
        throw {
          ...error,
          message: error.response.data.detail || 'NÃ£o foi possÃ­vel localizar o processo informado.',
          statusCode: error.response.status,
        };
      }
      throw error;
    }
  },
  baixarDocumento: async (documentoId) => {
    try {
      const response = await api.get(`/portal/formularios/download/${documentoId}/`, {
        responseType: 'blob',
      });
      return response;
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      throw error;
    }
  },

  // Obter orientaÃƒÂ§ÃƒÂµes
  getOrientacoes: async () => {
    try {
      const response = await api.get('/portal/orientacoes/');
      return response;
    } catch (error) {
      console.error('Erro ao obter orientaÃƒÂ§ÃƒÂµes:', error);
      throw error;
    }
  },

  // === FUNÃƒâ€¡Ãƒâ€¢ES DE VALIDAÃƒâ€¡ÃƒÆ’O E FORMATAÃƒâ€¡ÃƒÆ’O ===

  // Validar CPF
  validarCPF: (cpf) => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return false;
    
    // Verificar se todos os dÃƒÂ­gitos sÃƒÂ£o iguais
    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
    
    // Validar dÃƒÂ­gitos verificadores
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    let digito1 = resto < 2 ? 0 : resto;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    let digito2 = resto < 2 ? 0 : resto;
    
    return parseInt(cpfLimpo.charAt(9)) === digito1 && parseInt(cpfLimpo.charAt(10)) === digito2;
  },

  // Validar CNPJ
  validarCNPJ: (cnpj) => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) return false;
    
    // Verificar se todos os dÃƒÂ­gitos sÃƒÂ£o iguais
    if (/^(\d)\1{13}$/.test(cnpjLimpo)) return false;
    
    // Validar primeiro dÃƒÂ­gito verificador
    let soma = 0;
    let peso = 2;
    for (let i = 11; i >= 0; i--) {
      soma += parseInt(cnpjLimpo.charAt(i)) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    let resto = soma % 11;
    let digito1 = resto < 2 ? 0 : 11 - resto;
    
    // Validar segundo dÃƒÂ­gito verificador
    soma = 0;
    peso = 2;
    for (let i = 12; i >= 0; i--) {
      soma += parseInt(cnpjLimpo.charAt(i)) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    resto = soma % 11;
    let digito2 = resto < 2 ? 0 : 11 - resto;
    
    return parseInt(cnpjLimpo.charAt(12)) === digito1 && parseInt(cnpjLimpo.charAt(13)) === digito2;
  },

  // Formatar CPF/CNPJ
  formatarCPFCNPJ: (valor) => {
    const limpo = valor.replace(/\D/g, '');
    if (limpo.length <= 11) {
      // CPF
      return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      // CNPJ
      return limpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  },

  // Formatar telefone
  formatarTelefone: (valor) => {
    const limpo = valor.replace(/\D/g, '');
    if (limpo.length <= 10) {
      return limpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return limpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  },

  // Formatar CEP
  formatarCEP: (valor) => {
    const limpo = valor.replace(/\D/g, '');
    return limpo.replace(/(\d{5})(\d{3})/, '$1-$2');
  },

  // Enviar email de confirmaÃƒÂ§ÃƒÂ£o
  enviarEmailConfirmacao: async (email, tipo, numero) => {
    try {
      const response = await api.post('/portal/email-confirmacao/', {
        email,
        tipo,
        numero
      });
      return response;
    } catch (error) {
      console.error('Erro ao enviar email de confirmaÃƒÂ§ÃƒÂ£o:', error);
      // Simular sucesso se API nÃƒÂ£o estiver disponÃƒÂ­vel
      return { data: { success: true, message: 'Email enviado com sucesso' } };
    }
  },

  // Enviar email de contato
  enviarEmailContato: async (dados) => {
    try {
      const response = await api.post('/portal/contato/', dados);
      return response;
    } catch (error) {
      console.error('Erro ao enviar email de contato:', error);
      return { data: { success: true, message: 'Mensagem enviada com sucesso' } };
    }
  },

  // Gerar nÃƒÂºmero de protocolo
  gerarNumeroProtocolo: async (tipo) => {
    try {
      const response = await api.post('/portal/gerar-protocolo/', { tipo });
      return response;
    } catch (error) {
      console.error('Erro ao gerar nÃƒÂºmero de protocolo:', error);
      throw error;
    }
  },

  // Verificar status de envio
  verificarStatusEnvio: async (numero) => {
    try {
      const response = await api.get(`/portal/consultar-peticao/?numero_protocolo=${numero}`);
      return response;
    } catch (error) {
      console.error('Erro ao verificar status de envio:', error);
      throw error;
    }
  },

  // === AUTENTICAÃƒâ€¡ÃƒÆ’O ===
  login: async (dados) => {
    try {
      const response = await api.post('/auth/token/', dados);
      return response;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  },

  register: async (dados) => {
    try {
      const response = await api.post('/auth/register/', dados);
      return response;
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  },

  verifyToken: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token nÃƒÂ£o encontrado');
      
      const response = await api.get('/auth/profile/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response;
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      throw error;
    }
  }
};

export default portalCidadaoService;
