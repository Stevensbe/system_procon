// Sistema de Autenticação 2FA (Two-Factor Authentication)
import QRCode from 'qrcode';

export class TwoFactorAuth {
  // Gerar chave secreta para 2FA
  static generateSecretKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  // Gerar QR Code para configuração
  static async generateQRCode(secret, email) {
    const otpauth = `otpauth://totp/PROCON:${email}?secret=${secret}&issuer=PROCON&algorithm=SHA1&digits=6&period=30`;
    
    try {
      const qrCodeDataURL = await QRCode.toDataURL(otpauth);
      return qrCodeDataURL;
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      throw error;
    }
  }

  // Gerar código TOTP (Time-based One-Time Password)
  static generateTOTP(secret, time = Date.now()) {
    const timeStep = Math.floor(time / 30000); // 30 segundos
    const timeStepHex = timeStep.toString(16).padStart(16, '0');
    
    // Converter secret para bytes
    const secretBytes = this.base32ToBytes(secret);
    
    // Gerar HMAC-SHA1
    const hmac = this.hmacSHA1(secretBytes, this.hexToBytes(timeStepHex));
    
    // Extrair código de 6 dígitos
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code = ((hmac[offset] & 0x7f) << 24) |
                 ((hmac[offset + 1] & 0xff) << 16) |
                 ((hmac[offset + 2] & 0xff) << 8) |
                 (hmac[offset + 3] & 0xff);
    
    return (code % 1000000).toString().padStart(6, '0');
  }

  // Validar código 2FA
  static validateTOTP(secret, code) {
    const currentTime = Date.now();
    
    // Verificar código atual e próximos 2 períodos (tolerância de 1 minuto)
    for (let i = 0; i < 3; i++) {
      const time = currentTime + (i * 30000);
      const generatedCode = this.generateTOTP(secret, time);
      
      if (generatedCode === code) {
        return true;
      }
    }
    
    return false;
  }

  // Converter base32 para bytes
  static base32ToBytes(base32) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const bytes = [];
    let bits = 0;
    let value = 0;
    
    for (let i = 0; i < base32.length; i++) {
      const char = base32.charAt(i).toUpperCase();
      const index = alphabet.indexOf(char);
      
      if (index === -1) continue;
      
      value = (value << 5) | index;
      bits += 5;
      
      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 0xff);
        bits -= 8;
      }
    }
    
    return bytes;
  }

  // Converter hex para bytes
  static hexToBytes(hex) {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
  }

  // Implementação simplificada de HMAC-SHA1
  static hmacSHA1(key, message) {
    // Esta é uma implementação simplificada
    // Em produção, use uma biblioteca como crypto-js
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha1', Buffer.from(key));
    hmac.update(Buffer.from(message));
    return Array.from(hmac.digest());
  }

  // Configurar 2FA para usuário
  static async setup2FA(email) {
    const secret = this.generateSecretKey();
    const qrCode = await this.generateQRCode(secret, email);
    
    return {
      secret,
      qrCode,
      backupCodes: this.generateBackupCodes()
    };
  }

  // Gerar códigos de backup
  static generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substr(2, 8).toUpperCase());
    }
    return codes;
  }

  // Verificar código de backup
  static validateBackupCode(backupCodes, code) {
    const index = backupCodes.indexOf(code);
    if (index !== -1) {
      backupCodes.splice(index, 1); // Remove o código usado
      return true;
    }
    return false;
  }

  // Salvar configuração 2FA
  static save2FAConfig(userId, secret, backupCodes) {
    const config = {
      userId,
      secret,
      backupCodes,
      enabled: true,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem(`2fa_config_${userId}`, JSON.stringify(config));
    return config;
  }

  // Carregar configuração 2FA
  static load2FAConfig(userId) {
    const config = localStorage.getItem(`2fa_config_${userId}`);
    return config ? JSON.parse(config) : null;
  }

  // Desabilitar 2FA
  static disable2FA(userId) {
    localStorage.removeItem(`2fa_config_${userId}`);
  }

  // Verificar se 2FA está habilitado
  static is2FAEnabled(userId) {
    const config = this.load2FAConfig(userId);
    return config && config.enabled;
  }
}

// Hook para 2FA
export const useTwoFactorAuth = () => {
  const setup2FA = async (email) => {
    return await TwoFactorAuth.setup2FA(email);
  };

  const validateCode = (secret, code) => {
    return TwoFactorAuth.validateTOTP(secret, code);
  };

  const saveConfig = (userId, secret, backupCodes) => {
    return TwoFactorAuth.save2FAConfig(userId, secret, backupCodes);
  };

  const loadConfig = (userId) => {
    return TwoFactorAuth.load2FAConfig(userId);
  };

  const isEnabled = (userId) => {
    return TwoFactorAuth.is2FAEnabled(userId);
  };

  const disable = (userId) => {
    TwoFactorAuth.disable2FA(userId);
  };

  return {
    setup2FA,
    validateCode,
    saveConfig,
    loadConfig,
    isEnabled,
    disable
  };
};

export default TwoFactorAuth;
