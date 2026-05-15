import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { formatDate, formatDateTime, formatNumber, formatDuracao } from '@/lib/format';
import { IconChevronDown, IconChevronUp } from '@/components/Icons';

function Stat({ label, valor }) {
  return (
    <div style={{ textAlign: 'right', minWidth: 80 }}>
      <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{valor}</div>
    </div>
  );
}

function GrupoLeituras({ op, bombaFiltroId, onAbrirFoto, onAbrirFechar }) {
  const [aberto, setAberto] = useState(false);
  const [leituras, setLeituras] = useState(null);
  const [loading, setLoading] = useState(false);

  async function carregar() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('operacao_id', op.id);
    if (bombaFiltroId) params.set('bomba_id', bombaFiltroId);
    const r = await fetch('/api/leituras-bomba?' + params.toString(), { credentials: 'same-origin' });
    const d = await r.json();
    setLeituras(d.data || []);
    setLoading(false);
  }

  function toggle() {
    const novo = !aberto;
    setAberto(novo);
    if (novo && leituras === null) carregar();
  }

  return (
    <div className="card" style={{
      borderLeft: `4px solid ${op.aberta ? 'var(--success)' : 'var(--primary)'}`,
      padding: 0, overflow: 'hidden',
    }}>
      <button
        type="button"
        onClick={toggle}
        style={{
          width: '100%', textAlign: 'left', background: 'transparent',
          border: 'none', cursor: 'pointer', padding: 16, color: 'inherit',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <strong style={{ fontSize: 16 }}>{formatDate(op.data)}</strong>
            {op.aberta ? (
              <span className="tag" style={{ background: 'var(--op-aberta-bg)', color: 'var(--success)' }}>Em andamento</span>
            ) : (
              <span className="tag ativo">Encerrada</span>
            )}
            {op.leituras_abertas > 0 && (
              <span className="tag inativo">{op.leituras_abertas} leitura(s) sem encerrante</span>
            )}
          </div>
          <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
            Início: <strong>{formatDateTime(op.iniciado_em)}</strong>
            {op.encerrado_em && <> - Fim: <strong>{formatDateTime(op.encerrado_em)}</strong></>}
            {' '}- Duração: <strong>{formatDuracao(op.duracao_min)}</strong>
          </div>
          <div className="muted" style={{ marginTop: 2, fontSize: 13 }}>
            Responsável: <strong>{op.iniciado_por_nome}</strong>
            {op.encerrado_por_nome && op.encerrado_por_nome !== op.iniciado_por_nome &&
              <> - Encerrou: <strong>{op.encerrado_por_nome}</strong></>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Stat label="Bombas" valor={op.qtd_leituras} />
          <Stat label="Volume" valor={`${formatNumber(op.volume_total)} L`} />
          <div style={{ color: 'var(--muted)' }}>
            {aberto ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </div>
        </div>
      </button>

      {aberto && (
        <div style={{ borderTop: '1px solid var(--border)', padding: 16 }}>
          {loading ? (
            <p className="muted">Carregando leituras...</p>
          ) : !leituras || leituras.length === 0 ? (
            <p className="muted">Nenhuma leitura nesta operação.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Bomba</th>
                    <th>Status</th>
                    <th>Iniciante</th>
                    <th>Encerrante</th>
                    <th>Consumo (L)</th>
                    <th>Operador</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {leituras.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.bomba_codigo}</strong>{' '}
                        <span className={`tag ${r.combustivel}`}>{r.combustivel}</span>
                      </td>
                      <td>
                        {r.aberta
                          ? <span className="tag inativo">Aberta</span>
                          : <span className="tag ativo">Fechada</span>}
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
                          {r.aberta && (
                            <button className="btn primary" style={{ padding: '3px 8px', fontSize: 12 }}
                              onClick={() => onAbrirFechar(r.id)}>
                              Fechar
                            </button>
                          )}
                          {r.tem_foto_iniciante && (
                            <button className="btn" style={{ padding: '3px 8px', fontSize: 12 }}
                              onClick={() => onAbrirFoto({ src: `/api/imagem/bomba-iniciante/${r.id}`, titulo: `Iniciante - ${r.bomba_codigo}` })}>
                              Ini
                            </button>
                          )}
                          {r.tem_foto_encerrante && (
                            <button className="btn" style={{ padding: '3px 8px', fontSize: 12 }}
                              onClick={() => onAbrirFoto({ src: `/api/imagem/bomba-encerrante/${r.id}`, titulo: `Encerrante - ${r.bomba_codigo}` })}>
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
      )}
    </div>
  );
}

const HOJE = () => new Date().toISOString().slice(0, 10);
const HA_30 = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};

export default function BombasLeituras() {
  const router = useRouter();
  const [grupos, setGrupos] = useState([]);
  const [bombas, setBombas] = useState([]);
  const [from, setFrom] = useState(HA_30());
  const [to, setTo] = useState(HOJE());
  const [filtroBomba, setFiltroBomba] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [verFoto, setVerFoto] = useState(null);

  async function load() {
    setLoading(true);
    setErro('');
    try {
      const p = new URLSearchParams();
      if (from) p.set('from', from);
      if (to) p.set('to', to);
      if (filtroBomba) p.set('bomba_id', filtroBomba);
      const r = await fetch('/api/leituras-bomba/agrupadas?' + p.toString(), { credentials: 'same-origin' });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErro(d.error || `Erro ${r.status}`); setGrupos([]); }
      else setGrupos(d.data || []);
    } catch (err) {
      setErro('Erro: ' + err.message);
      setGrupos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetch('/api/bombas', { credentials: 'same-origin' })
      .then((r) => r.json()).then((d) => setBombas(d.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [from, to, filtroBomba]);

  return (
    <Layout>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h1 style={{ margin: 0 }}>Leituras das bombas</h1>
          <Link href="/bombas/nova" className="btn primary">+ Abrir leitura avulsa</Link>
        </div>
        <p className="muted" style={{ marginTop: 6, marginBottom: 0 }}>
          As leituras aparecem agrupadas pelas operações do dia. Clique em uma para ver os detalhes de cada bomba.
        </p>
      </div>

      <div className="card">
        <div className="row">
          <div className="col">
            <label>De</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="col">
            <label>Até</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="col">
            <label>Bomba</label>
            <select value={filtroBomba} onChange={(e) => setFiltroBomba(e.target.value)}>
              <option value="">Todas</option>
              {bombas.map((b) => (
                <option key={b.id} value={b.id}>{b.codigo} ({b.combustivel})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {erro && <div className="card"><div className="msg error">{erro}</div></div>}

      {loading ? (
        <div className="card"><p className="muted">Carregando...</p></div>
      ) : grupos.length === 0 ? (
        <div className="card">
          <p className="muted">Nenhuma operação com leituras no período. Inicie uma operação na aba Abastecimento.</p>
        </div>
      ) : (
        grupos.map((op) => (
          <GrupoLeituras key={op.id} op={op}
            bombaFiltroId={filtroBomba}
            onAbrirFoto={setVerFoto}
            onAbrirFechar={(id) => router.push(`/bombas/fechar/${id}`)} />
        ))
      )}

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
