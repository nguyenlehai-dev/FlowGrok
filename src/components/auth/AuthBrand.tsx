type AuthBrandProps = {
  compact?: boolean;
};

export function AuthBrand({ compact = false }: AuthBrandProps) {
  return (
    <div className={`flex items-center gap-3 ${compact ? '' : 'justify-center lg:justify-start'}`}>
      <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#7367f0,#8f85ff_55%,#5fd4ff)] shadow-[0_18px_38px_rgba(115,103,240,0.28)]">
        <div className="absolute inset-[1px] rounded-[15px] bg-[linear-gradient(180deg,rgba(255,255,255,0.28),rgba(255,255,255,0.06))]" />
        <span className="relative text-lg font-semibold tracking-[0.2em] text-white">FG</span>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#a8a5b8]">FlowGrok</p>
        <h1 className="text-[1.65rem] font-semibold tracking-[-0.03em] text-[#3f3a57]">Workspace Admin</h1>
      </div>
    </div>
  );
}
