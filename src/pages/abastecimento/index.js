import Link from 'next/link';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { formatDateTime, formatInt, formatNumber } from '@/lib/format';

export default function AbastecimentoList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroVeiculo, setFiltroVeiculo] = useState('');
  const [veiculos, setVeiculos] = useState([]);
  const [verFoto, setVerFoto] = useState(null);

  async function load() {
    setLoading(true);
    const q = filtroVeiculo ? `?veiculo_id=${filtroVeiculo}` : '';
    const r = await fetch('/api/abastecimentos' + q);
    const d = await r.json();
    setRows(d.data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetch('/api/veiculos').then((r) => r.json()).then((d) => setVeiculos(d.data || []));
  }, []);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filtroVeiculo]);

  return (
    <Layout>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h1 style={{ margin: 0 }}>Abastecimentos</h1>
          <Link href="/abastecimento/novo" className="btn primary">+ Novo abastecimento</Link>
        </div>
      </div>

      <div className="card">
        <div className="row">
          <div className="col">
            <label>Filtrar por veiculo</label>
            <select value={filtroVeiculo} onChange={(e) => setFiltroVeiculo(e.target.value)}>
              <option value="">Todos</option>
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>{v.prefixo}{v.placa ? ` - ${v.placa}` : ''}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p className="muted">Carregando...</p>
        ) : rows.length === 0 ? (
          <p className="muted">Nenhum abastecimento registrado.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Veiculo</th>
                  <th>Bomba</th>
                  <th>Odometro</th>
                  <th>Diesel (L)</th>
                  <th>Arla32 (L)</th>
                  <th>Operador</th>
                  <th>Foto</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDateTime(r.data_abastecimento)}</td>
                    <td><strong>{r.prefixo}</strong>{r.placa ? ` (${r.placa})` : ''}</td>
                    <td>{r.bomba_codigo || '-'}</td>
                    <td>{formatInt(r.odometro)}</td>
                    <td>{formatNumber(r.qtd_diesel)}</td>
                    <td>{formatNumber(r.qtd_arla32)}</td>
                    <td>{r.operador}</td>
                    <td>
                      {r.tem_foto ? (
                        <button className="btn" style={{ padding: '3px 8px', fontSize: 12 }}
                          onClick={() => setVerFoto(`/api/imagem/abastecimento-odometro/${r.id}`)}>
                          Ver
                        </button>
                      ) : '-'}
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
            <h2>Foto do odometro</h2>
            <img src={verFoto} alt="odometro" style={{ width: '100%', borderRadius: 6 }} />
            <div className="btn-group" style={{ marginTop: 12 }}>
              <button className="btn" onClick={() => setVerFoto(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
