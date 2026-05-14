import { useEffect, useState } from 'react';
import Head from 'next/head';
import '@/styles/globals.css';

const THEME_INIT_SCRIPT = `
(function() {
  try {
    var t = localStorage.getItem('theme');
    if (t !== 'dark' && t !== 'light') {
      t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
})();
`;

export default function App({ Component, pageProps }) {
  const [nome, setNome] = useState('Abastecimento');
  useEffect(() => {
    fetch('/api/settings/branding', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.nome_sistema) setNome(d.nome_sistema); })
      .catch(() => {});
  }, []);
  return (
    <>
      <Head>
        <title>{nome}</title>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
