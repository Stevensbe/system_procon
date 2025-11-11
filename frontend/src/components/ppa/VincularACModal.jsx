import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import ppaService from '../../services/ppaService';
import './Modal.css';

const obterMensagemErro = (error) => {
  const status = error.response?.status;
  if (status === 401) {
    return 'Sessao expirada. Entre novamente para continuar.';
  }
  if (status === 404) {
    return 'Endpoint de Autos de Constatacao nao encontrado.';
  }
  return error.response?.data?.detail || 'Nao foi possivel carregar os Autos de Constatacao.';
};

const formatarData = (valor) => {
  if (!valor) return '';
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? valor : data.toLocaleDateString('pt-BR');
};

const VincularACModal = ({ ppaId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [loadingACs, setLoadingACs] = useState(true);
  const [acsDisponiveis, setAcsDisponiveis] = useState([]);
  const [acSelecionado, setAcSelecionado] = useState('');
  const [erroACs, setErroACs] = useState('');

  useEffect(() => {
    carregarACs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregarACs = async () => {
    try {
      setErroACs('');
      setLoadingACs(true);
      const response = await api.get('/fiscalizacao/autos-constatacao/', {
        params: { disponiveis: true },
      });
      const payload = response.data?.results ?? response.data ?? [];
      const livres = payload.filter((ac) => !ac.ppa && !ac.ppa_id && !ac.ppa_vinculado);

      setAcsDisponiveis(livres);
      if (!livres.length) {
        setErroACs('Nenhum Auto de Constatacao disponivel para vincular.');
      }
    } catch (error) {
      console.error('Erro ao carregar ACs:', error);
      setErroACs(obterMensagemErro(error));
    } finally {
      setLoadingACs(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!acSelecionado) {
      alert('Selecione um Auto de Constatacao.');
      return;
    }

    try {
      setLoading(true);
      const resultado = await ppaService.vincularAC(ppaId, acSelecionado);
      alert(resultado.mensagem || 'Auto de Constatacao vinculado com sucesso.');
      onSuccess();
    } catch (error) {
      console.error('Erro ao vincular AC:', error);
      const mensagem =
        error.response?.data?.erro ||
        (error.response?.status === 401
          ? 'Sessao expirada. Entre novamente.'
          : 'Erro ao vincular Auto de Constatacao.');
      alert(mensagem);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h5>
            <i className="fas fa-link mr-2" />
            Vincular Auto de Constatacao ao PPA
          </h5>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">
            x
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {loadingACs ? (
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="sr-only">Carregando...</span>
                </div>
                <p className="mt-2">Carregando Autos de Constatacao...</p>
              </div>
            ) : (
              <>
                {erroACs && (
                  <div className="alert alert-warning" role="alert">
                    <i className="fas fa-exclamation-triangle mr-2" />
                    {erroACs}
                    <button
                      type="button"
                      className="btn btn-link btn-sm ml-2 p-0 align-baseline"
                      onClick={carregarACs}
                    >
                      Tentar novamente
                    </button>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="ac">Auto de Constatacao *</label>
                  <select
                    id="ac"
                    className="form-control"
                    value={acSelecionado}
                    onChange={(event) => setAcSelecionado(event.target.value)}
                    disabled={acsDisponiveis.length === 0}
                    required
                  >
                    <option value="">Selecione um Auto de Constatacao</option>
                    {acsDisponiveis.map((ac) => (
                      <option key={ac.id} value={ac.id}>
                        {ac.numero} - {ac.empresa_autuada || ac.razao_social}{' '}
                        {ac.data_fiscalizacao ? `(${formatarData(ac.data_fiscalizacao)})` : ''}
                      </option>
                    ))}
                  </select>
                  <small className="form-text text-muted">
                    Escolha o Auto de Constatacao que originou este PPA.
                  </small>
                </div>

                <div className="alert alert-info">
                  <h6 className="mb-2">
                    <i className="fas fa-info-circle mr-2" />
                    Informacoes
                  </h6>
                  <ul className="mb-0 pl-3">
                    <li>O AC sera vinculado ao PPA como documento de origem.</li>
                    <li>Uma movimentacao e registrada automaticamente.</li>
                    <li>Os dados do AC podem preencher campos do PPA.</li>
                  </ul>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || loadingACs || acsDisponiveis.length === 0}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm mr-2" role="status" />
                  Vinculando...
                </>
              ) : (
                <>
                  <i className="fas fa-link mr-2" />
                  Vincular AC
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VincularACModal;
