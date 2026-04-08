import type { FormEvent } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { Eye, EyeSlash, Stars } from 'react-bootstrap-icons';
import { AuthBrand } from './AuthBrand';
import { AuthSocialButton } from './AuthSocialButton';

type AuthFormCardProps = {
  email: string;
  password: string;
  showPassword: boolean;
  isRegister: boolean;
  rememberMe: boolean;
  error: string;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onRememberMeChange: (value: boolean) => void;
  onToggleMode: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function AuthFormCard({
  email,
  password,
  showPassword,
  isRegister,
  rememberMe,
  error,
  loading,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onRememberMeChange,
  onToggleMode,
  onSubmit,
}: AuthFormCardProps) {
  return (
    <section className="auth-side">
      <div>
        <AuthBrand />

        <div className="auth-panel">
          <h2 className="auth-title">{isRegister ? 'Create your account' : 'Nice to see you again'}</h2>

          <Form className="mt-5" onSubmit={onSubmit}>
            <Form.Group className="mb-4">
              <Form.Label className="auth-label">{isRegister ? 'Email' : 'Login'}</Form.Label>
              <Form.Control
                id="email"
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                required
                placeholder="Email or phone number"
                className="auth-control"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="auth-label">Password</Form.Label>
              <div className="auth-password-field">
                <Form.Control
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  required
                  placeholder="Enter password"
                  className="auth-control auth-password-input"
                />
                <button
                  type="button"
                  onClick={onTogglePassword}
                  className="auth-password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Form.Group>

            <div className="auth-actions mb-4">
              <Form.Check
                type="switch"
                id="remember-me"
                className="auth-remember"
                label="Remember me"
                checked={rememberMe}
                onChange={(event) => onRememberMeChange(event.target.checked)}
              />

              {!isRegister && (
                <button type="button" className="auth-link">
                  Forgot password?
                </button>
              )}
            </div>

            {error && (
              <Alert className="auth-error mb-4">
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="auth-submit w-100"
            >
              {loading ? 'Processing...' : isRegister ? 'Create account' : 'Sign in'}
            </Button>
          </Form>

          <div className="auth-divider" />

          <AuthSocialButton label="Or sign in with Google" />

          <div className="auth-signup mt-4">
            {isRegister ? 'Already have an account?' : 'Dont have an account?'}{' '}
            <button type="button" onClick={onToggleMode} className="auth-link">
              {isRegister ? 'Sign in now' : 'Sign up now'}
            </button>
          </div>
        </div>
      </div>

      <div className="auth-side-footer">
        <div className="auth-social-handle">
          <span className="auth-handle-mark">
            <Stars size={12} />
          </span>
          <span className="text-primary">@plxeditor</span>
        </div>
        <span>© FlowGrok Login 2026</span>
      </div>
    </section>
  );
}
