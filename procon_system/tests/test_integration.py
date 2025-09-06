import pytest
from django.urls import reverse
from rest_framework import status
from decimal import Decimal
from datetime import date, timedelta

class TestMultaWorkflow:
    """Testes de integração para fluxo completo de multas"""
    
    def test_complete_multa_workflow(self, authenticated_client):
        """Testa fluxo completo: criar multa -> atualizar -> pagar"""
        # 1. Criar multa
        multa_data = {
            'numero_processo': 'PROC-2025-001',
            'valor': Decimal('1000.00'),
            'empresa': 'Empresa Teste LTDA',
            'cnpj': '12.345.678/0001-90',
            'motivo': 'Infração de proteção ao consumidor',
            'status': 'pendente'
        }
        
        create_url = reverse('api:multas-list')
        create_response = authenticated_client.post(create_url, multa_data)
        
        assert create_response.status_code == status.HTTP_201_CREATED
        multa_id = create_response.data['id']
        assert create_response.data['status'] == 'pendente'
        
        # 2. Atualizar multa
        update_url = reverse('api:multas-detail', kwargs={'pk': multa_id})
        update_data = {
            'valor': Decimal('1500.00'),
            'motivo': 'Infração atualizada'
        }
        
        update_response = authenticated_client.patch(update_url, update_data)
        
        assert update_response.status_code == status.HTTP_200_OK
        assert update_response.data['valor'] == '1500.00'
        assert update_response.data['motivo'] == 'Infração atualizada'
        
        # 3. Marcar como paga
        payment_data = {
            'status': 'pago',
            'data_pagamento': date.today().isoformat()
        }
        
        payment_response = authenticated_client.patch(update_url, payment_data)
        
        assert payment_response.status_code == status.HTTP_200_OK
        assert payment_response.data['status'] == 'pago'
        
        # 4. Verificar na listagem
        list_response = authenticated_client.get(create_url)
        
        assert list_response.status_code == status.HTTP_200_OK
        assert len(list_response.data['results']) > 0
        
        # Encontrar a multa na listagem
        multa_in_list = None
        for multa in list_response.data['results']:
            if multa['id'] == multa_id:
                multa_in_list = multa
                break
        
        assert multa_in_list is not None
        assert multa_in_list['status'] == 'pago'
    
    def test_multa_search_and_filter(self, authenticated_client):
        """Testa busca e filtros de multas"""
        # Criar várias multas com diferentes status
        multas_data = [
            {
                'numero_processo': 'PROC-2025-001',
                'valor': Decimal('1000.00'),
                'empresa': 'Empresa A LTDA',
                'cnpj': '12.345.678/0001-90',
                'motivo': 'Infração A',
                'status': 'pendente'
            },
            {
                'numero_processo': 'PROC-2025-002',
                'valor': Decimal('2000.00'),
                'empresa': 'Empresa B LTDA',
                'cnpj': '98.765.432/0001-10',
                'motivo': 'Infração B',
                'status': 'pago'
            },
            {
                'numero_processo': 'PROC-2025-003',
                'valor': Decimal('3000.00'),
                'empresa': 'Empresa C LTDA',
                'cnpj': '11.222.333/0001-44',
                'motivo': 'Infração C',
                'status': 'vencido'
            }
        ]
        
        create_url = reverse('api:multas-list')
        for multa_data in multas_data:
            response = authenticated_client.post(create_url, multa_data)
            assert response.status_code == status.HTTP_201_CREATED
        
        # Testar busca por empresa
        search_url = reverse('api:multas-search')
        search_params = {'q': 'Empresa A'}
        response = authenticated_client.get(search_url, search_params)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert 'Empresa A' in response.data['results'][0]['empresa']
        
        # Testar filtro por status
        filter_params = {'status': 'pendente'}
        response = authenticated_client.get(search_url, filter_params)
        
        assert response.status_code == status.HTTP_200_OK
        for multa in response.data['results']:
            assert multa['status'] == 'pendente'
        
        # Testar filtro por valor
        value_params = {'valor_min': 2000, 'valor_max': 4000}
        response = authenticated_client.get(search_url, value_params)
        
        assert response.status_code == status.HTTP_200_OK
        for multa in response.data['results']:
            valor = Decimal(multa['valor'])
            assert valor >= 2000 and valor <= 4000

