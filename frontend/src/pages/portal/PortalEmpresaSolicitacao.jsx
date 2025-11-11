import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Building, ClipboardCheck } from 'lucide-react';
import portalEmpresaService from '../../services/portalEmpresaService';

const maskCNPJ = (value = '') => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
};

const maskCEP = (value = '') => {
  return value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
};

const maskPhone = (value = '') => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
};

/**
 * Formulário público para que empresas solicitem acesso ao portal corporativo.
 * Envia os dados para POST /api/portal-empresa/solicitacoes/ e exibe feedback amigável.
 */
function PortalEmpresaSolicitacao() {
  const [formData, setFormData] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    email_contato: '',
    telefone_contato: '',
    responsavel_legal: '',
    cargo_responsavel: '',
    endereco_completo: '',
    cidade: '',
    estado: '',
    cep: '',
    observacoes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMaskedChange = (name, maskFn) => (event) => {
    handleChange({ target: { name, value: maskFn(event.target.value) } });
  };

  const validate = () => {
    const required = [
      'razao_social',
      'cnpj',
      'email_contato',
      'responsavel_legal',
      'endereco_completo',
      'cidade',
      'estado',
    ];

    const missing = required.filter((field) => !formData[field]?.trim());
    if (missing.length > 0) {
      setFeedback({
        type: 'error',
        message: 'Preencha todos os campos obrigatórios antes de enviar sua solicitação.',
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await portalEmpresaService.criarSolicitacaoCadastro({
        ...formData,
        cnpj: formData.cnpj.replace(/\D/g, ''),
        telefone_contato: formData.telefone_contato.replace(/\D/g, ''),
        cep: formData.cep.replace(/\D/g, ''),
      });

      setFeedback({
        type: 'success',
        message:
          'Solicitação enviada com sucesso! Nossa equipe analisará os dados e enviará o retorno por e-mail em breve.',
      });

      setFormData({
        razao_social: '',
        nome_fantasia: '',
        cnpj: '',
        email_contato: '',
        telefone_contato: '',
        responsavel_legal: '',
        cargo_responsavel: '',
        endereco_completo: '',
        cidade: '',
        estado: '',
        cep: '',
        observacoes: '',
      });
    } catch (error) {
      console.error('Erro ao enviar solicitação de cadastro', error);
      setFeedback({
        type: 'error',
        message:
          error.response?.data?.detail ||
          'Não foi possível registrar sua solicitação. Tente novamente em alguns minutos.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-14">
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-200"
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            Solicitação de cadastro
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.6 }}
            className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Habilite sua empresa no portal corporativo do PROCON
          </motion.h1>
          <p className="mt-4 text-base text-slate-300">
            Preencha os dados da organização para que nossa equipe faça a validação. Após a aprovação, você receberá
            credenciais de acesso, tokens de API e poderá acompanhar intimações, CIP&apos;s e audiências em um único lugar.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.35fr_0.9fr]">
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-[0_30px_90px_-40px_rgba(15,118,255,0.45)] backdrop-blur"
          >
            <section>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Building className="h-5 w-5 text-blue-400" />
                Dados da empresa
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Campos marcados com * são obrigatórios. Utilize o CNPJ completo e mantenha os dados de contato atualizados.
              </p>
            </section>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InputField
                label="Razão social *"
                name="razao_social"
                value={formData.razao_social}
                onChange={handleChange}
              />
              <InputField
                label="Nome fantasia"
                name="nome_fantasia"
                value={formData.nome_fantasia}
                onChange={handleChange}
              />
              <InputField
                label="CNPJ *"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleMaskedChange('cnpj', maskCNPJ)}
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
              <InputField
                label="E-mail principal *"
                name="email_contato"
                type="email"
                value={formData.email_contato}
                onChange={handleChange}
              />
              <InputField
                label="Telefone"
                name="telefone_contato"
                value={formData.telefone_contato}
                onChange={handleMaskedChange('telefone_contato', maskPhone)}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
              <InputField
                label="CEP"
                name="cep"
                value={formData.cep}
                onChange={handleMaskedChange('cep', maskCEP)}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <InputField
                label="Cidade *"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
              />
              <InputField
                label="UF *"
                name="estado"
                value={formData.estado}
                onChange={(event) =>
                  handleChange({
                    target: {
                      name: 'estado',
                      value: event.target.value.toUpperCase().slice(0, 2),
                    },
                  })
                }
                placeholder="AM"
                maxLength={2}
              />
            </div>

            <div className="mt-4">
              <TextareaField
                label="Endereço completo *"
                name="endereco_completo"
                value={formData.endereco_completo}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <section className="mt-8">
              <h3 className="text-lg font-semibold text-white">Responsável legal</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Nome completo *"
                  name="responsavel_legal"
                  value={formData.responsavel_legal}
                  onChange={handleChange}
                />
                <InputField
                  label="Cargo"
                  name="cargo_responsavel"
                  value={formData.cargo_responsavel}
                  onChange={handleChange}
                />
              </div>
            </section>

            <section className="mt-8">
              <TextareaField
                label="Observações adicionais"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                placeholder="Informe integrações desejadas, unidades que precisam de acesso, contatos adicionais ou outras informações relevantes."
                rows={4}
              />
            </section>

            <div className="mt-8 flex flex-col gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-blue-500/70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando solicitação...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Enviar solicitação de cadastro
                  </>
                )}
              </button>

              <p className="text-xs text-slate-400">
                Ao enviar este formulário, você concorda com o tratamento dos dados seguindo as diretrizes da LGPD e autoriza
                o PROCON a entrar em contato para validação das informações fornecidas.
              </p>
            </div>

            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
                  feedback.type === 'success'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                }`}
              >
                {feedback.message}
              </motion.div>
            )}
          </motion.form>

          <motion.aside
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="flex flex-col gap-6 rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-slate-900/60 p-8 text-blue-50 backdrop-blur"
          >
            <div>
              <h2 className="text-xl font-semibold text-white">O que acontece após o envio?</h2>
              <p className="mt-2 text-sm text-blue-100/80">
                Sua solicitação entra na fila de análise do time de TI. Caso aprovado, você receberá:
              </p>
            </div>
            <ul className="space-y-4 text-sm text-blue-100/90">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-100">
                  1
                </span>
                <div>
                  <strong className="block text-blue-50">E-mail de boas-vindas</strong>
                  Instruções para primeiro acesso e política de uso do portal.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-100">
                  2
                </span>
                <div>
                  <strong className="block text-blue-50">Credenciais corporativas</strong>
                  Usuários administrativos e tokens para integrações.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-100">
                  3
                </span>
                <div>
                  <strong className="block text-blue-50">Acesso ao dashboard</strong>
                  Consulta de intimações, respostas e histórico em tempo real.
                </div>
              </li>
            </ul>
            <div className="rounded-2xl border border-blue-500/40 bg-blue-500/15 p-5 text-xs text-blue-100/80">
              Em caso de dúvidas, entre em contato via <strong>suporte-ti@procon.gov.br</strong> informando o CNPJ e o protocolo do pedido.
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, name, value, onChange, type = 'text', ...rest }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-200">
      <span>{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
        {...rest}
      />
    </label>
  );
}

function TextareaField({ label, name, value, onChange, rows = 4, ...rest }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-200">
      <span>{label}</span>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
        {...rest}
      />
    </label>
  );
}

export default PortalEmpresaSolicitacao;
