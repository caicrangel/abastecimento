import { useEffect, useState } from 'react';
import Head from 'next/head';
import '@/styles/globals.css';

export default function App({ Component, pageProps }) {
  const [nome, setNome] = useState('Abastecimento');
  useEffect(() => {
    fetch('/api/settings/branding', { credentials: 'same-origin' })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.nome_sistema) setNome(d.nome_sistema); })
      .catch(() => {});
  }, []);
  return (
    <>
      <Head>
        <title>{nome}</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
