import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { methodNotAllowed } from '@/lib/helpers';

async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const rows = await query(
    `SELECT l.id, l.bomba_id, l.data_leitura, l.data_inicio,
            l.iniciante,
            TIMESTAMPDIFF(MINUTE, l.data_inicio, NOW()) AS minutos_aberta,
            b.codigo AS bomba_codigo, b.combustivel,
            u.nome AS operador
       FROM leituras_bomba l
       JOIN bombas b ON b.id = l.bomba_id
       JOIN users u ON u.id = l.user_id
      WHERE l.encerrante IS NULL
      ORDER BY l.data_inicio ASC`
  );
  return res.json({ data: rows, total: rows.length });
}

export default requireAuth(handler);
