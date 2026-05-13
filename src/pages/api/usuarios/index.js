import { requireAuth, hashPassword } from '@/lib/auth';
import { query } from '@/lib/db';
import { methodNotAllowed, badRequest } from '@/lib/helpers';

async function handler(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Sem permissao' });
  if (req.method === 'GET') {
    const rows = await query(
      'SELECT id, username, nome, role, ativo, created_at FROM users ORDER BY username'
    );
    return res.json({ data: rows });
  }
  if (req.method === 'POST') {
    const { username, password, nome, role, ativo } = req.body || {};
    if (!username || !password || !nome || !role) {
      return badRequest(res, 'Campos obrigatorios faltando');
    }
    if (!['admin', 'operador'].includes(role)) return badRequest(res, 'Role invalida');
    if (password.length < 6) return badRequest(res, 'Senha deve ter ao menos 6 caracteres');
    const hash = await hashPassword(password);
    try {
      const result = await query(
        'INSERT INTO users (username, password_hash, nome, role, ativo) VALUES (?, ?, ?, ?, ?)',
        [username, hash, nome, role, ativo === false ? 0 : 1]
      );
      return res.status(201).json({ id: result.insertId });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return badRequest(res, 'Usuario ja existe');
      throw err;
    }
  }
  return methodNotAllowed(res, ['GET', 'POST']);
}

export default requireAuth(handler);
