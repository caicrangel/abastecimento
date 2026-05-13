import Link from 'next/link';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';

export default function BombasLeituras() {
  const [rows, setRows] = useState([]);
  const [bombas, setBombas] = useState([]);
  const [filtroBomba, setFiltroBomba] = useState('');
  const [loading, setLoading] = useState(true);
  const [verFoto, setVerFoto] = useState(null);

  async function load() {
    setLoading(true);
    const q = filtroBomba ? `?bomba_id=${filtroBomba}` : '';
    const r = await fetch('/api/leituras-bomba' + q);
    const d = await r.json();
    setRows(d.data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetch('/api/bombas').then((r) => r.json()).then((d) => setBombas(d.data || []));
  }, []);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filtroBomba]);

  return (
    <Layout>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h1 style={{ margin: 0 }}>Leituras das bombas</h1>
          <Link href="/bombas/nova" className="btn primary">+ Nova leitura</Link>
        </div>
      </div>

      <div className="card">
        <div className="row">
          <div className="col">
            <label>Filtrar por bomba</label>
            <select value={filtroBomba} onChange={(e) => setFiltroBomba(e.target.value)}>
              <option value="">Todas</option>
              {bombas.map((b) => (
                <option key={b.id} value={b.id}>{b.codigo} ({b.combustivel})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p className="muted">Carregando...</p>
        ) : rows.length === 0 ? (
          <p className="muted">Nenhuma leitura registrada.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Bomba</th>
                  <th>Combustivel</th>
                  <th>Iniciante</th>
                  <th>Encerrante</th>
                  <th>Consumo (L)</th>
                  <th>Operador</th>
                  <th>Fotos</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.data_leitura}</td>
                    <td><strong>{r.bomba_codigo}</strong></td>
                    <td><span className={`tag ${r.combustivel}`}>{r.combustivel}</span></td>
                    <td>{Number(r.iniciante).toFixed(2)}</td>
                    <td>{Number(r.encerrante).toFixed(2)}</td>
                    <td><strong>{Number(r.consumo).toFixed(2)}</strong></td>
                    <td>{r.operador}</td>
                    <td>
                      <div className="btn-group">
                        {r.tem_foto_iniciante && (
                          <button className="btn" style={{ padding: '3px 8px', fontSize: 12 }}
                            onClick={() => setVerFoto({ src: `/api/imagem/bomba-iniciante/${r.id}`, titulo: 'Iniciante' })}>
                            Ini
                          </button>
                        )}
                        {r.tem_foto_encerrante && (
                          <button className="btn" style={{ padding: '3px 8px', fontSize: 12 }}
                            onClick={() => setVerFoto({ src: `/api/imagem/bomba-encerrante/${r.id}`, titulo: 'Encerrante' })}>
                            Enc
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {verFoto && (
        <div className="modal-bg" onClick={() => setVerFoto(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{verFoto.titulo}</h2>
            <img src={verFoto.src} alt="" style={{ width: '100%', borderRadius: 6 }} />
            <div className="btn-group" style={{ marginTop: 12 }}>
              <button className="btn" onClick={() => setVerFoto(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
