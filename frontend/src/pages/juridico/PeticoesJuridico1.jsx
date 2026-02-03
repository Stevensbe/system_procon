import React, { useState } from 'react';
import GestaoInterna from '../../components/peticionamento/GestaoInterna';
import PeticaoDetalhes from '../../components/peticionamento/PeticaoDetalhes';

const PeticoesJuridico1 = () => {
  const [peticaoSelecionada, setPeticaoSelecionada] = useState(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Jurídico 1 - Petições</h1>
        <p className="text-gray-600">
          Gestão de petições jurídicas recebidas via Portal do Cidadão.
        </p>
      </div>

      <GestaoInterna
        setorDestino="JURIDICO_1"
        onPeticaoSelect={(peticao) => setPeticaoSelecionada(peticao)}
      />

      {peticaoSelecionada && (
        <PeticaoDetalhes
          peticao={peticaoSelecionada}
          onClose={() => setPeticaoSelecionada(null)}
          onUpdate={() => setPeticaoSelecionada(null)}
        />
      )}
    </div>
  );
};

export default PeticoesJuridico1;
