import Link from 'next/link';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { formatDate, formatDateTime, formatInt, formatNumber, formatDuracao } from '@/lib/format';
import { IconChevronDown, IconChevronUp, IconStop, IconCamera } from '@/components/Icons';

function GrupoOperacao({ op, veiculoFiltroId, onAbrirFoto }) {
  const [aberto, setAberto] = useState(false);
  const [abastecimentos, setAbastecimentos] = useState(null);
  const [loading, setLoading] = useState(false);

  async function carregar() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('operacao_id', op.id);
    if (veiculoFiltroId) params.set('veiculo_id', veiculoFiltroId);
    const r = await fetch('/api/abastecimentos?' + params.toString(), { credentials: 'same-origin' });
    const d = await r.json();
    setAbastecimentos(d.data || []);
    setLoading(false);
  }

  function toggle() {
    const novo = !aberto;
    setAberto(novo);
    if (novo && abastecimentos === null) carregar();
  }

  const tempoMedio = op.qtd_abastecimentos > 0 && op.duracao_min
    ? Math.round(op.duracao_min / op.qtd_abastecimentos)
    : null;

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
          <Stat label="Abast." valor={formatInt(op.qtd_abastecimentos)} />
          <Stat label="Veículos" valor={formatInt(op.veiculos_atendidos)} />
          <Stat label="Diesel" valor={`${formatNumber(op.total_diesel)} L`} />
          <Stat label="Arla32" valor={`${formatNumber(op.total_arla32)} L`} />
          {tempoMedio != null && <Stat label="Tempo méd./carro" valor={formatDuracao(tempoMedio)} />}
          <div style={{ color: 'var(--muted)' }}>
            {aberto ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </div>
        </div>
      </button>

      {aberto && (
        <div style={{ borderTop: '1px solid var(--border)', padding: 16 }}>
          {loading ? (
            <p className="muted">Carregando abastecimentos...</p>
          ) : !abastecimentos || abastecimentos.length === 0 ? (
            <p className="muted">Nenhum abastecimento nesta operação{veiculoFiltroId ? ' para o veículo filtrado' : ''}.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Veiculo</th>
                    <th>Bomba</th>
                    <th>Odômetro</th>
                    <th>Diesel (L)</th>
                    <th>Arla32 (L)</th>
                    <th>Operador</th>
                    <th>Foto</th>
                  </tr>
                </thead>
                <tbody>
                  {abastecimentos.map((r) => (
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
                            onClick={() => onAbrirFoto(`/api/imagem/abastecimento-odometro/${r.id}`)}>
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
      )}
    </div>
  );
}

function Stat({ label, valor }) {
  return (
    <div style={{ textAlign: 'right', minWidth: 70 }}>
      <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{valor}</div>
    </div>
  );
}

const HOJE = () => new Date().toISOString().slice(0, 10);
const HA_30 = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};

export default function AbastecimentoList() {
  const [operacao, setOperacao] = useState(null);
  const [opLoading, setOpLoading] = useState(true);
  const [from, setFrom] = useState(HA_30());
  const [to, setTo] = useState(HOJE());
  const [veiculoFiltro, setVeiculoFiltro] = useState('');
  const [veiculos, setVeiculos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [verFoto, setVerFoto] = useState(null);

  async function carregarOperacao() {
    setOpLoading(true);
    try {
      const r = await fetch('/api/operacoes/atual', { credentials: 'same-origin' });
      const d = await r.json();
      setOperacao(d.data);
    } catch (e) { setOperacao(null); }
    finally { setOpLoading(false); }
  }

  async function carregarGrupos() {
    setLoading(true); setErro('');
    try {
      const p = new URLSearchParams();
      if (from) p.set('from', from);
      if (to) p.set('to', to);
      if (veiculoFiltro) p.set('veiculo_id', veiculoFiltro);
      const r = await fetch('/api/abastecimentos/agrupados?' + p.toString(), { credentials: 'same-origin' });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErro(d.error || `Erro ${r.status}`); setGrupos([]); }
      else setGrupos(d.data || []);
    } catch (err) {
      setErro('Erro: ' + err.message);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    carregarOperacao();
    fetch('/api/veiculos', { credentials: 'same-origin' })
      .then((r) => r.json()).then((d) => setVeiculos(d.data || [])).catch(() => {});
  }, []);

  useEffect(() => { carregarGrupos(); /* eslint-disable-next-line */ }, [from, to, veiculoFiltro]);

  const opAberta = !!operacao;

  return (
    <Layout>
      <div className="card" style={{
        background: opAberta ? 'var(--op-aberta-bg)' : 'var(--op-fechada-bg)',
        borderColor: opAberta ? 'var(--op-aberta-border)' : 'var(--op-fechada-border)',
      }}>
        {opLoading ? (
          <p className="muted">Carregando status da operação...</p>
        ) : opAberta ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600, textTransform: 'uppercase' }}>
                Operação em andamento
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                Iniciada em {formatDateTime(operacao.iniciado_em)}
              </div>
              <div className="muted" style={{ marginTop: 2 }}>
                Por: {operacao.iniciado_por_nome} - Duração: {formatDuracao(operacao.duracao_min)} - Abastecimentos: {operacao.qtd_abastecimentos}
              </div>
            </div>
            <div className="btn-group">
              <Link href="/abastecimento/novo" className="btn primary">
                <IconCamera size={14} /> <span>Novo abastecimento</span>
              </Link>
              <Link href="/abastecimento/encerrar" className="btn danger">
                <IconStop size={12} /> <span>Encerrar dia</span>
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--warning)', fontWeight: 600, textTransform: 'uppercase' }}>
                Nenhuma operação em andamento
              </div>
              <div style={{ fontSize: 16, marginTop: 4 }}>
                Inicie o abastecimento do dia (iniciante das bombas) para liberar lançamentos.
              </div>
            </div>
            <Link href="/abastecimento/iniciar" className="btn success" style={{ fontSize: 16, padding: '10px 18px' }}>
              <span style={{ fontSize: 14 }}>▶</span> <span>Iniciar abastecimento do dia</span>
            </Link>
          </div>
        )}
      </div>

      <div className="card">
        <h1 style={{ margin: 0 }}>Operações & abastecimentos</h1>
        <p className="muted" style={{ marginTop: 6, marginBottom: 0 }}>
          As operações do período aparecem agrupadas. Clique em uma para ver os abastecimentos.
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
            <label>Veículo</label>
            <select value={veiculoFiltro} onChange={(e) => setVeiculoFiltro(e.target.value)}>
              <option value="">Todos</option>
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>{v.prefixo}{v.placa ? ` - ${v.placa}` : ''}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {erro && <div className="card"><div className="msg error">{erro}</div></div>}

      {loading ? (
        <div className="card"><p className="muted">Carregando operações...</p></div>
      ) : grupos.length === 0 ? (
        <div className="card"><p className="muted">Nenhuma operação encontrada no período.</p></div>
      ) : (
        grupos.map((op) => (
          <GrupoOperacao key={op.id} op={op}
            veiculoFiltroId={veiculoFiltro}
            onAbrirFoto={setVerFoto} />
        ))
      )}

      {verFoto && (
        <div className="modal-bg" onClick={() => setVerFoto(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Foto do odômetro</h2>
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
