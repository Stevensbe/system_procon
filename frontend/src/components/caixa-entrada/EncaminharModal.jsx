import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ProconButton, ProconSelect, ProconInput, ProconTextarea } from '../ui';
import caixaEntradaService from '../../services/caixaEntradaService';

const SETORES_PADRAO = [
  { value: 'FISCALIZACAO', label: 'Fiscalizacao' },
  { value: 'FISCALIZACAO_DENUNCIAS', label: 'Fiscalizacao - Denuncias' },
  { value: 'FISCALIZACAO_PROPRIO', label: 'Fiscalizacao - Proprio Setor' },
  { value: 'JURIDICO', label: 'Juridico' },
  { value: 'JURIDICO_1', label: 'Juridico 1' },
  { value: 'JURIDICO_2_RECURSOS', label: 'Juridico 2 - Recursos' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
  { value: 'DIRETORIA', label: 'Diretoria' },
  { value: 'ATENDIMENTO', label: 'Atendimento' },
];

const EncaminharModal = ({
  open,
  onClose,
  onConfirm,
  documento,
  setores = SETORES_PADRAO,
}) => {
  const [setorDestino, setSetorDestino] = useState('FISCALIZACAO');
  const [observacoes, setObservacoes] = useState('Encaminhado pela Caixa de Denuncias');
  const [responsavelId, setResponsavelId] = useState('');
  const [buscaUsuario, setBuscaUsuario] = useState('');
  const [destinatarios, setDestinatarios] = useState([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
  const [erroUsuarios, setErroUsuarios] = useState('');

  const carregarDestinatarios = useCallback(async (termo = '', setorFiltro = '') => {
    setCarregandoUsuarios(true);
    setErroUsuarios('');
    try {
      const filtros = {};
      if (termo) filtros.search = termo;
      if (setorFiltro) filtros.setor = setorFiltro;
      const resposta = await caixaEntradaService.listarDestinatarios(filtros);
      const lista = Array.isArray(resposta?.results) ? resposta.results : [];
      setDestinatarios(lista);
    } catch (error) {
      console.error('Erro ao carregar destinatarios:', error);
      setErroUsuarios('Nao foi possivel carregar a lista de usuarios.');
      setDestinatarios([]);
    } finally {
      setCarregandoUsuarios(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      const setorPadrao = 'FISCALIZACAO';
      setSetorDestino(setorPadrao);
      setObservacoes('Encaminhado pela Caixa de Denuncias');
      setResponsavelId('');
      setBuscaUsuario('');
      carregarDestinatarios('', setorPadrao);
    }
  }, [open, carregarDestinatarios]);

  if (!open) {
    return null;
  }

  const destinatarioOptions = useMemo(() => {
    const itens = destinatarios.map((usuario) => {
      const nomeBase = (usuario.nome && usuario.nome.trim()) || usuario.username;
      const alias = usuario.username && usuario.username !== nomeBase ? ` (${usuario.username})` : '';
      const gruposResumo = Array.isArray(usuario.grupos) && usuario.grupos.length
        ? ` - ${usuario.grupos.join(', ')}`
        : '';
      return {
        value: String(usuario.id),
        label: `${nomeBase}${alias}${gruposResumo}`,
      };
    });
    return [{ value: '', label: 'Selecione um usuario' }, ...itens];
  }, [destinatarios]);

  const handleTrocarSetor = (event) => {
    const novoSetor = event.target.value;
    setSetorDestino(novoSetor);
    carregarDestinatarios(buscaUsuario, novoSetor);
  };

  const handleBuscarUsuarios = () => {
    carregarDestinatarios(buscaUsuario, setorDestino);
  };

  const handleConfirmar = () => {
    if (!setorDestino) {
      return;
    }

    const payload = {
      setor_destino: setorDestino,
      observacoes,
    };

    if (responsavelId) {
      payload.responsavel = Number(responsavelId);
    }

    onConfirm(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Encaminhar documento</h2>
            {documento?.assunto && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{documento.assunto}</p>
            )}
          </div>
          <button
            type="button"
            className="rounded-full p-1 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={onClose}
            aria-label="Fechar"
          >
            x
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <ProconSelect
            label="Setor destino"
            value={setorDestino}
            onChange={handleTrocarSetor}
            options={setores.map((item) => ({ value: item.value, label: item.label }))}
            required
          />

          <div className="space-y-2">
            <div className="flex items-end gap-3">
              <ProconInput
                label="Buscar usuario"
                placeholder="Digite parte do nome ou login"
                value={buscaUsuario}
                onChange={(event) => setBuscaUsuario(event.target.value)}
              />
              <ProconButton onClick={handleBuscarUsuarios} variant="outline">
                Buscar
              </ProconButton>
            </div>
            {carregandoUsuarios && (
              <p className="text-xs text-gray-500 dark:text-gray-400">Carregando usuarios...</p>
            )}
            {erroUsuarios && (
              <p className="text-xs text-red-600 dark:text-red-400">{erroUsuarios}</p>
            )}
            <ProconSelect
              label="Encaminhar para pessoa (opcional)"
              value={responsavelId}
              onChange={(event) => setResponsavelId(event.target.value)}
              options={destinatarioOptions}
            />
            {!carregandoUsuarios && !erroUsuarios && destinatarios.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Nenhum usuario encontrado com os filtros atuais.
              </p>
            )}
          </div>

          <ProconTextarea
            label="Observacoes"
            rows={3}
            value={observacoes}
            onChange={(event) => setObservacoes(event.target.value)}
          />
        </div>

        <div className="flex items-center justify-end space-x-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <ProconButton variant="outline" onClick={onClose}>
            Cancelar
          </ProconButton>
          <ProconButton onClick={handleConfirmar} disabled={carregandoUsuarios}>
            Confirmar encaminhamento
          </ProconButton>
        </div>
      </div>
    </div>
  );
};

export default EncaminharModal;
