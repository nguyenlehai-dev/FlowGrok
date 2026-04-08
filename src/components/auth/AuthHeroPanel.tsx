import { ShieldCheck, Sparkles, Workflow } from 'lucide-react';
import { AuthBrand } from './AuthBrand';

const highlights = [
  {
    icon: Workflow,
    title: 'Profile orchestration',
    copy: 'Quan ly profile, proxy va workflow generation trong mot dashboard gon gang.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure access',
    copy: 'Dang nhap mot lan, xac thuc token va truy cap API thong qua cung domain.',
  },
  {
    icon: Sparkles,
    title: 'Focused operations',
    copy: 'Bo cuc toi uu cho tac vu van hanh, giam xao nhang va thao tac nhanh hon.',
  },
];

export function AuthHeroPanel() {
  return (
    <section className="relative hidden min-h-[720px] overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top_left,#ffffff_0%,#f6f4ff_30%,#ece8ff_60%,#e7f7ff_100%)] p-10 text-[#4a4563] shadow-[0_32px_80px_rgba(47,43,61,0.14)] lg:flex lg:flex-col">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(115,103,240,0.06),transparent_35%,rgba(95,212,255,0.08))]" />
      <div className="absolute -left-18 top-14 h-44 w-44 rounded-full bg-[#7367f0]/12 blur-3xl" />
      <div className="absolute bottom-8 right-8 h-40 w-40 rounded-full bg-[#5fd4ff]/20 blur-3xl" />
      <div className="absolute right-10 top-10 h-24 w-24 rounded-[28px] border border-white/70 bg-white/50 shadow-[0_18px_38px_rgba(115,103,240,0.12)]" />
      <div className="absolute bottom-24 left-12 h-20 w-20 rounded-full border border-white/80 bg-white/60 shadow-[0_14px_32px_rgba(95,212,255,0.16)]" />

      <div className="relative z-10 flex h-full flex-col">
        <AuthBrand />

        <div className="mt-16 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#7367f0] shadow-[0_10px_30px_rgba(17,17,26,0.08)]">
            <span className="h-2 w-2 rounded-full bg-[#7367f0]" />
            Flow Operations Console
          </div>

          <h2 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-[-0.05em] text-[#312d4b]">
            Sign in to run your Grok workflows without losing context.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#6f6b7d]">
            A focused authentication surface for operators who manage accounts, proxies and API keys from one place.
          </p>
        </div>

        <div className="relative mt-12 flex-1">
          <div className="absolute inset-x-8 top-5 h-[400px] rounded-[36px] border border-white/80 bg-white/60 shadow-[0_30px_80px_rgba(115,103,240,0.12)] backdrop-blur-sm" />
          <div className="absolute inset-x-0 top-20 mx-auto w-[88%] rounded-[34px] border border-[#ebe8ff] bg-[#fdfdff] p-7 shadow-[0_32px_70px_rgba(47,43,61,0.12)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#7367f0]">Authentication Overview</p>
                <p className="mt-1 text-sm text-[#8f8aa3]">Built for a cleaner staging and production sign-in flow.</p>
              </div>
              <div className="rounded-2xl bg-[#f3f1ff] px-4 py-2 text-sm font-semibold text-[#4f46c9]">Live</div>
            </div>

            <div className="mt-7 space-y-4">
              {highlights.map(({ icon: Icon, title, copy }) => (
                <div
                  key={title}
                  className="flex items-start gap-4 rounded-[24px] border border-[#f0eef8] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(47,43,61,0.05)]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#7367f0,#8f85ff)] text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#3f3a57]">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-[#7e7991]">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
