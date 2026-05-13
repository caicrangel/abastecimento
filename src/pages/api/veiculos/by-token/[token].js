import { requireAuth } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { methodNotAllowed } from '@/lib/helpers';

async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const token = String(req.query.token || '');
  const row = await queryOne(
    'SELECT id, prefixo, placa, modelo, ativo FROM veiculos WHERE qr_token = ?',
    [token]
  );
  if (!row) return res.status(404).json({ error: 'Veiculo nao encontrado' });
  if (!row.ativo) return res.status(400).json({ error: 'Veiculo inativo' });
  return res.json({ data: row });
}

export default requireAuth(handler);
