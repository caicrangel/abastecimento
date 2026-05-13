import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { methodNotAllowed, badRequest } from '@/lib/helpers';

async function handler(req, res) {
  if (req.method === 'GET') {
    const rows = await query(
      'SELECT id, codigo, descricao, combustivel, ativo, created_at FROM bombas ORDER BY codigo'
    );
    return res.json({ data: rows });
  }
  if (req.method === 'POST') {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Sem permissao' });
    const { codigo, descricao, combustivel, ativo } = req.body || {};
    if (!codigo) return badRequest(res, 'Codigo obrigatorio');
    if (combustivel && !['diesel', 'arla32'].includes(combustivel)) {
      return badRequest(res, 'Combustivel invalido');
    }
    try {
      const result = await query(
        'INSERT INTO bombas (codigo, descricao, combustivel, ativo) VALUES (?, ?, ?, ?)',
        [codigo, descricao || null, combustivel || 'diesel', ativo === false ? 0 : 1]
      );
      return res.status(201).json({ id: result.insertId });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return badRequest(res, 'Codigo ja cadastrado');
      throw err;
    }
  }
  return methodNotAllowed(res, ['GET', 'POST']);
}

export default requireAuth(handler);
