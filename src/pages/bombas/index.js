import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { formatDate, formatDateTime, formatNumber } from '@/lib/format';

export default function BombasLeituras() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [bombas, setBombas] = useState([]);
  const [filtroBomba, setFiltroBomba] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [verFoto, setVerFoto] = useState(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtroBomba) params.set('bomba_id', filtroBomba);
    if (filtroStatus) params.set('status', filtroStatus);
    const r = await fetch('/api/leituras-bomba?' + params.toString());
    const d = await r.json();
    setRows(d.data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetch('/api/bombas').then((r) => r.json()).then((d) => setBombas(d.data || []));
  }, []);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filtroBomba, filtroStatus]);

  return (
    <Layout>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h1 style={{ margin: 0 }}>Leituras das bombas</h1>
          <Link href="/bombas/nova" className="btn primary">+ Abrir leitura</Link>
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
          <div className="col">
            <label>Status</label>
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
              <option value="">Todos</option>
              <option value="aberta">Apenas abertas (sem encerrante)</option>
              <option value="fechada">Apenas fechadas</option>
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
                  <th>Status</th>
                  <th>Iniciante</th>
                  <th>Encerrante</th>
                  <th>Consumo (L)</th>
                  <th>Operador</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDate(r.data_leitura)}</td>
                    <td>
                      <strong>{r.bomba_codigo}</strong>{' '}
                      <span className={`tag ${r.combustivel}`}>{r.combustivel}</span>
                    </td>
                    <td>
                      {r.aberta ? (
                        <span className="tag inativo">Aberta</span>
                      ) : (
                        <span className="tag ativo">Fechada</span>
                      )}
                    </td>
                    <td>{formatNumber(r.iniciante)}</td>
                    <td>{r.encerrante == null ? '-' : formatNumber(r.encerrante)}</td>
                    <td><strong>{r.consumo == null ? '-' : formatNumber(r.consumo)}</strong></td>
                    <td>
                      {r.operador}
                      {r.operador_encerramento && r.operador_encerramento !== r.operador && (
                        <div className="muted" style={{ fontSize: 11 }}>fechou: {r.operador_encerramento}</div>
                      )}
                    </td>
                    <td>
                      <div className="btn-group">
                        {r.aberta ? (
                          <button className="btn primary" style={{ padding: '3px 8px', fontSize: 12 }}
                            onClick={() => router.push(`/bombas/fechar/${r.id}`)}>
                            Fechar
                          </button>
                        ) : null}
                        {r.tem_foto_iniciante && (
                          <button className="btn" style={{ padding: '3px 8px', fontSize: 12 }}
                            onClick={() => setVerFoto({ src: `/api/imagem/bomba-iniciante/${r.id}`, titulo: `Iniciante - ${r.bomba_codigo} - ${formatDate(r.data_leitura)}` })}>
                            Ini
                          </button>
                        )}
                        {r.tem_foto_encerrante && (
                          <button className="btn" style={{ padding: '3px 8px', fontSize: 12 }}
                            onClick={() => setVerFoto({ src: `/api/imagem/bomba-encerrante/${r.id}`, titulo: `Encerrante - ${r.bomba_codigo} - ${formatDate(r.data_leitura)}` })}>
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
