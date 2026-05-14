import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import FotoCaptura from '@/components/FotoCaptura';
import QRScanner from '@/components/QRScanner';

export default function NovoAbastecimento() {
  const router = useRouter();
  const [step, setStep] = useState('scan');
  const [veiculo, setVeiculo] = useState(null);
  const [bombas, setBombas] = useState([]);
  const [operacao, setOperacao] = useState(null);
  const [opLoading, setOpLoading] = useState(true);
  const [form, setForm] = useState({
    bomba_id: '',
    odometro: '',
    qtd_diesel: '',
    qtd_arla32: '',
    foto_odometro: '',
    observacao: '',
  });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch('/api/operacoes/atual', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => { setOperacao(d.data); setOpLoading(false); });
    fetch('/api/bombas').then((r) => r.json()).then((d) => {
      setBombas((d.data || []).filter((b) => b.ativo));
    });
  }, []);

  async function onScan(token) {
    setErro('');
    try {
      const r = await fetch(`/api/veiculos/by-token/${encodeURIComponent(token)}`);
      const d = await r.json();
      if (!r.ok) {
        setErro(d.error || 'Veiculo nao encontrado');
        return;
      }
      setVeiculo(d.data);
      setStep('form');
    } catch (err) {
      setErro('Erro ao validar codigo');
    }
  }

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    if (!form.foto_odometro) {
      setErro('Foto do odometro obrigatoria');
      return;
    }
    const diesel = Number(form.qtd_diesel || 0);
    const arla = Number(form.qtd_arla32 || 0);
    if (diesel === 0 && arla === 0) {
      setErro('Informe diesel e/ou arla32');
      return;
    }
    setSalvando(true);
    try {
      const r = await fetch('/api/abastecimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          veiculo_id: veiculo.id,
          bomba_id: form.bomba_id || null,
          odometro: Number(form.odometro),
          qtd_diesel: diesel,
          qtd_arla32: arla,
          foto_odometro: form.foto_odometro,
          observacao: form.observacao,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        setErro(d.error || 'Falha ao salvar');
        setSalvando(false);
        return;
      }
      setSucesso('Abastecimento registrado!');
      setTimeout(() => router.push('/abastecimento'), 800);
    } catch (err) {
      setErro('Erro de conexao');
      setSalvando(false);
    }
  }

  if (opLoading) {
    return <Layout><div className="card"><p className="muted">Carregando...</p></div></Layout>;
  }

  if (!operacao) {
    return (
      <Layout>
        <div className="card">
          <h1>Novo abastecimento</h1>
          <div className="msg error">
            Nenhuma operacao aberta. Inicie o abastecimento do dia (iniciante das bombas) antes de registrar abastecimentos.
          </div>
          <div className="btn-group">
            <button className="btn success" onClick={() => router.push('/abastecimento/iniciar')}>
              ▶ Iniciar abastecimento do dia
            </button>
            <button className="btn" onClick={() => router.push('/abastecimento')}>Voltar</button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="card">
        <h1>Novo abastecimento</h1>
        {step === 'scan' && (
          <>
            <p className="muted">1. Escaneie o QRCode do veiculo</p>
            {erro && <div className="msg error">{erro}</div>}
            <QRScanner onScan={onScan} />
          </>
        )}
        {step === 'form' && veiculo && (
          <form onSubmit={submit}>
            <div className="msg info">
              Veiculo: <strong>{veiculo.prefixo}</strong>
              {veiculo.placa ? ` (${veiculo.placa})` : ''}
              {veiculo.modelo ? ` - ${veiculo.modelo}` : ''}
              <button type="button" className="btn" style={{ marginLeft: 12, padding: '3px 8px' }}
                onClick={() => { setVeiculo(null); setStep('scan'); }}>
                Trocar
              </button>
            </div>
            {erro && <div className="msg error">{erro}</div>}
            {sucesso && <div className="msg success">{sucesso}</div>}
            <div className="row">
              <div className="col">
                <label>Bomba utilizada</label>
                <select value={form.bomba_id} onChange={(e) => update('bomba_id', e.target.value)}>
                  <option value="">-- selecionar --</option>
                  {bombas.map((b) => (
                    <option key={b.id} value={b.id}>{b.codigo} ({b.combustivel})</option>
                  ))}
                </select>
              </div>
              <div className="col">
                <label>Odometro (km) *</label>
                <input type="number" required min="0" value={form.odometro}
                  onChange={(e) => update('odometro', e.target.value)} />
              </div>
            </div>
            <div className="row">
              <div className="col">
                <label>Quantidade de diesel (L)</label>
                <input type="number" step="0.01" min="0" value={form.qtd_diesel}
                  onChange={(e) => update('qtd_diesel', e.target.value)} />
              </div>
              <div className="col">
                <label>Quantidade de arla32 (L)</label>
                <input type="number" step="0.01" min="0" value={form.qtd_arla32}
                  onChange={(e) => update('qtd_arla32', e.target.value)} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <FotoCaptura
                label="Foto do odometro"
                required
                value={form.foto_odometro}
                onChange={(v) => update('foto_odometro', v)}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <label>Observacao</label>
              <textarea value={form.observacao} onChange={(e) => update('observacao', e.target.value)} />
            </div>
            <div className="btn-group" style={{ marginTop: 16 }}>
              <button type="submit" className="btn primary" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar abastecimento'}
              </button>
              <button type="button" className="btn" onClick={() => router.push('/abastecimento')}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
