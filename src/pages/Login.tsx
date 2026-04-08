import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { AuthFormCard } from '../components/auth/AuthFormCard';
import { AuthHeroPanel } from '../components/auth/AuthHeroPanel';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password);
        await login(email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7fa] px-4 py-4 font-['Public_Sans',sans-serif] text-[#5d596c] sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1480px] grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <AuthHeroPanel />
        <AuthFormCard
          email={email}
          password={password}
          showPassword={showPassword}
          isRegister={isRegister}
          rememberMe={rememberMe}
          error={error}
          loading={loading}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          onRememberMeChange={setRememberMe}
          onToggleMode={() => {
            setIsRegister(!isRegister);
            setError('');
          }}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
