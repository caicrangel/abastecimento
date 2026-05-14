import Link from 'next/link';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { formatDateTime, formatInt, formatNumber } from '@/lib/format';

function formatDuracao(min) {
  if (min == null) return '-';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  return `${h}h ${m}min`;
}

export default function AbastecimentoList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroVeiculo, setFiltroVeiculo] = useState('');
  const [veiculos, setVeiculos] = useState([]);
  const [verFoto, setVerFoto] = useState(null);
  const [operacao, setOperacao] = useState(null);
  const [opLoading, setOpLoading] = useState(true);
  const [erro, setErro] = useState('');

  async function carregarOperacao() {
    setOpLoading(true);
    try {
      const r = await fetch('/api/operacoes/atual', { credentials: 'same-origin' });
      const d = await r.json();
      setOperacao(d.data);
    } catch (e) {
      setOperacao(null);
    } finally {
      setOpLoading(false);
    }
  }

  async function load() {
    setLoading(true);
    setErro('');
    try {
      const q = filtroVeiculo ? `?veiculo_id=${filtroVeiculo}` : '';
      const r = await fetch('/api/abastecimentos' + q, { credentials: 'same-origin' });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setErro(d.error || `Erro ${r.status}`);
      setRows(d.data || []);
    } catch (err) {
      setErro('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarOperacao();
    fetch('/api/veiculos', { credentials: 'same-origin' })
      .then((r) => r.json()).then((d) => setVeiculos(d.data || [])).catch(() => {});
  }, []);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filtroVeiculo]);

  const opAberta = !!operacao;

  return (
    <Layout>
      <div className="card" style={{
        background: opAberta ? '#dafbe1' : '#fff8c5',
        borderColor: opAberta ? '#aceebb' : '#d4a72c',
      }}>
        {opLoading ? (
          <p className="muted">Carregando status da operacao...</p>
        ) : opAberta ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: '#1a7f37', fontWeight: 600, textTransform: 'uppercase' }}>
                Operacao em andamento
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                Iniciada em {formatDateTime(operacao.iniciado_em)}
              </div>
              <div className="muted" style={{ marginTop: 2 }}>
                Por: {operacao.iniciado_por_nome} - Duracao: {formatDuracao(operacao.duracao_min)} - Abastecimentos: {operacao.qtd_abastecimentos}
              </div>
            </div>
            <div className="btn-group">
              <Link href="/abastecimento/novo" className="btn primary">+ Novo abastecimento</Link>
              <Link href="/abastecimento/encerrar" className="btn danger">
                {'⏹'} Encerrar abastecimento do dia
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: '#9a6700', fontWeight: 600, textTransform: 'uppercase' }}>
                Nenhuma operacao em andamento
              </div>
              <div style={{ fontSize: 16, marginTop: 4 }}>
                Inicie o abastecimento do dia (iniciante das bombas) para liberar lancamentos.
              </div>
            </div>
            <Link href="/abastecimento/iniciar" className="btn success" style={{ fontSize: 16, padding: '10px 18px' }}>
              {'▶'} Iniciar abastecimento do dia
            </Link>
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h1 style={{ margin: 0 }}>Abastecimentos</h1>
          {opAberta && (
            <Link href="/abastecimento/novo" className="btn primary">+ Novo abastecimento</Link>
          )}
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
        {erro && <div className="msg error">{erro}</div>}
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
