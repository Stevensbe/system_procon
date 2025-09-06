import React, { useState, useEffect } from 'react';
import { 
  QrCodeIcon, 
  KeyIcon, 
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useTwoFactorAuth } from '../../utils/twoFactorAuth';

const TwoFactorSetup = ({ userId, email, onComplete }) => {
  const [step, setStep] = useState(1);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { setup2FA, validateCode, saveConfig } = useTwoFactorAuth();

  useEffect(() => {
    initialize2FA();
  }, []);

  const initialize2FA = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const setup = await setup2FA(email);
      setQrCode(setup.qrCode);
      setSecret(setup.secret);
      setBackupCodes(setup.backupCodes);
      setStep(2);
    } catch (error) {
      setError('Erro ao configurar 2FA. Tente novamente.');
      console.error('Erro ao configurar 2FA:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Digite um código de 6 dígitos válido.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const isValid = validateCode(secret, verificationCode);
      
      if (isValid) {
        // Salvar configuração
        saveConfig(userId, secret, backupCodes);
        setSuccess(true);
        setStep(3);
        
        if (onComplete) {
          onComplete();
        }
      } else {
        setError('Código inválido. Verifique e tente novamente.');
      }
    } catch (error) {
      setError('Erro ao verificar código. Tente novamente.');
      console.error('Erro ao verificar código:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupCodeVerification = async (backupCode) => {
    try {
      setIsLoading(true);
      setError('');

      // Verificar código de backup
      const isValid = backupCodes.includes(backupCode);
      
      if (isValid) {
        // Remover código usado
        const updatedCodes = backupCodes.filter(code => code !== backupCode);
        setBackupCodes(updatedCodes);
        
        // Salvar configuração
        saveConfig(userId, secret, updatedCodes);
        setSuccess(true);
        setStep(3);
        
        if (onComplete) {
          onComplete();
        }
      } else {
        setError('Código de backup inválido.');
      }
    } catch (error) {
      setError('Erro ao verificar código de backup.');
      console.error('Erro ao verificar código de backup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes-procon.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderStep1 = () => (
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900">
        <ShieldCheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
        Configurar Autenticação de Dois Fatores
      </h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Adicione uma camada extra de segurança à sua conta.
      </p>
      {isLoading && (
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Configurando 2FA...</p>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Escaneie o QR Code
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Use um aplicativo autenticador como Google Authenticator ou Authy
        </p>
      </div>

      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          {qrCode && (
            <img 
              src={qrCode} 
              alt="QR Code para 2FA" 
              className="w-48 h-48"
            />
          )}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <KeyIcon className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Chave Secreta (Manual)
          </span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 break-all font-mono">
          {secret}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Código de Verificação
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            maxLength={6}
          />
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={handleVerification}
            disabled={isLoading || verificationCode.length !== 6}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verificando...' : 'Verificar e Ativar'}
          </button>
          
          <button
            onClick={() => setStep(4)}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Usar Código de Backup
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="text-center space-y-4">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
        <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
        2FA Configurado com Sucesso!
      </h3>
      
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Sua conta agora está protegida com autenticação de dois fatores.
      </p>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
          Códigos de Backup
        </h4>
        <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
          Guarde estes códigos em um local seguro. Eles podem ser usados para acessar sua conta se você perder seu dispositivo.
        </p>
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          {backupCodes.map((code, index) => (
            <div 
              key={index}
              className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono text-center"
            >
              {code}
            </div>
          ))}
        </div>
        
        <button
          onClick={downloadBackupCodes}
          className="w-full bg-yellow-600 text-white px-3 py-2 rounded text-sm hover:bg-yellow-700"
        >
          Baixar Códigos de Backup
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Usar Código de Backup
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Digite um dos seus códigos de backup para ativar o 2FA
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Código de Backup
        </label>
        <input
          type="text"
          placeholder="Digite o código de backup"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          onChange={(e) => {
            const code = e.target.value.toUpperCase();
            if (code.length === 8) {
              handleBackupCodeVerification(code);
            }
          }}
          maxLength={8}
        />
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <button
        onClick={() => setStep(2)}
        className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
      >
        Voltar para QR Code
      </button>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
    </div>
  );
};

export default TwoFactorSetup;
