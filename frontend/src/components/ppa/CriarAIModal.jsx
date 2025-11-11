import React, { useState } from 'react';
import ppaService from '../../services/ppaService';
import './Modal.css';

const CriarAIModal = ({ ppaId, ppaData, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fundamentacao_legal: '',
    descricao_infracao: ppaData?.assunto || '',
    valor_multa: '',
    tipo_infracao: 'leve',
    artigos_infringidos: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fundamentacao_legal.trim()) {
      alert('Fundamentação Legal é obrigatória!');
      return;
    }

    if (!formData.descricao_infracao.trim()) {
      alert('Descrição da Infração é obrigatória!');
      return;
    }

    try {
      setLoading(true);
      const resultado = await ppaService.criarAI(ppaId, formData);
      alert(`${resultado.mensagem}\n\nAuto de Infração: ${resultado.auto_infracao.numero}`);
      onSuccess();
    } catch (error) {
      console.error('Erro ao criar AI:', error);
      const mensagem = error.response?.data?.erro || 'Erro ao criar Auto de Infração';
      alert(mensagem);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h5>⚖️ Criar Auto de Infração a partir do PPA</h5>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="alert alert-warning">
              <i className="fas fa-exclamation-triangle"></i> <strong>Atenção:</strong> Esta ação criará um Auto de Infração formal e alterará o status do PPA para "Concluído".
            </div>

            {ppaData && (
              <div className="card mb-3" style={{ background: '#f8f9fa', padding: '15px' }}>
                <h6>Dados do PPA:</h6>
                <p className="mb-1"><strong>Número:</strong> {ppaData.numero}</p>
                <p className="mb-1"><strong>Interessado:</strong> {ppaData.interessado}</p>
                <p className="mb-0"><strong>CNPJ:</strong> {ppaData.cnpj_interessado}</p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="tipo_infracao">Tipo de Infração</label>
              <select
                id="tipo_infracao"
                name="tipo_infracao"
                className="form-control"
                value={formData.tipo_infracao}
                onChange={handleChange}
              >
                <option value="leve">Leve</option>
                <option value="media">Média</option>
                <option value="grave">Grave</option>
                <option value="gravissima">Gravíssima</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="fundamentacao_legal">
                Fundamentação Legal * <small>(Base legal para a autuação)</small>
              </label>
              <textarea
                id="fundamentacao_legal"
                name="fundamentacao_legal"
                className="form-control"
                rows="4"
                value={formData.fundamentacao_legal}
                onChange={handleChange}
                placeholder="Ex: Art. 39, inciso V do CDC; Art. 18 do Decreto 2.181/1997..."
                required
              />
              <small className="form-text text-muted">
                Cite todos os artigos, incisos e parágrafos aplicáveis
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="descricao_infracao">
                Descrição da Infração *
              </label>
              <textarea
                id="descricao_infracao"
                name="descricao_infracao"
                className="form-control"
                rows="5"
                value={formData.descricao_infracao}
                onChange={handleChange}
                placeholder="Descreva detalhadamente a infração constatada..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="artigos_infringidos">
                Artigos Infringidos <small>(Lista resumida)</small>
              </label>
              <input
                type="text"
                id="artigos_infringidos"
                name="artigos_infringidos"
                className="form-control"
                value={formData.artigos_infringidos}
                onChange={handleChange}
                placeholder="Ex: Art. 39, V; Art. 51, IV"
              />
            </div>

            <div className="form-group">
              <label htmlFor="valor_multa">
                Valor da Multa (R$) <small>(Opcional - pode ser calculado depois)</small>
              </label>
              <input
                type="number"
                id="valor_multa"
                name="valor_multa"
                className="form-control"
                value={formData.valor_multa}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              <small className="form-text text-muted">
                Se deixar em branco, o valor será calculado conforme Portaria vigente
              </small>
            </div>

            <div className="alert alert-info">
              <h6><i className="fas fa-info-circle"></i> O que acontecerá:</h6>
              <ul className="mb-0">
                <li>Um Auto de Infração será criado com numeração automática</li>
                <li>O PPA será marcado como "Concluído" com decisão "Auto Criado"</li>
                <li>Uma movimentação será registrada no PPA</li>
                <li>O processo administrativo será iniciado automaticamente</li>
              </ul>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-danger" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm mr-2"></span>
                  Criando AI...
                </>
              ) : (
                <>
                  <i className="fas fa-gavel"></i> Criar Auto de Infração
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CriarAIModal;

