import { requireAuth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { methodNotAllowed, badRequest } from '@/lib/helpers';

async function handler(req, res) {
  const id = Number(req.query.id);
  if (!id) return badRequest(res, 'ID invalido');
  if (req.method === 'GET') {
    const row = await queryOne(
      'SELECT id, codigo, descricao, combustivel, ativo FROM bombas WHERE id = ?',
      [id]
    );
    if (!row) return res.status(404).json({ error: 'Nao encontrado' });
    return res.json({ data: row });
  }
  if (req.method === 'PUT') {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Sem permissao' });
    const { codigo, descricao, combustivel, ativo } = req.body || {};
    if (!codigo) return badRequest(res, 'Codigo obrigatorio');
    if (combustivel && !['diesel', 'arla32'].includes(combustivel)) {
      return badRequest(res, 'Combustivel invalido');
    }
    try {
      await query(
        'UPDATE bombas SET codigo = ?, descricao = ?, combustivel = ?, ativo = ? WHERE id = ?',
        [codigo, descricao || null, combustivel || 'diesel', ativo === false ? 0 : 1, id]
      );
      return res.json({ ok: true });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return badRequest(res, 'Codigo ja cadastrado');
      throw err;
    }
  }
  if (req.method === 'DELETE') {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Sem permissao' });
    try {
      await query('DELETE FROM bombas WHERE id = ?', [id]);
      return res.json({ ok: true });
    } catch (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return badRequest(res, 'Bomba possui leituras vinculadas, desative em vez de excluir');
      }
      throw err;
    }
  }
  return methodNotAllowed(res, ['GET', 'PUT', 'DELETE']);
}

export default requireAuth(handler);
