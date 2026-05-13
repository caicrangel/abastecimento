import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { methodNotAllowed } from '@/lib/helpers';

async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const dias = Math.min(Number(req.query.dias || 30), 365);
  const rows = await query(
    `SELECT DATE(data_abastecimento) AS dia,
            COUNT(*) AS qtd_abastecimentos,
            COUNT(DISTINCT veiculo_id) AS veiculos,
            COALESCE(SUM(qtd_diesel), 0) AS diesel,
            COALESCE(SUM(qtd_arla32), 0) AS arla32
       FROM abastecimentos
      WHERE data_abastecimento >= DATE_SUB(NOW(), INTERVAL ? DAY)
   GROUP BY DATE(data_abastecimento)
   ORDER BY dia DESC`,
    [dias]
  );
  return res.json({ data: rows, dias });
}

export default requireAuth(handler);
