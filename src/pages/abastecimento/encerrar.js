import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import FotoCaptura from '@/components/FotoCaptura';
import { formatDateTime, formatNumber } from '@/lib/format';

function formatDuracao(min) {
  if (min == null) return '-';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  return `${h}h ${m}min`;
}

export default function EncerrarOperacao() {
  const router = useRouter();
  const [op, setOp] = useState(null);
  const [encerrantes, setEncerrantes] = useState({});
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch('/api/operacoes/atual', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => {
        setOp(d.data);
        if (d.data) {
          const init = {};
          d.data.leituras.forEach((l) => { init[l.id] = { encerrante: '', foto: '' }; });
          setEncerrantes(init);
        }
      });
  }, []);

  function update(id, campo, valor) {
    setEncerrantes((e) => ({ ...e, [id]: { ...e[id], [campo]: valor } }));
  }

  async function submit(e) {
    e.preventDefault();
    setErro(''); setSucesso('');
    for (const l of op.leituras) {
      const e2 = encerrantes[l.id];
      if (!e2 || e2.encerrante === '') { setErro(`Informe o encerrante da bomba ${l.bomba_codigo}`); return; }
      if (Number(e2.encerrante) < Number(l.iniciante)) {
        setErro(`Encerrante da bomba ${l.bomba_codigo} (${e2.encerrante}) deve ser >= iniciante (${l.iniciante})`);
        return;
      }
      if (!e2.foto) { setErro(`Foto do encerrante da bomba ${l.bomba_codigo} obrigatoria`); return; }
    }
    setSalvando(true);
    try {
      const body = {
        observacao: observacao || null,
        leituras: op.leituras.map((l) => ({
          id: l.id,
          encerrante: Number(encerrantes[l.id].encerrante),
          foto_encerrante: encerrantes[l.id].foto,
        })),
      };
      const r = await fetch(`/api/operacoes/${op.id}/encerrar`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) { setErro(d.error || 'Falha'); setSalvando(false); return; }
      setSucesso('Operacao encerrada!');
      setTimeout(() => router.push('/abastecimento'), 800);
    } catch (err) {
      setErro('Erro de conexao: ' + err.message);
      setSalvando(false);
    }
  }

  if (!op) {
    return (
      <Layout>
        <div className="card">
          <h1>Encerrar abastecimento do dia</h1>
          <div className="msg info">Nenhuma operacao aberta no momento.</div>
          <button className="btn" onClick={() => router.push('/abastecimento')}>Voltar</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="card">
        <h1>Encerrar abastecimento do dia</h1>
        <div className="msg info">
          Operacao iniciada em <strong>{formatDateTime(op.iniciado_em)}</strong> por {op.iniciado_por_nome}.<br/>
          Duracao ate o momento: <strong>{formatDuracao(op.duracao_min)}</strong> -
          Abastecimentos: <strong>{op.qtd_abastecimentos}</strong>
          {op.qtd_abastecimentos > 0 && (
            <> - Tempo medio por carro: <strong>{formatDuracao(Math.round(op.duracao_min / op.qtd_abastecimentos))}</strong></>
          )}
        </div>
        <form onSubmit={submit}>
          {erro && <div className="msg error">{erro}</div>}
          {sucesso && <div className="msg success">{sucesso}</div>}
          {op.leituras.map((l) => {
            const e = encerrantes[l.id] || { encerrante: '', foto: '' };
            const consumo = Number(e.encerrante || 0) - Number(l.iniciante);
            return (
              <div key={l.id} className="card" style={{ background: '#f6f8fa', marginTop: 12 }}>
                <h2 style={{ marginBottom: 8 }}>
                  {l.bomba_codigo} <span className={`tag ${l.combustivel}`}>{l.combustivel}</span>
                </h2>
                <div className="muted" style={{ marginBottom: 8 }}>
                  Iniciante registrado: <strong>{formatNumber(l.iniciante)} L</strong>
                </div>
                <div className="row">
                  <div className="col">
                    <label>Encerrante (L) *</label>
                    <input type="number" step="0.01" min={l.iniciante} required
                      value={e.encerrante}
                      onChange={(ev) => update(l.id, 'encerrante', ev.target.value)} />
                  </div>
                  <div className="col">
                    <label>Consumo</label>
                    <input type="text" value={consumo > 0 ? formatNumber(consumo) + ' L' : '-'} readOnly />
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <FotoCaptura
                    label="Foto do encerrante"
                    required
                    value={e.foto}
                    onChange={(v) => update(l.id, 'foto', v)}
                  />
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 12 }}>
            <label>Observacao (opcional)</label>
            <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </div>
          <div className="btn-group" style={{ marginTop: 16 }}>
            <button type="submit" className="btn danger" disabled={salvando}>
              {salvando ? 'Encerrando...' : '⏹ Encerrar operacao'}
            </button>
            <button type="button" className="btn" onClick={() => router.push('/abastecimento')}>Cancelar</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
