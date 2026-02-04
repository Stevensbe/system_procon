#!/usr/bin/env python
"""
Script para configurar envio real de emails
"""
import os

def configurar_email():
    """Configurar envio real de emails"""
    
    print("=" * 60)
    print("📧 CONFIGURAÇÃO DE ENVIO REAL DE EMAILS")
    print("=" * 60)
    
    print("\nEscolha seu provedor de email:")
    print("1. Gmail")
    print("2. Outlook/Hotmail")
    print("3. Yahoo")
    print("4. Outro (SMTP personalizado)")
    
    opcao = input("\nDigite sua opção (1-4): ").strip()
    
    email = input("\nDigite seu email: ").strip()
    senha = input("Digite sua senha (ou senha de app): ").strip()
    
    config = {
        'EMAIL_BACKEND': 'django.core.mail.backends.smtp.EmailBackend',
        'EMAIL_HOST_USER': email,
        'EMAIL_HOST_PASSWORD': senha,
        'DEFAULT_FROM_EMAIL': f'Sistema PROCON-AM <{email}>',
        'SERVER_EMAIL': f'Sistema PROCON-AM <{email}>',
        'EMAIL_USE_TLS': 'True',
        'EMAIL_USE_SSL': 'False'
    }
    
    if opcao == '1':  # Gmail
        config.update({
            'EMAIL_HOST': 'smtp.gmail.com',
            'EMAIL_PORT': '587'
        })
        print("\n✅ Configurado para Gmail")
        print("📝 Lembre-se: Use uma 'Senha de app' do Gmail!")
        
    elif opcao == '2':  # Outlook
        config.update({
            'EMAIL_HOST': 'smtp-mail.outlook.com',
            'EMAIL_PORT': '587'
        })
        print("\n✅ Configurado para Outlook/Hotmail")
        
    elif opcao == '3':  # Yahoo
        config.update({
            'EMAIL_HOST': 'smtp.mail.yahoo.com',
            'EMAIL_PORT': '587'
        })
        print("\n✅ Configurado para Yahoo")
        print("📝 Lembre-se: Use uma 'Senha de app' do Yahoo!")
        
    elif opcao == '4':  # Personalizado
        host = input("Digite o servidor SMTP: ").strip()
        port = input("Digite a porta (geralmente 587): ").strip() or '587'
        config.update({
            'EMAIL_HOST': host,
            'EMAIL_PORT': port
        })
        print(f"\n✅ Configurado para {host}:{port}")
    
    # Criar arquivo .env
    env_content = f"""# Configuração de Email - Gerada automaticamente
EMAIL_BACKEND={config['EMAIL_BACKEND']}
EMAIL_HOST={config['EMAIL_HOST']}
EMAIL_PORT={config['EMAIL_PORT']}
EMAIL_USE_TLS={config['EMAIL_USE_TLS']}
EMAIL_USE_SSL={config['EMAIL_USE_SSL']}
EMAIL_HOST_USER={config['EMAIL_HOST_USER']}
EMAIL_HOST_PASSWORD={config['EMAIL_HOST_PASSWORD']}
DEFAULT_FROM_EMAIL={config['DEFAULT_FROM_EMAIL']}
SERVER_EMAIL={config['SERVER_EMAIL']}
"""
    
    try:
        with open('.env', 'w', encoding='utf-8') as f:
            f.write(env_content)
        
        print("\n" + "=" * 60)
        print("✅ CONFIGURAÇÃO SALVA COM SUCESSO!")
        print("=" * 60)
        print("\n📋 Próximos passos:")
        print("1. Reinicie o servidor Django")
        print("2. Teste criando um usuário pelo painel TI")
        print("3. Verifique se o email foi enviado")
        
        print(f"\n📧 Email configurado: {email}")
        print(f"🔧 Servidor: {config['EMAIL_HOST']}:{config['EMAIL_PORT']}")
        
    except Exception as e:
        print(f"\n❌ Erro ao salvar configuração: {str(e)}")
        print("\n💡 Dica: Crie o arquivo .env manualmente com as configurações acima")

if __name__ == '__main__':
    configurar_email()

