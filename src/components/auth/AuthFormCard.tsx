import { Eye, EyeOff } from 'lucide-react';
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
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
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
    <section className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:min-h-[720px] lg:px-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#f4f1ff_0%,#f9f8fc_42%,#f3f6fb_100%)] lg:hidden" />
      <div className="relative z-10 w-full max-w-[510px]">
        <div className="mb-8 lg:hidden">
          <AuthBrand compact />
        </div>

        <div className="overflow-hidden rounded-[30px] border border-white/70 bg-white/78 p-6 shadow-[0_26px_70px_rgba(47,43,61,0.12)] backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#a8a5b8]">
              {isRegister ? 'Create access' : 'Welcome back'}
            </p>
            <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-[#2f2b3d]">
              {isRegister ? 'Create your FlowGrok account' : 'Sign in to your workspace'}
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-[#7e7991]">
              {isRegister
                ? 'Tao tai khoan de truy cap dashboard quan ly profile, proxy va API keys.'
                : 'Dang nhap de tiep tuc dieu phoi workflow va quan ly he thong tu mot giao dien duy nhat.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-[#ffd7dc] bg-[#fff4f5] px-4 py-3 text-sm text-[#c5354e]">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-[#5d596c]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                required
                placeholder="admin@flowgrok.local"
                className="w-full rounded-2xl border border-[#dedbea] bg-white px-4 py-3.5 text-[#2f2b3d] outline-none transition focus:border-[#7367f0] focus:ring-4 focus:ring-[#7367f0]/10"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <label htmlFor="password" className="block text-sm font-medium text-[#5d596c]">
                  Password
                </label>
                {!isRegister && (
                  <button type="button" className="text-sm font-medium text-[#7367f0] transition hover:text-[#5b4ee5]">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-[#dedbea] bg-white px-4 py-3.5 pr-12 text-[#2f2b3d] outline-none transition focus:border-[#7367f0] focus:ring-4 focus:ring-[#7367f0]/10"
                />
                <button
                  type="button"
                  onClick={onTogglePassword}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8f8aa3] transition hover:text-[#5d596c]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-3 pt-1 text-sm text-[#6f6b7d]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => onRememberMeChange(event.target.checked)}
                className="h-4 w-4 rounded border-[#cfcbe0] text-[#7367f0] focus:ring-[#7367f0]"
              />
              Remember this device
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[linear-gradient(135deg,#7367f0,#5b4ee5)] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(115,103,240,0.35)] transition hover:translate-y-[-1px] hover:shadow-[0_24px_40px_rgba(115,103,240,0.38)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Processing...' : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8">
            <p className="text-center text-sm text-[#6f6b7d]">
              {isRegister ? 'Already have an account?' : 'New to FlowGrok?'}{' '}
              <button type="button" onClick={onToggleMode} className="font-semibold text-[#7367f0] hover:text-[#5b4ee5]">
                {isRegister ? 'Sign in instead' : 'Create an account'}
              </button>
            </p>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#ebe8f5]" />
              <span className="text-xs font-semibold uppercase tracking-[0.26em] text-[#b4b0c2]">or continue with</span>
              <div className="h-px flex-1 bg-[#ebe8f5]" />
            </div>

            <div className="flex items-center justify-center gap-4">
              <AuthSocialButton label="Login with Google">
                <svg width="20" height="20" viewBox="0 0 48 48" fill="currentColor">
                  <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.6-.2-2.8-.5-4Z" />
                </svg>
              </AuthSocialButton>
              <AuthSocialButton label="Login with Github">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .3C5.4.3 0 5.7 0 12.3c0 5.3 3.4 9.8 8.2 11.4.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 24 12.3C24 5.7 18.6.3 12 .3Z" />
                </svg>
              </AuthSocialButton>
              <AuthSocialButton label="Login with X">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.5 22H3.4l7.2-8.2L1 2h6.4l4.4 5.8L18.9 2Zm-1.1 18h1.8L6.5 3.9H4.6L17.8 20Z" />
                </svg>
              </AuthSocialButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
