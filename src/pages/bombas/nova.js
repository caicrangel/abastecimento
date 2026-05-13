import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import FotoCaptura from '@/components/FotoCaptura';

export default function NovaLeitura() {
  const router = useRouter();
  const [bombas, setBombas] = useState([]);
  const [form, setForm] = useState({
    bomba_id: '',
    data_leitura: new Date().toISOString().slice(0, 10),
    iniciante: '',
    encerrante: '',
    foto_iniciante: '',
    foto_encerrante: '',
    observacao: '',
  });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch('/api/bombas').then((r) => r.json()).then((d) => {
      setBombas((d.data || []).filter((b) => b.ativo));
    });
  }, []);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    if (!form.bomba_id) { setErro('Selecione a bomba'); return; }
    if (!form.foto_iniciante) { setErro('Foto do iniciante obrigatoria'); return; }
    if (!form.foto_encerrante) { setErro('Foto do encerrante obrigatoria'); return; }
    if (Number(form.encerrante) < Number(form.iniciante)) {
      setErro('Encerrante deve ser maior ou igual ao iniciante');
      return;
    }
    setSalvando(true);
    try {
      const r = await fetch('/api/leituras-bomba', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) {
        setErro(d.error || 'Falha ao salvar');
        setSalvando(false);
        return;
      }
      setSucesso('Leitura registrada!');
      setTimeout(() => router.push('/bombas'), 800);
    } catch (err) {
      setErro('Erro de conexao');
      setSalvando(false);
    }
  }

  const consumo = (Number(form.encerrante) || 0) - (Number(form.iniciante) || 0);

  return (
    <Layout>
      <div className="card">
        <h1>Nova leitura de bomba</h1>
        <form onSubmit={submit}>
          {erro && <div className="msg error">{erro}</div>}
          {sucesso && <div className="msg success">{sucesso}</div>}
          <div className="row">
            <div className="col">
              <label>Bomba *</label>
              <select required value={form.bomba_id} onChange={(e) => update('bomba_id', e.target.value)}>
                <option value="">-- selecionar --</option>
                {bombas.map((b) => (
                  <option key={b.id} value={b.id}>{b.codigo} ({b.combustivel})</option>
                ))}
              </select>
            </div>
            <div className="col">
              <label>Data *</label>
              <input type="date" required value={form.data_leitura}
                onChange={(e) => update('data_leitura', e.target.value)} />
            </div>
          </div>
          <div className="row">
            <div className="col">
              <label>Iniciante (L) *</label>
              <input type="number" step="0.01" min="0" required value={form.iniciante}
                onChange={(e) => update('iniciante', e.target.value)} />
            </div>
            <div className="col">
              <label>Encerrante (L) *</label>
              <input type="number" step="0.01" min="0" required value={form.encerrante}
                onChange={(e) => update('encerrante', e.target.value)} />
            </div>
          </div>
          {consumo > 0 && (
            <p className="muted">Consumo calculado: <strong>{consumo.toFixed(2)} L</strong></p>
          )}
          <div className="row" style={{ marginTop: 12 }}>
            <div className="col">
              <FotoCaptura
                label="Foto do iniciante"
                required
                value={form.foto_iniciante}
                onChange={(v) => update('foto_iniciante', v)}
              />
            </div>
            <div className="col">
              <FotoCaptura
                label="Foto do encerrante"
                required
                value={form.foto_encerrante}
                onChange={(v) => update('foto_encerrante', v)}
              />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label>Observacao</label>
            <textarea value={form.observacao} onChange={(e) => update('observacao', e.target.value)} />
          </div>
          <div className="btn-group" style={{ marginTop: 16 }}>
            <button type="submit" className="btn primary" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar leitura'}
            </button>
            <button type="button" className="btn" onClick={() => router.push('/bombas')}>Cancelar</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
