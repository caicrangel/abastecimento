import { useEffect, useState } from 'react';

const VAZIO = { id: null, codigo: '', descricao: '', combustivel: 'diesel', ativo: true };

export default function BombasCrud() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState('');

  async function load() {
    setLoading(true);
    const r = await fetch('/api/bombas', { credentials: 'same-origin' });
    const d = await r.json();
    setRows(d.data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function novo() { setEditando({ ...VAZIO }); setErro(''); }
  function editar(b) { setEditando({ ...b, ativo: !!b.ativo }); setErro(''); }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    const method = editando.id ? 'PUT' : 'POST';
    const url = editando.id ? `/api/bombas/${editando.id}` : '/api/bombas';
    const r = await fetch(url, {
      method, credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editando),
    });
    const d = await r.json();
    if (!r.ok) { setErro(d.error || 'Falha ao salvar'); return; }
    setEditando(null); await load();
  }

  async function excluir(b) {
    if (!confirm(`Excluir bomba ${b.codigo}?`)) return;
    const r = await fetch(`/api/bombas/${b.id}`, { method: 'DELETE', credentials: 'same-origin' });
    const d = await r.json();
    if (!r.ok) { alert(d.error || 'Falha ao excluir'); return; }
    await load();
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Bombas</h2>
        <button className="btn primary" onClick={novo}>+ Nova bomba</button>
      </div>
      {loading ? <p className="muted">Carregando...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr><th>Código</th><th>Descrição</th><th>Combustível</th><th>Status</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.codigo}</strong></td>
                  <td>{b.descricao || '-'}</td>
                  <td><span className={`tag ${b.combustivel}`}>{b.combustivel}</span></td>
                  <td><span className={`tag ${b.ativo ? 'ativo' : 'inativo'}`}>{b.ativo ? 'Ativo' : 'Inativo'}</span></td>
                  <td>
                    <div className="btn-group">
                      <button className="btn" style={{ padding: '3px 8px', fontSize: 12 }} onClick={() => editar(b)}>Editar</button>
                      <button className="btn danger" style={{ padding: '3px 8px', fontSize: 12 }} onClick={() => excluir(b)}>Excluir</button>
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
            <h2>{editando.id ? 'Editar bomba' : 'Nova bomba'}</h2>
            <form onSubmit={salvar}>
              {erro && <div className="msg error">{erro}</div>}
              <div style={{ marginBottom: 10 }}>
                <label>Código *</label>
                <input required value={editando.codigo}
                  onChange={(e) => setEditando({ ...editando, codigo: e.target.value })} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label>Descrição</label>
                <input value={editando.descricao || ''}
                  onChange={(e) => setEditando({ ...editando, descricao: e.target.value })} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label>Combustível *</label>
                <select value={editando.combustivel}
                  onChange={(e) => setEditando({ ...editando, combustivel: e.target.value })}>
                  <option value="diesel">Diesel</option>
                  <option value="arla32">Arla32</option>
                </select>
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
    </>
  );
}
