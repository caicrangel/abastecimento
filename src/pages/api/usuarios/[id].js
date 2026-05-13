import { requireAuth, hashPassword } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { methodNotAllowed, badRequest } from '@/lib/helpers';

async function handler(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Sem permissao' });
  const id = Number(req.query.id);
  if (!id) return badRequest(res, 'ID invalido');
  if (req.method === 'GET') {
    const row = await queryOne(
      'SELECT id, username, nome, role, ativo FROM users WHERE id = ?',
      [id]
    );
    if (!row) return res.status(404).json({ error: 'Nao encontrado' });
    return res.json({ data: row });
  }
  if (req.method === 'PUT') {
    const { username, password, nome, role, ativo } = req.body || {};
    if (!username || !nome || !role) return badRequest(res, 'Campos obrigatorios faltando');
    if (!['admin', 'operador'].includes(role)) return badRequest(res, 'Role invalida');
    try {
      if (password && password.length > 0) {
        if (password.length < 6) return badRequest(res, 'Senha deve ter ao menos 6 caracteres');
        const hash = await hashPassword(password);
        await query(
          'UPDATE users SET username = ?, password_hash = ?, nome = ?, role = ?, ativo = ? WHERE id = ?',
          [username, hash, nome, role, ativo === false ? 0 : 1, id]
        );
      } else {
        await query(
          'UPDATE users SET username = ?, nome = ?, role = ?, ativo = ? WHERE id = ?',
          [username, nome, role, ativo === false ? 0 : 1, id]
        );
      }
      return res.json({ ok: true });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return badRequest(res, 'Usuario ja existe');
      throw err;
    }
  }
  if (req.method === 'DELETE') {
    if (id === req.user.id) return badRequest(res, 'Nao pode excluir o proprio usuario');
    try {
      await query('DELETE FROM users WHERE id = ?', [id]);
      return res.json({ ok: true });
    } catch (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return badRequest(res, 'Usuario possui lancamentos vinculados, desative em vez de excluir');
      }
      throw err;
    }
  }
  return methodNotAllowed(res, ['GET', 'PUT', 'DELETE']);
}

export default requireAuth(handler);
