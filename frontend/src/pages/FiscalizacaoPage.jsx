import React, { useState, useCallback } from 'react';
import CriarAutoForm from '../components/fiscalizacao/CriarAutoForm';
import ListaAutos from '../components/fiscalizacao/ListaAutos';

function FiscalizacaoPage() {
  const [keyForListaAutos, setKeyForListaAutos] = useState(0);

  const handleAutoCriado = useCallback(() => {
    // Esta função é chamada pelo CriarAutoForm após um auto ser criado com sucesso.
    // Atualizar a chave do ListaAutos força o componente a remontar e buscar os dados mais recentes.
    setKeyForListaAutos(prevKey => prevKey + 1);
    console.log("FiscalizacaoPage: Auto criado, atualizando key da lista para:", keyForListaAutos + 1);
  }, [keyForListaAutos]);

  console.log("FiscalizacaoPage: Renderizando...");

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Módulo de Fiscalização</h1>
      </div>

      <div className="mb-8">
        {/* Formulário para criar um novo auto de constatação */}
        <CriarAutoForm onAutoCriado={handleAutoCriado} />
      </div>

      <div>
        {/* Lista de autos de constatação. A 'key' garante que ele será recriado quando o valor mudar. */}
        <ListaAutos key={keyForListaAutos} />
      </div>
    </div>
  );
}