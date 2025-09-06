import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi } from "../../services/auth";
import { 
  UserIcon, 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Efeito de luz ambiente (opcional)
  useEffect(() => {
    const handleMouseMove = (e) => {
      const card = document.querySelector('.login-card');
      if (!card) return;
      
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const angleX = (x - centerX) / centerX;
      const angleY = (y - centerY) / centerY;
      
      const shadowX = angleX * 30;
      const shadowY = angleY * 30;
      
      card.style.boxShadow = `
        ${shadowX}px ${shadowY}px 60px rgba(190, 195, 207, 0.4),
        ${-shadowX}px ${-shadowY}px 60px rgba(255, 255, 255, 0.6)
      `;
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Usuário é obrigatório';
    }
    
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 3) {
      newErrors.password = 'Senha deve ter pelo menos 3 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpa erros quando usuário digita
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Adiciona animação de shake nos campos com erro
      Object.keys(errors).forEach(field => {
        const input = document.getElementById(field);
        if (input) {
          input.style.animation = 'gentleShake 0.5s ease-in-out';
          setTimeout(() => {
            input.style.animation = '';
          }, 500);
        }
      });
      return;
    }

    setLoading(true);
    
    try {
      await loginApi(formData.username, formData.password);
      
      // Animação de sucesso
      setSuccess(true);
      
      // Simula delay para mostrar animação
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (err) {
      setErrors({ password: err.message || 'Erro ao fazer login' });
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-200 dark:bg-[#0c0f12] flex items-center justify-center p-5 transition-colors duration-300">
        <div className="login-card bg-gray-200 dark:bg-[#1a1d21] rounded-3xl p-12 text-center transition-colors duration-300" 
             style={{
               boxShadow: '20px 20px 60px rgba(190, 195, 207, 0.4), -20px -20px 60px rgba(255, 255, 255, 0.6)'
             }}>
          <div className="neu-icon bg-gray-200 dark:bg-[#1a1d21] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors duration-300"
               style={{
                 boxShadow: '8px 8px 20px rgba(190, 195, 207, 0.4), -8px -8px 20px rgba(255, 255, 255, 0.6), inset 4px 4px 10px rgba(190, 195, 207, 0.4), inset -4px -4px 10px rgba(255, 255, 255, 0.6)',
                 animation: 'successPulse 0.6s ease-out'
               }}>
            <CheckIcon className="w-10 h-10 text-green-600 dark:text-green-400 transition-colors duration-300" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-700 dark:text-white mb-2 transition-colors duration-300">Sucesso!</h3>
          <p className="text-gray-500 dark:text-gray-300 transition-colors duration-300">Redirecionando para o dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-[#0c0f12] flex items-center justify-center p-5 transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="login-card bg-gray-200 dark:bg-[#1a1d21] rounded-3xl p-12 transition-colors duration-300"
             style={{
               boxShadow: '20px 20px 60px rgba(190, 195, 207, 0.4), -20px -20px 60px rgba(255, 255, 255, 0.6)'
             }}>
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="neu-icon bg-gray-200 dark:bg-[#1a1d21] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors duration-300"
                 style={{
                   boxShadow: '8px 8px 20px rgba(190, 195, 207, 0.4), -8px -8px 20px rgba(255, 255, 255, 0.6)'
                 }}>
              <UserIcon className="w-10 h-10 text-gray-600 dark:text-gray-300 transition-colors duration-300" />
            </div>
            <h2 className="text-3xl font-semibold text-gray-700 dark:text-white mb-2 transition-colors duration-300">Bem-vindo</h2>
            <p className="text-gray-500 dark:text-gray-300 transition-colors duration-300">Sistema PROCON - Faça seu login</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-7">
            
            {/* Username Field */}
            <div className="form-group">
              <div className="neu-input bg-gray-200 dark:bg-[#1a1d21] rounded-2xl relative transition-colors duration-300"
                   style={{
                     boxShadow: 'inset 8px 8px 16px rgba(190, 195, 207, 0.4), inset -8px -8px 16px rgba(255, 255, 255, 0.6)',
                     transition: 'all 0.3s ease'
                   }}>
                <div className="absolute left-5 top-1/2 transform -translate-y-1/2">
                  <UserIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-colors duration-300" />
                </div>
                <input
                  type="text"
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full bg-transparent border-none py-5 px-14 text-gray-700 dark:text-white text-base font-medium outline-none placeholder-transparent transition-colors duration-300"
                  placeholder="Usuário"
                  required
                />
                <label 
                  htmlFor="username"
                  className={`absolute left-14 transition-all duration-300 pointer-events-none ${
                    formData.username 
                      ? 'top-2 text-xs text-gray-600 dark:text-gray-400 transform translate-y-0' 
                      : 'top-1/2 text-base text-gray-500 dark:text-gray-400 transform -translate-y-1/2'
                  }`}>
                  Usuário
                </label>
              </div>
              {errors.username && (
                <span className="block mt-2 ml-5 text-red-500 dark:text-red-400 text-sm font-medium opacity-100 transform translate-y-0 transition-colors duration-300"
                      style={{ animation: 'fadeIn 0.3s ease-out' }}>
                  {errors.username}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div className="neu-input bg-gray-200 dark:bg-[#1a1d21] rounded-2xl relative transition-colors duration-300"
                   style={{
                     boxShadow: 'inset 8px 8px 16px rgba(190, 195, 207, 0.4), inset -8px -8px 16px rgba(255, 255, 255, 0.6)',
                     transition: 'all 0.3s ease'
                   }}>
                <div className="absolute left-5 top-1/2 transform -translate-y-1/2">
                  <LockClosedIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-colors duration-300" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full bg-transparent border-none py-5 px-14 pr-16 text-gray-700 dark:text-white text-base font-medium outline-none placeholder-transparent transition-colors duration-300"
                  placeholder="Senha"
                  required
                />
                <label 
                  htmlFor="password"
                  className={`absolute left-14 transition-all duration-300 pointer-events-none ${
                    formData.password 
                      ? 'top-2 text-xs text-gray-600 dark:text-gray-400 transform translate-y-0' 
                      : 'top-1/2 text-base text-gray-500 dark:text-gray-400 transform -translate-y-1/2'
                  }`}>
                  Senha
                </label>
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-200 dark:bg-[#1a1d21] border-none w-9 h-9 rounded-xl cursor-pointer flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-300"
                  style={{
                    boxShadow: '4px 4px 10px rgba(190, 195, 207, 0.4), -4px -4px 10px rgba(255, 255, 255, 0.6)'
                  }}>
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="block mt-2 ml-5 text-red-500 dark:text-red-400 text-sm font-medium opacity-100 transform translate-y-0 transition-colors duration-300"
                      style={{ animation: 'fadeIn 0.3s ease-out' }}>
                  {errors.password}
                </span>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="hidden"
                />
                <div className={`w-6 h-6 bg-gray-200 dark:bg-[#1a1d21] rounded-lg flex items-center justify-center mr-3 transition-all duration-300 ${
                  rememberMe ? 'shadow-inner' : ''
                }`}
                     style={{
                       boxShadow: rememberMe 
                         ? 'inset 2px 2px 5px rgba(190, 195, 207, 0.4), inset -2px -2px 5px rgba(255, 255, 255, 0.6)'
                         : '3px 3px 8px rgba(190, 195, 207, 0.4), -3px -3px 8px rgba(255, 255, 255, 0.6)'
                     }}>
                  {rememberMe && (
                    <CheckIcon className="w-4 h-4 text-green-600 dark:text-green-400 transform scale-100 transition-transform duration-300" />
                  )}
                </div>
                <span className="text-gray-600 dark:text-gray-300 text-sm font-medium select-none transition-colors duration-300">Lembrar-me</span>
              </div>
              <a href="#" className="text-gray-600 dark:text-gray-300 text-sm font-medium hover:text-gray-800 dark:hover:text-gray-100 transition-colors duration-300">
                Esqueceu a senha?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gray-200 dark:bg-[#1a1d21] border-none rounded-2xl py-5 text-gray-700 dark:text-white text-base font-semibold cursor-pointer relative mb-8 transition-all duration-300 overflow-hidden ${
                loading ? 'pointer-events-none' : 'hover:transform hover:-translate-y-1'
              }`}
              style={{
                boxShadow: loading 
                  ? 'inset 4px 4px 10px rgba(190, 195, 207, 0.4), inset -4px -4px 10px rgba(255, 255, 255, 0.6)'
                  : '8px 8px 20px rgba(190, 195, 207, 0.4), -8px -8px 20px rgba(255, 255, 255, 0.6)'
              }}>
              
              <span className={`relative z-10 transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                Entrar
              </span>
              
              {loading && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-3 border-gray-400 dark:border-gray-500 border-t-gray-600 dark:border-t-gray-300 rounded-full animate-spin"></div>
                </div>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors duration-300">
              Sistema de Proteção ao Consumidor - PROCON AM
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gentleShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes successPulse {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }

        .neu-input:focus-within {
          box-shadow: inset 4px 4px 8px rgba(190, 195, 207, 0.4), inset -4px -4px 8px rgba(255, 255, 255, 0.6) !important;
        }

        .login-card:hover {
          transform: translateY(-5px);
          transition: transform 0.3s ease;
        }

        .form-group.error .neu-input {
          box-shadow: inset 8px 8px 16px rgba(255, 184, 196, 0.4), inset -8px -8px 16px rgba(255, 255, 255, 0.6), 0 0 0 2px #ff3b5c !important;
        }
      `}</style>
    </div>
  );
}

export default Login;