import { useCallback, useState } from 'react';
import caixaEntradaService from '../services/caixaEntradaService';

const normalizarLista = (dados, propriedade) => {
  if (!dados) {
    return [];
  }
  if (Array.isArray(dados)) {
    return dados;
  }
  if (propriedade && Array.isArray(dados[propriedade])) {
    return dados[propriedade];
  }
  if (Array.isArray(dados.results)) {
    return dados.results;
  }
  if (Array.isArray(dados.items)) {
    return dados.items;
  }
  return [];
};

const useDocumentoDetalhes = () => {
  const [modalAberto, setModalAberto] = useState(false);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);
  const [documentoDetalhes, setDocumentoDetalhes] = useState(null);
  const [historicoDocumento, setHistoricoDocumento] = useState([]);
  const [anexosDocumento, setAnexosDocumento] = useState([]);
  const [erroDetalhes, setErroDetalhes] = useState(null);

  const abrirDetalhes = useCallback(async (documentoId) => {
    if (!documentoId) {
      return;
    }

    setCarregandoDetalhes(true);
    setErroDetalhes(null);

    try {
      const documento = await caixaEntradaService.visualizarDocumento(documentoId);

      const [historicoResposta, anexosResposta] = await Promise.allSettled([
        caixaEntradaService.getHistoricoDocumento(documentoId),
        caixaEntradaService.getAnexosDocumento(documentoId)
      ]);

      const historico =
        historicoResposta.status === 'fulfilled'
          ? normalizarLista(historicoResposta.value, 'historico')
          : [];

      const anexos =
        anexosResposta.status === 'fulfilled'
          ? normalizarLista(anexosResposta.value, 'anexos')
          : [];

      setDocumentoDetalhes(documento);
      setHistoricoDocumento(historico);
      setAnexosDocumento(anexos);
      setModalAberto(true);
    } catch (error) {
      setErroDetalhes(error);
    } finally {
      setCarregandoDetalhes(false);
    }
  }, []);

  const fecharModal = useCallback(() => {
    setModalAberto(false);
  }, []);

  const limparErro = useCallback(() => {
    setErroDetalhes(null);
  }, []);

  return {
    modalAberto,
    carregandoDetalhes,
    documentoDetalhes,
    historicoDocumento,
    anexosDocumento,
    erroDetalhes,
    abrirDetalhes,
    fecharModal,
    limparErro,
  };
};

export default useDocumentoDetalhes;
