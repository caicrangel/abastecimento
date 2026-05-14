import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import AlertaEncerrante from './AlertaEncerrante';

export default function Layout({ children, user }) {
  const router = useRouter();
  const [u, setU] = useState(user || null);
  const [branding, setBranding] = useState({ nome_sistema: 'Abastecimento', tem_logo: false });
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (u) return;
    let abort = false;
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (abort) return;
        if (r.ok && d.user) setU(d.user);
        else router.replace('/login');
      })
      .catch((err) => {
        if (abort) return;
        setErro('Erro de conexao com servidor: ' + err.message);
      });
    return () => { abort = true; };
  }, [u, router]);

  useEffect(() => {
    if (!u) return;
    fetch('/api/settings/branding', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => setBranding(d))
      .catch(() => {});
  }, [u]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    router.replace('/login');
  }

  if (erro) {
    return (
      <div className="container">
        <div className="msg error">{erro}</div>
        <Link href="/login" className="btn">Voltar ao login</Link>
      </div>
    );
  }

  if (!u) {
    return <div className="container"><p className="muted">Carregando...</p></div>;
  }

  return (
    <div className="app-shell">
      <Sidebar user={u} branding={branding} onLogout={logout} />
      <main className="app-main">
        <AlertaEncerrante />
        <div className="container">{typeof children === 'function' ? children(u) : children}</div>
      </main>
    </div>
  );
}
