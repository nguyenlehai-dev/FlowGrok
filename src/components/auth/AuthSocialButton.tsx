import type { ReactNode } from 'react';

type AuthSocialButtonProps = {
  label: string;
  children: ReactNode;
};

export function AuthSocialButton({ label, children }: AuthSocialButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-[#6f6b7d] shadow-[0_12px_24px_rgba(20,18,38,0.08)] transition duration-200 hover:-translate-y-0.5 hover:text-[#7367f0]"
    >
      {children}
    </button>
  );
}
