import { useEffect, useRef, useState } from 'react';
import avatarImage from '../assets/Avatar-UI-Unicorn-V2.png';
import {
  Bell,
  CircleHelp,
  CreditCard,
  Grid3x3,
  Languages,
  LogOut,
  Menu,
  MoonStar,
  Search,
  Settings,
  SunMedium,
  UserRound,
} from 'lucide-react';

type TopbarProps = {
  onOpenMobileSidebar: () => void;
};

type MenuKey = 'language' | 'theme' | 'notifications' | 'profile' | null;

const languageOptions = ['English', 'French', 'Arabic'] as const;
const themeOptions = [
  { id: 'light', label: 'Light', icon: SunMedium },
  { id: 'dark', label: 'Dark', icon: MoonStar },
  { id: 'system', label: 'System', icon: Grid3x3 },
] as const;

const notifications = [
  {
    name: 'Congratulation Flora! 🎉',
    message: 'Won the monthly best seller badge',
    time: 'Today',
    avatar: avatarImage,
    unread: false,
  },
  {
    name: 'New user registered.',
    message: '5 hours ago',
    time: 'Yesterday',
    initials: 'TH',
    unread: true,
  },
  {
    name: 'New message received 🥳',
    message: 'You have 10 unread messages',
    time: '11 Aug',
    initials: 'MS',
    unread: false,
  },
  {
    name: 'PayPal',
    message: 'Received Payment',
    time: '25 May',
    initials: 'PP',
    unread: true,
    paypal: true,
  },
];

const profileActions = [
  { label: 'Profile', icon: UserRound, badge: undefined },
  { label: 'Settings', icon: Settings, badge: undefined },
  { label: 'Billing Plan', icon: CreditCard, badge: '4' },
  { label: 'Pricing', icon: CreditCard, badge: undefined },
  { label: 'FAQ', icon: CircleHelp, badge: undefined },
] as const;

export default function Topbar({ onOpenMobileSidebar }: TopbarProps) {
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [language, setLanguage] = useState<(typeof languageOptions)[number]>('English');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const toggleMenu = (menu: Exclude<MenuKey, null>) => {
    setOpenMenu((current) => (current === menu ? null : menu));
  };

  return (
    <header className="admin-topbar" ref={rootRef}>
      <div className="admin-topbar-leading">
        <button type="button" className="admin-mobile-menu-btn" onClick={onOpenMobileSidebar} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div className="admin-search">
          <Search size={18} />
          <span className="admin-search-label">Search</span>
          <span className="admin-search-kbd">⌘K</span>
        </div>
      </div>

      <div className="admin-top-actions">
        <div className="admin-top-action-group">
          <button
            type="button"
            className={`admin-top-icon ${openMenu === 'language' ? 'is-open' : ''}`}
            onClick={() => toggleMenu('language')}
            aria-label="Change language"
          >
            <Languages size={16} />
          </button>
          {openMenu === 'language' ? (
            <div className="admin-popover admin-menu admin-language-menu">
              {languageOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`admin-menu-item ${language === option ? 'is-active' : ''}`}
                  onClick={() => {
                    setLanguage(option);
                    setOpenMenu(null);
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="admin-top-action-group">
          <button
            type="button"
            className={`admin-top-icon ${openMenu === 'theme' ? 'is-open' : ''}`}
            onClick={() => toggleMenu('theme')}
            aria-label="Change theme"
          >
            <SunMedium size={16} />
          </button>
          {openMenu === 'theme' ? (
            <div className="admin-popover admin-menu admin-theme-menu">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`admin-menu-item admin-menu-item-with-icon ${isActive ? 'is-active' : ''}`}
                    onClick={() => {
                      setTheme(option.id);
                      setOpenMenu(null);
                    }}
                  >
                    <Icon size={17} />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <button type="button" className="admin-top-icon" aria-label="Apps">
          <Grid3x3 size={16} />
        </button>

        <div className="admin-top-action-group">
          <button
            type="button"
            className={`admin-top-icon ${openMenu === 'notifications' ? 'is-open' : ''}`}
            onClick={() => toggleMenu('notifications')}
            aria-label="Notifications"
          >
            <Bell size={16} />
            <span className="admin-top-icon-badge" />
          </button>
          {openMenu === 'notifications' ? (
            <div className="admin-popover admin-notifications">
              <div className="admin-notifications-header">
                <div className="admin-notifications-title">Notifications</div>
                <div className="admin-notifications-meta">
                  <span className="admin-pill">2 New</span>
                  <button type="button" className="admin-notifications-mail" aria-label="Open inbox">
                    <Bell size={15} />
                  </button>
                </div>
              </div>

              <div className="admin-notification-list">
                {notifications.map((item) => (
                  <div key={`${item.name}-${item.time}`} className="admin-notification-item">
                    <div className={`admin-notification-avatar ${item.paypal ? 'is-paypal' : ''}`}>
                      {item.avatar ? (
                        <img src={item.avatar} alt={item.name} />
                      ) : (
                        <span>{item.initials}</span>
                      )}
                    </div>
                    <div className="admin-notification-content">
                      <div className="admin-notification-name">{item.name}</div>
                      <div className="admin-notification-message">{item.message}</div>
                      <div className="admin-notification-time">{item.time}</div>
                    </div>
                    {item.unread ? <span className="admin-notification-dot" /> : null}
                  </div>
                ))}
              </div>

              <button type="button" className="admin-btn admin-btn-primary admin-notifications-footer">
                View All Notifications
              </button>
            </div>
          ) : null}
        </div>

        <div className="admin-top-action-group">
          <button
            type="button"
            className={`admin-avatar-trigger ${openMenu === 'profile' ? 'is-open' : ''}`}
            onClick={() => toggleMenu('profile')}
            aria-label="Open profile menu"
          >
            <img src={avatarImage} alt="User avatar" className="admin-top-avatar" />
            <span className="admin-top-avatar-status" />
          </button>
          {openMenu === 'profile' ? (
            <div className="admin-popover admin-profile-menu">
              <div className="admin-profile-summary">
                <img src={avatarImage} alt="John Doe" className="admin-profile-avatar" />
                <div>
                  <div className="admin-profile-name">John Doe</div>
                  <div className="admin-profile-role">Admin</div>
                </div>
              </div>

              <div className="admin-profile-actions">
                {profileActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button key={action.label} type="button" className="admin-profile-action">
                      <span className="admin-profile-action-main">
                        <Icon size={17} />
                        <span>{action.label}</span>
                      </span>
                      {action.badge ? <span className="admin-profile-badge">{action.badge}</span> : null}
                    </button>
                  );
                })}
              </div>

              <button type="button" className="admin-profile-logout">
                <span>Logout</span>
                <LogOut size={16} />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
