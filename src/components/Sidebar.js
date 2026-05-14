import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const ITEMS_BASE = [
  { href: '/abastecimento', label: 'Abastecimento', icon: 'A' },
  { href: '/bombas', label: 'Bombas', icon: 'B' },
  { href: '/relatorios', label: 'Relatorios', icon: 'R' },
];
const ITEMS_ADMIN = [
  { href: '/configuracoes', label: 'Configuracoes', icon: 'C' },
];

export default function Sidebar({ user, branding, onLogout }) {
  const router = useRouter();
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
  const linkClass = (href) => router.pathname === href || router.pathname.startsWith(href + '/')
    ? 'sidebar-link active' : 'sidebar-link';

  const nomeSistema = branding?.nome_sistema || 'Abastecimento';

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
            {branding?.tem_logo ? (
              <img
                src={`/api/settings/logo?v=${branding.logo_updated_at || ''}`}
                alt="logo"
                className="sidebar-logo"
              />
            ) : (
              <div className="sidebar-logo-placeholder">{nomeSistema.charAt(0).toUpperCase()}</div>
            )}
            {!collapsed && <span className="sidebar-title">{nomeSistema}</span>}
          </div>
          <button className="sidebar-collapse-btn" onClick={toggleCollapse}
            title={collapsed ? 'Expandir' : 'Recolher'}>
            {collapsed ? '»' : '«'}
          </button>
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
          <button className="sidebar-logout" onClick={onLogout} title="Sair">
            {collapsed ? '⇥' : 'Sair'}
          </button>
        </div>
      </aside>
    </>
  );
}
