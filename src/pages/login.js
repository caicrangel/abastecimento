import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '@/lib/useTheme';
import { IconSun, IconMoon } from '@/components/Icons';

export default function Login() {
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState({
    nome_sistema: 'Abastecimento',
    tem_logo_light: false, tem_logo_dark: false,
    logo_light_updated_at: null, logo_dark_updated_at: null,
  });

  useEffect(() => {
    fetch('/api/settings/branding', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setBranding(d); })
      .catch(() => {});
  }, []);

  async function submit(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const d = await r.json();
      if (!r.ok) {
        setErro(d.error || 'Falha no login');
        setLoading(false);
        return;
      }
      router.replace('/abastecimento');
    } catch (err) {
      setErro('Erro de conexão');
      setLoading(false);
    }
  }

  const temLogo = theme === 'dark'
    ? branding.tem_logo_dark || branding.tem_logo_light
    : branding.tem_logo_light || branding.tem_logo_dark;
  const logoUpdatedAt = theme === 'dark'
    ? branding.logo_dark_updated_at || branding.logo_light_updated_at
    : branding.logo_light_updated_at || branding.logo_dark_updated_at;
  const logoSrc = temLogo
    ? `/api/settings/logo?theme=${theme}&v=${logoUpdatedAt || ''}`
    : null;

  return (
    <div className="login-page">
      <button
        type="button"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        className="login-theme-toggle"
      >
        {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
        <span>{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
      </button>

      <div className="login-card">
        {logoSrc && (
          <img src={logoSrc} alt={branding.nome_sistema} className="login-logo" />
        )}
        <h1 style={{ textAlign: 'center', marginBottom: 4 }}>{branding.nome_sistema}</h1>
        <p className="muted" style={{ textAlign: 'center', marginBottom: 20 }}>Controle de frota e bombas</p>
        <form onSubmit={submit}>
          {erro && <div className="msg error">{erro}</div>}
          <div style={{ marginBottom: 12 }}>
            <label>Usuário</label>
            <input
              type="text"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="submit"
              className="btn primary"
              style={{ minWidth: 180, padding: '10px 24px' }}
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
