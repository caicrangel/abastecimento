import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import FotoCaptura from '@/components/FotoCaptura';
import { formatDateTime, formatNumber } from '@/lib/format';

export default function FecharLeitura() {
  const router = useRouter();
  const { id } = router.query;
  const [leitura, setLeitura] = useState(null);
  const [encerrante, setEncerrante] = useState('');
  const [fotoEncerrante, setFotoEncerrante] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/leituras-bomba/${id}`).then(async (r) => {
      const d = await r.json();
      if (!r.ok) { setErro(d.error || 'Falha ao carregar leitura'); return; }
      setLeitura(d.data);
      if (!d.data.aberta) setErro('Esta leitura ja esta fechada');
    });
  }, [id]);

  async function submit(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    if (!fotoEncerrante) { setErro('Foto do encerrante obrigatoria'); return; }
    if (Number(encerrante) < Number(leitura.iniciante)) {
      setErro(`Encerrante (${encerrante}) deve ser maior ou igual ao iniciante (${leitura.iniciante})`);
      return;
    }
    setSalvando(true);
    try {
      const r = await fetch(`/api/leituras-bomba/${id}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encerrante, foto_encerrante: fotoEncerrante, observacao: observacao || null }),
      });
      const d = await r.json();
      if (!r.ok) { setErro(d.error || 'Falha ao salvar'); setSalvando(false); return; }
      setSucesso('Leitura fechada!');
      setTimeout(() => router.push('/bombas'), 800);
    } catch (err) {
      setErro('Erro de conexao'); setSalvando(false);
    }
  }

  const consumo = leitura ? Number(encerrante || 0) - Number(leitura.iniciante || 0) : 0;

  return (
    <Layout>
      <div className="card">
        <h1>Fechar leitura de bomba</h1>
        {!leitura && !erro && <p className="muted">Carregando...</p>}
        {erro && <div className="msg error">{erro}</div>}
        {sucesso && <div className="msg success">{sucesso}</div>}
        {leitura && leitura.aberta && (
          <form onSubmit={submit}>
            <div className="msg info">
              <strong>Bomba {leitura.bomba_codigo}</strong> ({leitura.combustivel})<br/>
              Iniciante: <strong>{formatNumber(leitura.iniciante)} L</strong><br/>
              Aberta em: {formatDateTime(leitura.data_inicio)}
            </div>
            <div className="row">
              <div className="col">
                <label>Encerrante (L) *</label>
                <input type="number" step="0.01" min={leitura.iniciante} required
                  value={encerrante} onChange={(e) => setEncerrante(e.target.value)} />
              </div>
              <div className="col">
                <label>Consumo calculado</label>
                <input type="text" value={consumo > 0 ? formatNumber(consumo) + ' L' : '-'} readOnly />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <FotoCaptura
                label="Foto do encerrante"
                required
                value={fotoEncerrante}
                onChange={setFotoEncerrante}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <label>Observacao (opcional)</label>
              <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} />
            </div>
            <div className="btn-group" style={{ marginTop: 16 }}>
              <button type="submit" className="btn primary" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Fechar leitura'}
              </button>
              <button type="button" className="btn" onClick={() => router.push('/bombas')}>Cancelar</button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
