import avatarImage from '../../assets/Avatar-UI-Unicorn-V2.png';

export function AuthBrand() {
  return (
    <div className="auth-brand">
      <div className="auth-brand-mark">
        <img src={avatarImage} alt="FlowGrok avatar" className="auth-brand-avatar" />
      </div>
      <div className="auth-brand-text">FlowGrok</div>
    </div>
  );
}
