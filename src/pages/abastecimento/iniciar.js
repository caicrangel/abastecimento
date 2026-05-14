import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import FotoCaptura from '@/components/FotoCaptura';

export default function IniciarOperacao() {
  const router = useRouter();
  const [bombas, setBombas] = useState([]);
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [leituras, setLeituras] = useState({});
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [loadingBombas, setLoadingBombas] = useState(true);
  const [opAberta, setOpAberta] = useState(null);

  useEffect(() => {
    (async () => {
      const opR = await fetch('/api/operacoes/atual', { credentials: 'same-origin' });
      const opD = await opR.json();
      if (opD.data) { setOpAberta(opD.data); setLoadingBombas(false); return; }
      const r = await fetch('/api/bombas', { credentials: 'same-origin' });
      const d = await r.json();
      const ativas = (d.data || []).filter((b) => b.ativo);
      setBombas(ativas);
      const init = {};
      ativas.forEach((b) => { init[b.id] = { iniciante: '', foto: '' }; });
      setLeituras(init);
      setLoadingBombas(false);
    })();
  }, []);

  function update(bombaId, campo, valor) {
    setLeituras((l) => ({ ...l, [bombaId]: { ...l[bombaId], [campo]: valor } }));
  }

  async function submit(e) {
    e.preventDefault();
    setErro(''); setSucesso('');
    for (const b of bombas) {
      const l = leituras[b.id];
      if (!l || l.iniciante === '') { setErro(`Informe o iniciante da bomba ${b.codigo}`); return; }
      if (!l.foto) { setErro(`Foto do iniciante da bomba ${b.codigo} obrigatoria`); return; }
    }
    setSalvando(true);
    try {
      const body = {
        data,
        observacao: observacao || null,
        leituras: bombas.map((b) => ({
          bomba_id: b.id,
          iniciante: Number(leituras[b.id].iniciante),
          foto_iniciante: leituras[b.id].foto,
        })),
      };
      const r = await fetch('/api/operacoes', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) { setErro(d.error || 'Falha ao iniciar'); setSalvando(false); return; }
      setSucesso('Operacao iniciada!');
      setTimeout(() => router.push('/abastecimento'), 800);
    } catch (err) {
      setErro('Erro de conexao: ' + err.message);
      setSalvando(false);
    }
  }

  if (loadingBombas) return <Layout><div className="card"><p className="muted">Carregando...</p></div></Layout>;

  if (opAberta) {
    return (
      <Layout>
        <div className="card">
          <h1>Iniciar abastecimento do dia</h1>
          <div className="msg info">
            Ja existe uma operacao em andamento iniciada em {new Date(opAberta.iniciado_em).toLocaleString('pt-BR')}.
            Encerre a operacao atual antes de iniciar uma nova.
          </div>
          <div className="btn-group">
            <button className="btn primary" onClick={() => router.push('/abastecimento/encerrar')}>
              Ir para encerrar operacao
            </button>
            <button className="btn" onClick={() => router.push('/abastecimento')}>Voltar</button>
          </div>
        </div>
      </Layout>
    );
  }

  if (bombas.length === 0) {
    return (
      <Layout>
        <div className="card">
          <h1>Iniciar abastecimento do dia</h1>
          <div className="msg error">Nenhuma bomba ativa cadastrada. Cadastre as bombas em Cad. Bombas antes de iniciar.</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="card">
        <h1>Iniciar abastecimento do dia</h1>
        <p className="muted">
          Registre o iniciante de <strong>cada uma das {bombas.length} bombas ativas</strong> para abrir a operacao.
          Sem essas leituras, nao e possivel registrar abastecimentos.
        </p>
        <form onSubmit={submit}>
          {erro && <div className="msg error">{erro}</div>}
          {sucesso && <div className="msg success">{sucesso}</div>}
          <div className="row">
            <div className="col">
              <label>Data *</label>
              <input type="date" required value={data} onChange={(e) => setData(e.target.value)} />
            </div>
          </div>

          {bombas.map((b) => (
            <div key={b.id} className="card" style={{ background: '#f6f8fa', marginTop: 12 }}>
              <h2 style={{ marginBottom: 8 }}>
                {b.codigo} <span className={`tag ${b.combustivel}`}>{b.combustivel}</span>
              </h2>
              <div className="row">
                <div className="col">
                  <label>Iniciante (L) *</label>
                  <input type="number" step="0.01" min="0" required
                    value={leituras[b.id]?.iniciante || ''}
                    onChange={(e) => update(b.id, 'iniciante', e.target.value)} />
                </div>
                <div className="col">
                  <FotoCaptura
                    label="Foto do iniciante"
                    required
                    value={leituras[b.id]?.foto || ''}
                    onChange={(v) => update(b.id, 'foto', v)}
                  />
                </div>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 12 }}>
            <label>Observacao (opcional)</label>
            <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </div>
          <div className="btn-group" style={{ marginTop: 16 }}>
            <button type="submit" className="btn success" disabled={salvando}>
              {salvando ? 'Iniciando...' : '▶ Iniciar operacao'}
            </button>
            <button type="button" className="btn" onClick={() => router.push('/abastecimento')}>Cancelar</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
