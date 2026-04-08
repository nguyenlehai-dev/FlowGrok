import otherPayMethodIcon from '../../assets/Other-Pay-Method.png';

type AuthSocialButtonProps = {
  label: string;
};

export function AuthSocialButton({ label }: AuthSocialButtonProps) {
  return (
    <button type="button" className="auth-social w-100">
      <span className="auth-social-mark">
        <img src={otherPayMethodIcon} alt="" className="auth-social-icon" />
      </span>
      <span>{label}</span>
    </button>
  );
}
