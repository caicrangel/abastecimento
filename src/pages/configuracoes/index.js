import { useState } from 'react';
import Layout from '@/components/Layout';
import VeiculosCrud from '@/components/admin/VeiculosCrud';
import BombasCrud from '@/components/admin/BombasCrud';
import UsuariosCrud from '@/components/admin/UsuariosCrud';
import BrandingForm from '@/components/admin/BrandingForm';

const TABS = [
  { id: 'veiculos', label: 'Veiculos' },
  { id: 'bombas', label: 'Bombas' },
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'sistema', label: 'Sistema' },
];

export default function Configuracoes() {
  const [tab, setTab] = useState('veiculos');

  return (
    <Layout>
      {(user) => (
        user.role !== 'admin' ? (
          <div className="card">
            <h1>Configuracoes</h1>
            <div className="msg error">Apenas administradores podem acessar esta area.</div>
          </div>
        ) : (
          <>
            <div className="card">
              <h1 style={{ marginBottom: 12 }}>Configuracoes</h1>
              <div className="tabs">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    className={`tab ${tab === t.id ? 'active' : ''}`}
                    onClick={() => setTab(t.id)}
                    type="button"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="card">
              {tab === 'veiculos' && <VeiculosCrud />}
              {tab === 'bombas' && <BombasCrud />}
              {tab === 'usuarios' && <UsuariosCrud />}
              {tab === 'sistema' && <BrandingForm onChange={() => window.location.reload()} />}
            </div>
          </>
        )
      )}
    </Layout>
  );
}
