import React from 'react';
import { ProconCard } from './components/ui';

const TestProconCard = () => {
  return (
    <div className="p-4">
      <h1>Teste do ProconCard</h1>
      <ProconCard
        title="Teste"
        subtitle="Este é um teste"
        variant="primary"
      >
        <p>Conteúdo do card</p>
      </ProconCard>
    </div>
  );
};

export default TestProconCard;