class TestFinanceiroWorkflow:
    """Testes de integração para fluxo financeiro"""
    
    def test_financeiro_dashboard_integration(self, authenticated_client):
        """Testa integração do dashboard financeiro"""
        # Criar algumas multas para gerar dados
        multas_data = [
            {
                'numero_processo': 'PROC-2025-001',
                'valor': Decimal('1000.00'),
                'empresa': 'Empresa A LTDA',
                'cnpj': '12.345.678/0001-90',
                'motivo': 'Infração A',
                'status': 'pendente'
            },
            {
                'numero_processo': 'PROC-2025-002',
                'valor': Decimal('2000.00'),
                'empresa': 'Empresa B LTDA',
                'cnpj': '98.765.432/0001-10',
                'motivo': 'Infração B',
                'status': 'pago'
            },
            {
                'numero_processo': 'PROC-2025-003',
                'valor': Decimal('3000.00'),
                'empresa': 'Empresa C LTDA',
                'cnpj': '11.222.333/0001-44',
                'motivo': 'Infração C',
                'status': 'vencido'
            }
        ]
        
        # Criar multas
        create_url = reverse('api:multas-list')
        for multa_data in multas_data:
            response = authenticated_client.post(create_url, multa_data)
            assert response.status_code == status.HTTP_201_CREATED
        
        # Testar dashboard
        dashboard_url = reverse('api:financeiro-dashboard')
        response = authenticated_client.get(dashboard_url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'arrecadacao_mes' in response.data
        assert 'total_pendente' in response.data
        assert 'total_atraso' in response.data
        assert 'taxa_conversao' in response.data
        
        # Verificar se os valores fazem sentido
        assert response.data['total_pendente'] >= 0
        assert response.data['total_atraso'] >= 0
        assert 0 <= response.data['taxa_conversao'] <= 100
    
    def test_financeiro_relatorios_integration(self, authenticated_client):
        """Testa integração dos relatórios financeiros"""
        # Criar multas com diferentes datas
        hoje = date.today()
        ontem = hoje - timedelta(days=1)
        semana_passada = hoje - timedelta(days=7)
        
        multas_data = [
            {
                'numero_processo': 'PROC-2025-001',
                'valor': Decimal('1000.00'),
                'empresa': 'Empresa A LTDA',
                'cnpj': '12.345.678/0001-90',
                'motivo': 'Infração A',
                'status': 'pendente',
                'data_emissao': hoje.isoformat()
            },
            {
                'numero_processo': 'PROC-2025-002',
                'valor': Decimal('2000.00'),
                'empresa': 'Empresa B LTDA',
                'cnpj': '98.765.432/0001-10',
                'motivo': 'Infração B',
                'status': 'pago',
                'data_emissao': ontem.isoformat()
            },
            {
                'numero_processo': 'PROC-2025-003',
                'valor': Decimal('3000.00'),
                'empresa': 'Empresa C LTDA',
                'cnpj': '11.222.333/0001-44',
                'motivo': 'Infração C',
                'status': 'vencido',
                'data_emissao': semana_passada.isoformat()
            }
        ]
        
        # Criar multas
        create_url = reverse('api:multas-list')
        for multa_data in multas_data:
            response = authenticated_client.post(create_url, multa_data)
            assert response.status_code == status.HTTP_201_CREATED
        
        # Testar relatório por período
        relatorios_url = reverse('api:financeiro-relatorios')
        params = {
            'data_inicio': semana_passada.isoformat(),
            'data_fim': hoje.isoformat(),
            'status': 'pendente'
        }
        
        response = authenticated_client.get(relatorios_url, params)
        
        assert response.status_code == status.HTTP_200_OK
        assert_pagination(response)
        
        # Verificar se os resultados estão no período correto
        for multa in response.data['results']:
            data_emissao = date.fromisoformat(multa['data_emissao'])
            assert semana_passada <= data_emissao <= hoje
            assert multa['status'] == 'pendente'

class TestFiscalizacaoWorkflow:
    """Testes de integração para fluxo de fiscalização"""
    
    def test_fiscalizacao_complete_workflow(self, authenticated_client):
        """Testa fluxo completo de fiscalização"""
        # 1. Criar fiscalização
        fiscalizacao_data = {
            'tipo': 'supermercado',
            'empresa': 'Supermercado Teste LTDA',
            'cnpj': '12.345.678/0001-90',
            'endereco': 'Rua Teste, 123',
            'data_fiscalizacao': date.today().isoformat(),
            'status': 'agendada'
        }
        
        create_url = reverse('api:fiscalizacao-list')
        create_response = authenticated_client.post(create_url, fiscalizacao_data)
        
        assert create_response.status_code == status.HTTP_201_CREATED
        fiscalizacao_id = create_response.data['id']
        assert create_response.data['status'] == 'agendada'
        
        # 2. Atualizar para em andamento
        update_url = reverse('api:fiscalizacao-detail', kwargs={'pk': fiscalizacao_id})
        update_data = {
            'status': 'em_andamento',
            'observacoes': 'Fiscalização iniciada'
        }
        
        update_response = authenticated_client.patch(update_url, update_data)
        
        assert update_response.status_code == status.HTTP_200_OK
        assert update_response.data['status'] == 'em_andamento'
        
        # 3. Finalizar fiscalização
        finalize_data = {
            'status': 'concluida',
            'observacoes': 'Fiscalização concluída com sucesso',
            'resultado': 'sem_infracoes'
        }
        
        finalize_response = authenticated_client.patch(update_url, finalize_data)
        
        assert finalize_response.status_code == status.HTTP_200_OK
        assert finalize_response.data['status'] == 'concluida'
        
        # 4. Verificar na listagem
        list_response = authenticated_client.get(create_url)
        
        assert list_response.status_code == status.HTTP_200_OK
        assert len(list_response.data['results']) > 0
        
        # Encontrar a fiscalização na listagem
        fiscalizacao_in_list = None
        for fiscalizacao in list_response.data['results']:
            if fiscalizacao['id'] == fiscalizacao_id:
                fiscalizacao_in_list = fiscalizacao
                break
        
        assert fiscalizacao_in_list is not None
        assert fiscalizacao_in_list['status'] == 'concluida'

class TestAuthenticationWorkflow:
    """Testes de integração para fluxo de autenticação"""
    
    def test_complete_auth_workflow(self, api_client):
        """Testa fluxo completo de autenticação"""
        # 1. Registrar usuário
        user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User'
        }
        
        register_url = reverse('auth:register')
        register_response = api_client.post(register_url, user_data)
        
        assert register_response.status_code == status.HTTP_201_CREATED
        assert 'user' in register_response.data
        assert 'tokens' in register_response.data
        
        # 2. Fazer login
        login_url = reverse('auth:login')
        login_data = {
            'username': user_data['username'],
            'password': user_data['password']
        }
        
        login_response = api_client.post(login_url, login_data)
        
        assert login_response.status_code == status.HTTP_200_OK
        assert 'access' in login_response.data
        assert 'refresh' in login_response.data
        
        # 3. Usar token para acessar endpoint protegido
        access_token = login_response.data['access']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        protected_url = reverse('test_api')
        protected_response = api_client.get(protected_url)
        
        assert protected_response.status_code == status.HTTP_200_OK
        
        # 4. Atualizar perfil
        profile_url = reverse('auth:profile')
        profile_data = {
            'first_name': 'Updated',
            'last_name': 'Name'
        }
        
        profile_response = api_client.patch(profile_url, profile_data)
        
        assert profile_response.status_code == status.HTTP_200_OK
        assert profile_response.data['first_name'] == 'Updated'
        assert profile_response.data['last_name'] == 'Name'
        
        # 5. Fazer logout
        logout_url = reverse('auth:logout')
        logout_response = api_client.post(logout_url)
        
        assert logout_response.status_code == status.HTTP_200_OK
        
        # 6. Verificar que token não funciona mais
        invalid_response = api_client.get(protected_url)
        assert invalid_response.status_code == status.HTTP_401_UNAUTHORIZED

