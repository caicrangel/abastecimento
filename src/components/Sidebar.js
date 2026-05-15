import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useTheme } from '@/lib/useTheme';
import { IconSun, IconMoon, IconChevronLeft, IconChevronRight, IconLogout } from './Icons';

const ITEMS_BASE = [
  { href: '/abastecimento', label: 'Abastecimento', icon: 'A' },
  { href: '/bombas', label: 'Bombas', icon: 'B' },
  { href: '/relatorios', label: 'Relatórios', icon: 'R' },
];
const ITEMS_ADMIN = [
  { href: '/configuracoes', label: 'Configurações', icon: 'C' },
];

export default function Sidebar({ user, branding, onLogout }) {
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const v = typeof window !== 'undefined' && localStorage.getItem('sidebar_collapsed');
    if (v === '1') setCollapsed(true);
  }, []);

  function toggleCollapse() {
    const novo = !collapsed;
    setCollapsed(novo);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar_collapsed', novo ? '1' : '0');
    }
  }

  useEffect(() => { setMobileOpen(false); }, [router.pathname]);

  const items = [...ITEMS_BASE, ...(user?.role === 'admin' ? ITEMS_ADMIN : [])];
  const linkClass = (href) =>
    router.pathname === href || router.pathname.startsWith(href + '/')
      ? 'sidebar-link active' : 'sidebar-link';

  const nomeSistema = branding?.nome_sistema || 'Abastecimento';
  const temLogoNoTema = theme === 'dark'
    ? branding?.tem_logo_dark || branding?.tem_logo_light
    : branding?.tem_logo_light || branding?.tem_logo_dark;
  const logoUpdatedAt = theme === 'dark'
    ? branding?.logo_dark_updated_at || branding?.logo_light_updated_at
    : branding?.logo_light_updated_at || branding?.logo_dark_updated_at;
  const logoSrc = temLogoNoTema
    ? `/api/settings/logo?theme=${theme}&v=${logoUpdatedAt || ''}`
    : null;

  return (
    <>
      <button
        className="sidebar-toggle-mobile"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
      >
        <span>≡</span>
      </button>

      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            {logoSrc ? (
              <img src={logoSrc} alt="logo" className="sidebar-logo" />
            ) : (
              <div className="sidebar-logo-placeholder">{nomeSistema.charAt(0).toUpperCase()}</div>
            )}
            {!collapsed && <span className="sidebar-title">{nomeSistema}</span>}
          </div>
        </div>

        <nav className="sidebar-nav">
          {items.map((it) => (
            <Link key={it.href} href={it.href} className={linkClass(it.href)} title={it.label}>
              <span className="sidebar-icon">{it.icon}</span>
              {!collapsed && <span className="sidebar-label">{it.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && user && (
            <div className="sidebar-user">
              <div className="sidebar-user-name">{user.nome}</div>
              <div className="sidebar-user-role">{user.role}</div>
            </div>
          )}
          <div className="sidebar-footer-actions">
            <button
              className="sidebar-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            >
              {theme === 'dark' ? <IconSun /> : <IconMoon />}
              {!collapsed && <span>{theme === 'dark' ? 'Claro' : 'Escuro'}</span>}
            </button>
            <button className="sidebar-btn" onClick={onLogout} title="Sair">
              <IconLogout />
              {!collapsed && <span>Sair</span>}
            </button>
          </div>
          <button
            className="sidebar-btn full"
            onClick={toggleCollapse}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
            {!collapsed && <span>Recolher</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
