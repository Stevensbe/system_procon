import React from 'react';
import { useParams } from 'react-router-dom';
import AutoApreensaoForm from '../../components/fiscalizacao/AutoApreensaoForm';

const AutoApreensaoPage = () => {
    const { id } = useParams();

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {id ? 'Editar' : 'Novo'} Auto de Apreensão/Inutilização
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Formulário para criação de autos de apreensão ou inutilização de produtos.
                        <br />
                        <span className="text-blue-600 font-medium">
                            📱 Funcionalidade de escaneamento de código de barras disponível!
                        </span>
                    </p>
                </div>

                <AutoApreensaoForm />
            </div>
        </div>
    );
};

export default AutoApreensaoPage;
