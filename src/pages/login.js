import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '@/lib/useTheme';

export default function Login() {
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState({ nome_sistema: 'Abastecimento', tem_logo: false });

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
      setErro('Erro de conexao');
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <button
        type="button"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(255,255,255,0.15)', color: '#fff',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 14,
        }}
      >
        {theme === 'dark' ? '☀ Claro' : '☾ Escuro'}
      </button>

      <div className="login-card">
        {branding.tem_logo ? (
          <img
            src={`/api/settings/logo?v=${branding.logo_updated_at || ''}`}
            alt="logo"
            className="login-logo"
          />
        ) : null}
        <h1 style={{ textAlign: 'center', marginBottom: 4 }}>{branding.nome_sistema}</h1>
        <p className="muted" style={{ textAlign: 'center', marginBottom: 20 }}>Controle de frota e bombas</p>
        <form onSubmit={submit}>
          {erro && <div className="msg error">{erro}</div>}
          <div style={{ marginBottom: 12 }}>
            <label>Usuario</label>
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
              style={{ minWidth: 160, padding: '10px 24px' }}
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
