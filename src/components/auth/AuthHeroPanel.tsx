import heroImage from '../../assets/Rectangle 2756.png';

export function AuthHeroPanel() {
  return (
    <section className="auth-hero d-none d-lg-block">
      <img src={heroImage} alt="Harbor lighthouse" className="auth-hero-image" />
      <div className="auth-hero-overlay" />
      <div className="auth-hero-credit">Photo by Alexandr Popadin</div>
    </section>
  );
}
