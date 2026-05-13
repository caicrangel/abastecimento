import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateToken, methodNotAllowed, badRequest } from '@/lib/helpers';

async function handler(req, res) {
  if (req.method === 'GET') {
    const rows = await query(
      'SELECT id, prefixo, placa, modelo, qr_token, ativo, created_at FROM veiculos ORDER BY prefixo'
    );
    return res.json({ data: rows });
  }
  if (req.method === 'POST') {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Sem permissao' });
    const { prefixo, placa, modelo, ativo } = req.body || {};
    if (!prefixo) return badRequest(res, 'Prefixo obrigatorio');
    const token = generateToken(24);
    try {
      const result = await query(
        'INSERT INTO veiculos (prefixo, placa, modelo, qr_token, ativo) VALUES (?, ?, ?, ?, ?)',
        [prefixo, placa || null, modelo || null, token, ativo === false ? 0 : 1]
      );
      return res.status(201).json({ id: result.insertId, qr_token: token });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return badRequest(res, 'Prefixo ja cadastrado');
      throw err;
    }
  }
  return methodNotAllowed(res, ['GET', 'POST']);
}

export default requireAuth(handler);
