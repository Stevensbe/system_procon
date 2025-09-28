/**
 * Utilitários de validação para o frontend
 */

/**
 * Valida CPF usando o algoritmo oficial
 * @param {string} cpf - CPF a ser validado (com ou sem formatação)
 * @returns {boolean} - true se válido, false se inválido
 */
export function validarCPF(cpf) {
  // Remove formatação
  cpf = cpf.replace(/[^\d]+/g, '');
  
  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  
  let resto = 11 - (soma % 11);
  let dv1 = resto > 9 ? 0 : resto;
  
  if (dv1 !== parseInt(cpf.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  
  resto = 11 - (soma % 11);
  let dv2 = resto > 9 ? 0 : resto;
  
  return dv2 === parseInt(cpf.charAt(10));
}

/**
 * Formata CPF para exibição
 * @param {string} cpf - CPF sem formatação
 * @returns {string} - CPF formatado (000.000.000-00)
 */
export function formatarCPF(cpf) {
  cpf = cpf.replace(/[^\d]/g, '');
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Valida telefone brasileiro
 * @param {string} telefone - Telefone a ser validado
 * @returns {boolean} - true se válido, false se inválido
 */
export function validarTelefone(telefone) {
  // Remove formatação
  telefone = telefone.replace(/[^\d]/g, '');
  
  // Verifica se tem 10 ou 11 dígitos
  if (telefone.length < 10 || telefone.length > 11) return false;
  
  // Verifica se começa com DDD válido (11-99)
  const ddd = telefone.substring(0, 2);
  if (parseInt(ddd) < 11 || parseInt(ddd) > 99) return false;
  
  return true;
}

/**
 * Formata telefone para exibição
 * @param {string} telefone - Telefone sem formatação
 * @returns {string} - Telefone formatado
 */
export function formatarTelefone(telefone) {
  telefone = telefone.replace(/[^\d]/g, '');
  
  if (telefone.length === 11) {
    return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (telefone.length === 10) {
    return telefone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return telefone;
}

/**
 * Valida email
 * @param {string} email - Email a ser validado
 * @returns {boolean} - true se válido, false se inválido
 */
export function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Sanitiza dados do formulário
 * @param {object} dados - Dados a serem sanitizados
 * @returns {object} - Dados sanitizados
 */
export function sanitizarDados(dados) {
  // Formatar CEP para o padrão esperado pelo backend (00000-000)
  let cepFormatado = dados.cep?.replace(/[^\d]/g, '') || dados.cep;
  if (cepFormatado && cepFormatado.length === 8) {
    cepFormatado = cepFormatado.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  
  return {
    ...dados,
    cpf: dados.cpf?.replace(/[^\d]/g, '') || dados.cpf,
    telefone: dados.telefone?.replace(/[^\d]/g, '') || dados.telefone,
    nome_completo: dados.nome_completo?.trim() || dados.nome_completo,
    email: dados.email?.trim().toLowerCase() || dados.email,
    endereco: dados.endereco?.trim() || dados.endereco,
    bairro: dados.bairro?.trim() || dados.bairro,
    cidade: dados.cidade?.trim() || dados.cidade,
    estado: dados.estado?.trim().toUpperCase() || dados.estado,
    cep: cepFormatado
  };
}

/**
 * Valida todos os campos obrigatórios
 * @param {object} dados - Dados a serem validados
 * @returns {object} - Objeto com erros encontrados
 */
export function validarCamposObrigatorios(dados) {
  const erros = {};
  
  if (!dados.cpf || !validarCPF(dados.cpf)) {
    erros.cpf = 'CPF inválido';
  }
  
  if (!dados.telefone || !validarTelefone(dados.telefone)) {
    erros.telefone = 'Telefone inválido';
  }
  
  if (!dados.email || !validarEmail(dados.email)) {
    erros.email = 'Email inválido';
  }
  
  if (!dados.nome_completo || dados.nome_completo.trim().length < 2) {
    erros.nome_completo = 'Nome deve ter pelo menos 2 caracteres';
  }
  
  if (!dados.data_nascimento) {
    erros.data_nascimento = 'Data de nascimento é obrigatória';
  }
  
  if (!dados.password || dados.password.length < 6) {
    erros.password = 'Senha deve ter pelo menos 6 caracteres';
  }
  
  return erros;
}
