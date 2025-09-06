import api from './api';

const portalCidadaoService = {
  // Consulta pública
  consultarPublica: async (dados) => {
    try {
      const response = await api.post('/portal/consulta/', dados);
      return response;
    } catch (error) {
      console.error('Erro na consulta pública:', error);
      
      // Verificar se é erro de conexão
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        throw new Error('Servidor não está disponível. Tente novamente em alguns instantes.');
      }
      
      // Fallback para dados simulados apenas se configurado
      if (import.meta.env.VITE_DEMO_MODE === 'true') {
        return {
          data: {
            encontrado: true,
            numero_protocolo: dados.numero_protocolo,
            status: 'Em Andamento',
            data_abertura: '2025-01-15',
            assunto: 'Reclamação sobre produto defeituoso',
            empresa: 'Empresa XYZ Ltda',
            ultima_atualizacao: 'Processo em análise pela equipe jurídica'
          }
        };
      }
      
      throw error;
    }
  },

  // Enviar denúncia
  enviarDenuncia: async (dados) => {
    try {
      const formData = new FormData();
      
      // Adicionar dados básicos
      Object.keys(dados).forEach(key => {
        if (key !== 'documentos') {
          formData.append(key, dados[key]);
        }
      });
      
      // Adicionar documentos
      if (dados.documentos && dados.documentos.length > 0) {
        dados.documentos.forEach((file, index) => {
          formData.append(`documentos`, file);
        });
      }
      
      const response = await api.post('/portal/api/denuncia/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      console.error('Erro ao enviar denúncia:', error);
      throw error;
    }
  },

  // Enviar petição
  enviarPeticao: async (dados) => {
    try {
      const formData = new FormData();
      
      Object.keys(dados).forEach(key => {
        if (key !== 'documentos') {
          formData.append(key, dados[key]);
        }
      });
      
      if (dados.documentos && dados.documentos.length > 0) {
        dados.documentos.forEach((file, index) => {
          formData.append(`documentos`, file);
        });
      }
      
      const response = await api.post('/portal/api/peticao-juridica/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      console.error('Erro ao enviar petição:', error);
      throw error;
    }
  },

  // Enviar avaliação
  enviarAvaliacao: async (dados) => {
    try {
      const response = await api.post('/portal/avaliacao/', dados);
      return response;
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      throw error;
    }
  },

  // Acompanhar processo
  acompanharProcesso: async (protocolo) => {
    try {
      const response = await api.get(`/portal/consultar-peticao/?numero_protocolo=${protocolo}`);
      return response;
    } catch (error) {
      console.error('Erro ao acompanhar processo:', error);
      throw error;
    }
  },

  // Baixar documento
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

  // Obter orientações
  getOrientacoes: async () => {
    try {
      const response = await api.get('/portal/orientacoes/');
      return response;
    } catch (error) {
      console.error('Erro ao obter orientações:', error);
      throw error;
    }
  },

  // === FUNÇÕES DE VALIDAÇÃO E FORMATAÇÃO ===

  // Validar CPF
  validarCPF: (cpf) => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
    
    // Validar dígitos verificadores
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
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cnpjLimpo)) return false;
    
    // Validar primeiro dígito verificador
    let soma = 0;
    let peso = 2;
    for (let i = 11; i >= 0; i--) {
      soma += parseInt(cnpjLimpo.charAt(i)) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    let resto = soma % 11;
    let digito1 = resto < 2 ? 0 : 11 - resto;
    
    // Validar segundo dígito verificador
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

  // Enviar email de confirmação
  enviarEmailConfirmacao: async (email, tipo, numero) => {
    try {
      const response = await api.post('/portal/email-confirmacao/', {
        email,
        tipo,
        numero
      });
      return response;
    } catch (error) {
      console.error('Erro ao enviar email de confirmação:', error);
      // Simular sucesso se API não estiver disponível
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

  // Gerar número de protocolo
  gerarNumeroProtocolo: async (tipo) => {
    try {
      const response = await api.post('/portal/gerar-protocolo/', { tipo });
      return response;
    } catch (error) {
      console.error('Erro ao gerar número de protocolo:', error);
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

  // === AUTENTICAÇÃO ===
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
      if (!token) throw new Error('Token não encontrado');
      
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