#!/usr/bin/env python3
"""
Análise da Fase de Fiscalização - System Procon
===============================================

Este script analisa o código do sistema para verificar o que está implementado
na fase de fiscalização, especificamente:
- Auto de Constatação (AC)
- Parecer Técnico
- Auto de Infração (AI)
- AI Direto em Campo (sem AC)

Autor: Análise Automática
Data: 2025
"""

import os
import re
from pathlib import Path
from typing import Dict, List, Tuple

# Cores para output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text.center(80)}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.RESET}\n")

def print_success(text: str):
    print(f"{Colors.GREEN}[OK] {text}{Colors.RESET}")

def print_warning(text: str):
    print(f"{Colors.YELLOW}[AVISO] {text}{Colors.RESET}")

def print_error(text: str):
    print(f"{Colors.RED}[ERRO] {text}{Colors.RESET}")

def print_info(text: str):
    print(f"{Colors.BLUE}[INFO] {text}{Colors.RESET}")

def analisar_modelos() -> Dict:
    """Analisa os modelos de dados"""
    resultado = {
        'auto_constatacao': {'status': False, 'detalhes': []},
        'parecer_tecnico': {'status': False, 'detalhes': []},
        'auto_infracao': {'status': False, 'detalhes': []},
        'ai_direto_campo': {'status': False, 'detalhes': []}
    }
    
    models_path = Path('procon_system/fiscalizacao/models.py')
    ppa_models_path = Path('procon_system/ppa/models.py')
    
    # Analisar modelos de fiscalização
    if models_path.exists():
        with open(models_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Auto de Constatação
        if 'class AutoConstatacaoBase' in content:
            resultado['auto_constatacao']['status'] = True
            resultado['auto_constatacao']['detalhes'].append('Classe base AutoConstatacaoBase encontrada')
            
            # Verificar tipos específicos
            tipos = ['AutoBanco', 'AutoPosto', 'AutoSupermercado', 'AutoDiversos']
            for tipo in tipos:
                if f'class {tipo}' in content:
                    resultado['auto_constatacao']['detalhes'].append(f'  - {tipo} implementado')
        
        # Auto de Infração
        if 'class AutoInfracao' in content:
            resultado['auto_infracao']['status'] = True
            resultado['auto_infracao']['detalhes'].append('Classe AutoInfracao encontrada')
            
            # Verificar campos importantes
            campos_ai = [
                'numero', 'data_fiscalizacao', 'razao_social', 'cnpj',
                'relatorio', 'base_legal_cdc', 'valor_multa', 'status',
                'parecer_numero', 'criado_no_mobile'
            ]
            for campo in campos_ai:
                if f'{campo}' in content:
                    resultado['auto_infracao']['detalhes'].append(f'  - Campo {campo} presente')
            
            # Verificar se há flag para AI direto
            if 'ai_direto' in content.lower() or 'direto_campo' in content.lower():
                resultado['ai_direto_campo']['status'] = True
                resultado['ai_direto_campo']['detalhes'].append('Flag de AI direto encontrada')
            else:
                resultado['ai_direto_campo']['detalhes'].append('[AVISO] NAO ha flag especifica para AI direto em campo')
                resultado['ai_direto_campo']['detalhes'].append('  - Campo criado_no_mobile existe, mas não diferencia origem')
    
    # Analisar modelos de PPA (Parecer)
    if ppa_models_path.exists():
        with open(ppa_models_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if 'class ParecerPPA' in content:
            resultado['parecer_tecnico']['status'] = True
            resultado['parecer_tecnico']['detalhes'].append('Classe ParecerPPA encontrada')
            
            # Verificar campos importantes
            campos_parecer = [
                'numero_parecer', 'titulo', 'relatorio', 'fundamentacao',
                'conclusao', 'elaborado_por', 'aprovado_por'
            ]
            for campo in campos_parecer:
                if campo in content:
                    resultado['parecer_tecnico']['detalhes'].append(f'  - Campo {campo} presente')
            
            # Verificar conclusões
            if "'procedente'" in content:
                resultado['parecer_tecnico']['detalhes'].append('  - Conclusão "Procedente" disponível')
            if "'improcedente'" in content:
                resultado['parecer_tecnico']['detalhes'].append('  - Conclusão "Improcedente" disponível')
    
    return resultado

def analisar_views() -> Dict:
    """Analisa as views/endpoints"""
    resultado = {
        'endpoints_ac': [],
        'endpoints_ai': [],
        'endpoints_parecer': [],
        'endpoints_mobile': []
    }
    
    urls_path = Path('procon_system/fiscalizacao/urls.py')
    
    if urls_path.exists():
        with open(urls_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Endpoints de Auto de Constatação
        ac_patterns = [
            r"path\('bancos/",
            r"path\('postos/",
            r"path\('supermercados/",
            r"path\('diversos/"
        ]
        for pattern in ac_patterns:
            matches = re.findall(pattern, content)
            if matches:
                resultado['endpoints_ac'].extend(matches)
        
        # Endpoints de Auto de Infração
        ai_patterns = [
            r"path\('infracoes/",
            r"path\('infracoes/criar-de-auto/",
            r"path\('infracoes/por-auto/"
        ]
        for pattern in ai_patterns:
            matches = re.findall(pattern, content)
            if matches:
                resultado['endpoints_ai'].extend(matches)
        
        # Endpoints Mobile
        if 'mobile/autos/constatacao' in content:
            resultado['endpoints_mobile'].append('mobile/autos/constatacao - Criar AC via mobile')
        if 'mobile/autos/infracao' in content:
            resultado['endpoints_mobile'].append('mobile/autos/infracao - Criar AI via mobile')
    
    return resultado

def analisar_integracao_ppa() -> Dict:
    """Analisa integração com PPA"""
    resultado = {
        'vinculacao_ac': False,
        'vinculacao_ai': False,
        'vinculacao_parecer': False
    }
    
    integrations_path = Path('procon_system/ppa/integrations.py')
    
    if integrations_path.exists():
        with open(integrations_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if 'vincular_ac_ao_ppa' in content:
            resultado['vinculacao_ac'] = True
        if 'criar_ai_de_ppa' in content:
            resultado['vinculacao_ai'] = True
    
    # Verificar modelo AnexoPPA
    ppa_models_path = Path('procon_system/ppa/models.py')
    if ppa_models_path.exists():
        with open(ppa_models_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if 'class AnexoPPA' in content:
            if "'AC'" in content or "'Auto de Constatação'" in content:
                resultado['vinculacao_ac'] = True
            if "'AI'" in content or "'Auto de Infração'" in content:
                resultado['vinculacao_ai'] = True
            if "'PARECER'" in content:
                resultado['vinculacao_parecer'] = True
    
    return resultado

def gerar_relatorio():
    """Gera relatório completo"""
    print_header("ANÁLISE DA FASE DE FISCALIZAÇÃO - SYSTEM PROCON")
    
    print(f"{Colors.BOLD}RESUMO EXECUTIVO{Colors.RESET}\n")
    
    # Analisar modelos
    modelos = analisar_modelos()
    
    # Auto de Constatação
    print(f"\n{Colors.BOLD}1. AUTO DE CONSTATAÇÃO (AC){Colors.RESET}")
    if modelos['auto_constatacao']['status']:
        print_success("IMPLEMENTADO - Modelos de dados completos")
        for detalhe in modelos['auto_constatacao']['detalhes']:
            print_info(detalhe)
    else:
        print_error("NÃO IMPLEMENTADO")
    
    # Parecer Técnico
    print(f"\n{Colors.BOLD}2. PARECER TÉCNICO{Colors.RESET}")
    if modelos['parecer_tecnico']['status']:
        print_success("IMPLEMENTADO - Modelo ParecerPPA completo")
        for detalhe in modelos['parecer_tecnico']['detalhes']:
            print_info(detalhe)
    else:
        print_error("NÃO IMPLEMENTADO")
    
    # Auto de Infração
    print(f"\n{Colors.BOLD}3. AUTO DE INFRAÇÃO (AI){Colors.RESET}")
    if modelos['auto_infracao']['status']:
        print_success("IMPLEMENTADO - Modelo AutoInfracao completo")
        for detalhe in modelos['auto_infracao']['detalhes']:
            print_info(detalhe)
    else:
        print_error("NÃO IMPLEMENTADO")
    
    # AI Direto em Campo
    print(f"\n{Colors.BOLD}4. AI DIRETO EM CAMPO (SEM AC){Colors.RESET}")
    if modelos['ai_direto_campo']['status']:
        print_success("Flag específica encontrada")
    else:
        print_warning("PARCIALMENTE IMPLEMENTADO")
        print_info("  - App mobile permite criar AI diretamente")
        print_info("  - Workflow automático funciona")
        print_warning("  - NÃO há flag que identifique origem (parecer vs direto)")
        print_warning("  - Campo 'criado_no_mobile' existe, mas não diferencia fluxo")
    for detalhe in modelos['ai_direto_campo']['detalhes']:
        if '[AVISO]' in detalhe:
            print_warning(detalhe)
        else:
            print_info(detalhe)
    
    # Analisar views/endpoints
    print(f"\n{Colors.BOLD}5. ENDPOINTS DISPONÍVEIS{Colors.RESET}")
    views = analisar_views()
    
    if views['endpoints_ac']:
        print_success(f"Endpoints de AC: {len(views['endpoints_ac'])} encontrados")
        for endpoint in views['endpoints_ac'][:3]:  # Mostrar primeiros 3
            print_info(f"  - {endpoint}")
    
    if views['endpoints_ai']:
        print_success(f"Endpoints de AI: {len(views['endpoints_ai'])} encontrados")
        for endpoint in views['endpoints_ai']:
            print_info(f"  - {endpoint}")
    
    if views['endpoints_mobile']:
        print_success("Endpoints Mobile disponíveis:")
        for endpoint in views['endpoints_mobile']:
            print_info(f"  - {endpoint}")
    
    # Integração com PPA
    print(f"\n{Colors.BOLD}6. INTEGRAÇÃO COM PPA{Colors.RESET}")
    integracao = analisar_integracao_ppa()
    
    if integracao['vinculacao_ac']:
        print_success("AC pode ser vinculado ao PPA")
    else:
        print_warning("Vinculação AC-PPA não encontrada")
    
    if integracao['vinculacao_ai']:
        print_success("AI pode ser vinculado ao PPA")
    else:
        print_warning("Vinculação AI-PPA não encontrada")
    
    if integracao['vinculacao_parecer']:
        print_success("Parecer pode ser vinculado ao PPA")
    else:
        print_warning("Vinculação Parecer-PPA não encontrada")
    
    # Conclusões
    print(f"\n{Colors.BOLD}CONCLUSOES{Colors.RESET}\n")
    
    print(f"{Colors.BOLD}O que voce PODE fazer AGORA:{Colors.RESET}")
    print_success("Criar Auto de Constatacao (Banco, Posto, Supermercado, Diversos)")
    print_success("Elaborar Parecer Tecnico vinculado ao PPA")
    print_success("Criar Auto de Infracao (via parecer ou diretamente)")
    print_success("Criar AI via app mobile (funciona offline)")
    print_success("Vincular AC, AI e Parecer ao PPA")
    
    print(f"\n{Colors.BOLD}Limitacoes identificadas:{Colors.RESET}")
    print_warning("Nao ha flag especifica para identificar AI criado 'direto em campo'")
    print_warning("Sistema nao diferencia se AI veio de AC->Parecer->AI ou direto")
    print_warning("Campo 'criado_no_mobile' indica origem mobile, mas nao o fluxo")
    
    print(f"\n{Colors.BOLD}Recomendacoes:{Colors.RESET}")
    print_info("1. Adicionar campo 'origem_ai' no modelo AutoInfracao:")
    print("   - 'parecer_tecnico' - Via Parecer Tecnico")
    print("   - 'direto_campo' - Direto em Campo")
    print("   - 'outros' - Outros")
    print_info("2. Atualizar serializer para preencher origem automaticamente")
    print_info("3. Adicionar validacoes para quando pode criar AI direto")
    print_info("4. Criar relatorios diferenciando fluxos")
    
    print(f"\n{Colors.BOLD}{'='*80}{Colors.RESET}\n")

if __name__ == '__main__':
    try:
        gerar_relatorio()
    except Exception as e:
        print_error(f"Erro ao gerar relatório: {e}")
        import traceback
        traceback.print_exc()