class TestErrorHandlingIntegration:
    """Testes de integração para tratamento de erros"""
    
    def test_error_handling_throughout_workflow(self, authenticated_client):
        """Testa tratamento de erros em fluxo completo"""
        # 1. Tentar criar multa com dados inválidos
        invalid_multa_data = {
            'numero_processo': '',  # Campo obrigatório vazio
            'valor': 'invalid_value',  # Valor inválido
            'cnpj': 'invalid_cnpj'  # CNPJ inválido
        }
        
        create_url = reverse('api:multas-list')
        response = authenticated_client.post(create_url, invalid_multa_data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data or 'detail' in response.data
        
        # 2. Tentar acessar multa inexistente
        detail_url = reverse('api:multas-detail', kwargs={'pk': 99999})
        response = authenticated_client.get(detail_url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert 'detail' in response.data
        
        # 3. Tentar atualizar multa inexistente
        update_data = {'status': 'pago'}
        response = authenticated_client.patch(detail_url, update_data)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
        # 4. Tentar deletar multa inexistente
        response = authenticated_client.delete(detail_url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_rate_limiting_integration(self, api_client):
        """Testa rate limiting em fluxo completo"""
        # Fazer várias requisições rapidamente
        url = reverse('test_api')
        responses = []
        
        for _ in range(20):  # Mais que o limite
            response = api_client.get(url)
            responses.append(response)
        
        # Verificar se alguma requisição foi limitada
        status_codes = [r.status_code for r in responses]
        assert 429 in status_codes  # Too Many Requests
        
        # Verificar que algumas requisições ainda funcionam
        assert 200 in status_codes  # Algumas devem ter sucesso
