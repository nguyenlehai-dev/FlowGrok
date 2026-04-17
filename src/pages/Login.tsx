import { useState } from 'react';
import type { FormEvent } from 'react';
import type { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { Col, Container, Row } from 'react-bootstrap';
import { useAuthStore } from '../store/authStore';
import { AuthFormCard } from '../components/auth/AuthFormCard';
import { AuthHeroPanel } from '../components/auth/AuthHeroPanel';
import '../components/auth/auth.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
        await login(email, password, rememberMe);
      } else {
        await login(email, password, rememberMe);
      }
      navigate('/');
    } catch (err) {
      const apiError = err as AxiosError<{ detail?: string }>;
      setError(apiError.response?.data?.detail || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Container fluid className="auth-stage d-flex align-items-center justify-content-center px-0">
        <Row className="auth-shell g-0 mx-auto">
          <Col lg={7} xl={8}>
            <AuthHeroPanel />
          </Col>
          <Col lg={5} xl={4}>
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
          </Col>
        </Row>
      </Container>
    </div>
  );
}
