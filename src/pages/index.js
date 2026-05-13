import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) router.replace('/abastecimento');
        else router.replace('/login');
      });
  }, [router]);
  return <div className="container"><p className="muted">Carregando...</p></div>;
}
