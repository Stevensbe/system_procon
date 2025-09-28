import { Navigate, useParams } from 'react-router-dom';

const setorMap = {
  denuncias: '/caixa-denuncias',
  denuncia: '/caixa-denuncias',
  'fiscalizacao-denuncias': '/caixa-denuncias',
  fiscalizacao: '/caixa-fiscalizacao',
  fisc: '/caixa-fiscalizacao',
  'fiscalizacao-proprio': '/caixa-fiscalizacao',
  juridico: '/caixa-juridico-1',
  'juridico-1': '/caixa-juridico-1',
  juridico1: '/caixa-juridico-1',
  'juridico-2': '/caixa-juridico-2',
  juridico2: '/caixa-juridico-2',
  recursos: '/caixa-juridico-2',
  daf: '/caixa-daf',
  financeiro: '/caixa-daf',
};

function CaixaEntradaRedirect() {
  const params = useParams();
  const { setor, categoria } = params;

  const candidateKeys = [setor, categoria]
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  for (const key of candidateKeys) {
    if (setorMap[key]) {
      return <Navigate to={setorMap[key]} replace />;
    }
    const normalized = key.replace(/-+/g, '');
    if (setorMap[normalized]) {
      return <Navigate to={setorMap[normalized]} replace />;
    }
  }

  return <Navigate to="/caixa-denuncias" replace />;
}

export default CaixaEntradaRedirect;
