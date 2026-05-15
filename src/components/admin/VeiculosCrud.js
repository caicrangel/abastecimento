import { useEffect, useState } from 'react';

const VAZIO = { id: null, prefixo: '', placa: '', modelo: '', ativo: true };

export default function VeiculosCrud() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [qrcode, setQrcode] = useState(null);
  const [erro, setErro] = useState('');

  async function load() {
    setLoading(true);
    const r = await fetch('/api/veiculos', { credentials: 'same-origin' });
    const d = await r.json();
    setRows(d.data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function novo() { setEditando({ ...VAZIO }); setErro(''); }
  function editar(v) { setEditando({ ...v, ativo: !!v.ativo }); setErro(''); }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    const method = editando.id ? 'PUT' : 'POST';
    const url = editando.id ? `/api/veiculos/${editando.id}` : '/api/veiculos';
    const r = await fetch(url, {
      method, credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editando),
    });
    const d = await r.json();
    if (!r.ok) { setErro(d.error || 'Falha ao salvar'); return; }
    setEditando(null); await load();
  }

  async function excluir(v) {
    if (!confirm(`Excluir veículo ${v.prefixo}?`)) return;
    const r = await fetch(`/api/veiculos/${v.id}`, { method: 'DELETE', credentials: 'same-origin' });
    const d = await r.json();
    if (!r.ok) { alert(d.error || 'Falha ao excluir'); return; }
    await load();
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Veículos</h2>
        <button className="btn primary" onClick={novo}>+ Novo veículo</button>
      </div>
      {loading ? <p className="muted">Carregando...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Prefixo</th><th>Placa</th><th>Modelo</th><th>Status</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id}>
                  <td><strong>{v.prefixo}</strong></td>
                  <td>{v.placa || '-'}</td>
                  <td>{v.modelo || '-'}</td>
                  <td><span className={`tag ${v.ativo ? 'ativo' : 'inativo'}`}>{v.ativo ? 'Ativo' : 'Inativo'}</span></td>
                  <td>
                    <div className="btn-group">
                      <button className="btn" style={{ padding: '3px 8px', fontSize: 12 }} onClick={() => setQrcode(v)}>QR</button>
                      <button className="btn" style={{ padding: '3px 8px', fontSize: 12 }} onClick={() => editar(v)}>Editar</button>
                      <button className="btn danger" style={{ padding: '3px 8px', fontSize: 12 }} onClick={() => excluir(v)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editando && (
        <div className="modal-bg" onClick={() => setEditando(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editando.id ? 'Editar veículo' : 'Novo veículo'}</h2>
            <form onSubmit={salvar}>
              {erro && <div className="msg error">{erro}</div>}
              <div style={{ marginBottom: 10 }}>
                <label>Prefixo *</label>
                <input required value={editando.prefixo}
                  onChange={(e) => setEditando({ ...editando, prefixo: e.target.value })} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label>Placa</label>
                <input value={editando.placa || ''}
                  onChange={(e) => setEditando({ ...editando, placa: e.target.value.toUpperCase() })} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label>Modelo</label>
                <input value={editando.modelo || ''}
                  onChange={(e) => setEditando({ ...editando, modelo: e.target.value })} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label>
                  <input type="checkbox" checked={editando.ativo}
                    onChange={(e) => setEditando({ ...editando, ativo: e.target.checked })} /> Ativo
                </label>
              </div>
              <div className="btn-group">
                <button type="submit" className="btn primary">Salvar</button>
                <button type="button" className="btn" onClick={() => setEditando(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {qrcode && (
        <div className="modal-bg" onClick={() => setQrcode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>QRCode - {qrcode.prefixo}</h2>
            <img src={`/api/veiculos/${qrcode.id}/qrcode`} alt="qrcode"
              style={{ width: '100%', maxWidth: 360, display: 'block', margin: '0 auto' }} />
            <p className="muted" style={{ textAlign: 'center', wordBreak: 'break-all', marginTop: 8 }}>
              Token: {qrcode.qr_token}
            </p>
            <div className="btn-group" style={{ marginTop: 12, justifyContent: 'center' }}>
              <a className="btn primary" href={`/api/veiculos/${qrcode.id}/qrcode`} target="_blank" rel="noreferrer">
                Abrir / Imprimir
              </a>
              <button className="btn" onClick={() => setQrcode(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
