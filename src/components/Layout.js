import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Layout({ children, user }) {
  const router = useRouter();
  const [u, setU] = useState(user || null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (u) return;
    let abort = false;
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (abort) return;
        if (r.ok && d.user) {
          setU(d.user);
        } else {
          router.replace('/login');
        }
      })
      .catch((err) => {
        if (abort) return;
        setErro('Erro de conexao com servidor: ' + err.message);
      });
    return () => { abort = true; };
  }, [u, router]);

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

  const isAdmin = u.role === 'admin';
  const linkClass = (path) => (router.pathname.startsWith(path) ? 'active' : '');

  return (
    <>
      <div className="topbar">
        <div className="brand">Abastecimento</div>
        <nav>
          <Link href="/abastecimento" className={linkClass('/abastecimento')}>Abastecimento</Link>
          <Link href="/bombas" className={linkClass('/bombas')}>Bombas</Link>
          {isAdmin && (
            <>
              <Link href="/admin/veiculos" className={linkClass('/admin/veiculos')}>Veiculos</Link>
              <Link href="/admin/bombas" className={linkClass('/admin/bombas')}>Cad. Bombas</Link>
              <Link href="/admin/usuarios" className={linkClass('/admin/usuarios')}>Usuarios</Link>
            </>
          )}
        </nav>
        <div className="user">
          {u.nome} ({u.role}){' '}
          <button className="btn" onClick={logout} style={{ marginLeft: 8, padding: '4px 10px' }}>
            Sair
          </button>
        </div>
      </div>
      <div className="container">{typeof children === 'function' ? children(u) : children}</div>
    </>
  );
}
