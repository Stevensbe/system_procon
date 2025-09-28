import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Building2, Search, Plus, Filter, Download, Eye, Edit, Trash2 } from 'lucide-react';
import empresasService from '../../services/empresasService';

const EmpresasPage = () => {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    search: '',
    situacao: '',
    porte: '',
    segmento: '',
    cidade: ''
  });
  const [portes, setPortes] = useState([]);
  const [segmentos, setSegmentos] = useState([]);
  const [cidades, setCidades] = useState([]);

  useEffect(() => {
    carregarEmpresas();
    carregarDadosAuxiliares();
  }, []);

  const carregarEmpresas = async () => {
    setLoading(true);
    try {
      const response = await empresasService.listarEmpresas(filtros);
      setEmpresas(response.results || response);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarDadosAuxiliares = async () => {
    try {
      const [portesData, segmentosData, cidadesData] = await Promise.all([
        empresasService.obterPortes(),
        empresasService.obterSegmentos(),
        empresasService.obterCidades()
      ]);
      
      setPortes(portesData);
      setSegmentos(segmentosData);
      setCidades(cidadesData);
    } catch (error) {
      console.error('Erro ao carregar dados auxiliares:', error);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const aplicarFiltros = () => {
    carregarEmpresas();
  };

  const limparFiltros = () => {
    setFiltros({
      search: '',
      situacao: '',
      porte: '',
      segmento: '',
      cidade: ''
    });
  };

  const exportarEmpresas = async () => {
    try {
      const blob = await empresasService.exportarEmpresas('xlsx', filtros);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'empresas.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar empresas:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            Empresas
          </h1>
          <p className="text-gray-600 mt-2">Gerencie o cadastro de empresas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportarEmpresas} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Empresa
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                placeholder="Nome, CNPJ..."
                value={filtros.search}
                onChange={(e) => handleFiltroChange('search', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="situacao">Situação</Label>
              <Select value={filtros.situacao} onValueChange={(value) => handleFiltroChange('situacao', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="suspensa">Suspensa</SelectItem>
                  <SelectItem value="inativa">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="porte">Porte</Label>
              <Select value={filtros.porte} onValueChange={(value) => handleFiltroChange('porte', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {portes.map((porte) => (
                    <SelectItem key={porte.id} value={porte.id}>
                      {porte.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="segmento">Segmento</Label>
              <Select value={filtros.segmento} onValueChange={(value) => handleFiltroChange('segmento', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {segmentos.map((segmento) => (
                    <SelectItem key={segmento.id} value={segmento.id}>
                      {segmento.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Select value={filtros.cidade} onValueChange={(value) => handleFiltroChange('cidade', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {cidades.map((cidade) => (
                    <SelectItem key={cidade} value={cidade}>
                      {cidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end gap-2">
              <Button onClick={aplicarFiltros} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              <Button onClick={limparFiltros} variant="outline">
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Empresas */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando empresas...</p>
            </div>
          ) : empresas.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma empresa encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {empresas.map((empresa) => (
                <div key={empresa.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{empresa.razao_social}</h3>
                    <p className="text-sm text-gray-600">
                      CNPJ: {empresa.cnpj} | 
                      {empresa.nome_fantasia && ` Fantasia: ${empresa.nome_fantasia} |`}
                      Cidade: {empresa.cidade} | 
                      Situação: <span className={`font-medium ${
                        empresa.situacao === 'ativa' ? 'text-green-600' : 
                        empresa.situacao === 'suspensa' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {empresa.situacao}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmpresasPage;
