import { requireAuth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { methodNotAllowed, badRequest } from '@/lib/helpers';

async function handler(req, res) {
  const id = Number(req.query.id);
  if (!id) return badRequest(res, 'ID invalido');
  if (req.method === 'GET') {
    const row = await queryOne(
      'SELECT id, prefixo, placa, modelo, qr_token, ativo FROM veiculos WHERE id = ?',
      [id]
    );
    if (!row) return res.status(404).json({ error: 'Nao encontrado' });
    return res.json({ data: row });
  }
  if (req.method === 'PUT') {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Sem permissao' });
    const { prefixo, placa, modelo, ativo } = req.body || {};
    if (!prefixo) return badRequest(res, 'Prefixo obrigatorio');
    try {
      await query(
        'UPDATE veiculos SET prefixo = ?, placa = ?, modelo = ?, ativo = ? WHERE id = ?',
        [prefixo, placa || null, modelo || null, ativo === false ? 0 : 1, id]
      );
      return res.json({ ok: true });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return badRequest(res, 'Prefixo ja cadastrado');
      throw err;
    }
  }
  if (req.method === 'DELETE') {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Sem permissao' });
    try {
      await query('DELETE FROM veiculos WHERE id = ?', [id]);
      return res.json({ ok: true });
    } catch (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return badRequest(res, 'Veiculo possui abastecimentos vinculados, desative em vez de excluir');
      }
      throw err;
    }
  }
  return methodNotAllowed(res, ['GET', 'PUT', 'DELETE']);
}

export default requireAuth(handler);
