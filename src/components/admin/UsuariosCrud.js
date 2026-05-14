import { useEffect, useState } from 'react';

const VAZIO = { id: null, username: '', nome: '', role: 'operador', password: '', ativo: true };

export default function UsuariosCrud() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState('');

  async function load() {
    setLoading(true);
    const r = await fetch('/api/usuarios', { credentials: 'same-origin' });
    const d = await r.json();
    setRows(d.data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function novo() { setEditando({ ...VAZIO }); setErro(''); }
  function editar(u) { setEditando({ ...u, ativo: !!u.ativo, password: '' }); setErro(''); }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    const method = editando.id ? 'PUT' : 'POST';
    const url = editando.id ? `/api/usuarios/${editando.id}` : '/api/usuarios';
    const r = await fetch(url, {
      method, credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editando),
    });
    const d = await r.json();
    if (!r.ok) { setErro(d.error || 'Falha ao salvar'); return; }
    setEditando(null); await load();
  }

  async function excluir(u) {
    if (!confirm(`Excluir usuario ${u.username}?`)) return;
    const r = await fetch(`/api/usuarios/${u.id}`, { method: 'DELETE', credentials: 'same-origin' });
    const d = await r.json();
    if (!r.ok) { alert(d.error || 'Falha ao excluir'); return; }
    await load();
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Usuarios</h2>
        <button className="btn primary" onClick={novo}>+ Novo usuario</button>
      </div>
      {loading ? <p className="muted">Carregando...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr><th>Usuario</th><th>Nome</th><th>Perfil</th><th>Status</th><th>Acoes</th></tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.username}</strong></td>
                  <td>{u.nome}</td>
                  <td><span className={`tag ${u.role}`}>{u.role}</span></td>
                  <td><span className={`tag ${u.ativo ? 'ativo' : 'inativo'}`}>{u.ativo ? 'Ativo' : 'Inativo'}</span></td>
                  <td>
                    <div className="btn-group">
                      <button className="btn" style={{ padding: '3px 8px', fontSize: 12 }} onClick={() => editar(u)}>Editar</button>
                      <button className="btn danger" style={{ padding: '3px 8px', fontSize: 12 }} onClick={() => excluir(u)}>Excluir</button>
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
            <h2>{editando.id ? 'Editar usuario' : 'Novo usuario'}</h2>
            <form onSubmit={salvar}>
              {erro && <div className="msg error">{erro}</div>}
              <div style={{ marginBottom: 10 }}>
                <label>Usuario (login) *</label>
                <input required value={editando.username}
                  onChange={(e) => setEditando({ ...editando, username: e.target.value })} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label>Nome completo *</label>
                <input required value={editando.nome}
                  onChange={(e) => setEditando({ ...editando, nome: e.target.value })} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label>Perfil *</label>
                <select value={editando.role}
                  onChange={(e) => setEditando({ ...editando, role: e.target.value })}>
                  <option value="operador">Operador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label>Senha {editando.id ? '(deixe em branco para manter)' : '*'}</label>
                <input type="password" required={!editando.id}
                  value={editando.password}
                  onChange={(e) => setEditando({ ...editando, password: e.target.value })} />
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
