import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { methodNotAllowed } from '@/lib/helpers';

async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const from = req.query.from || null;
  const to = req.query.to || null;
  const where = ['v.ativo = 1'];
  const params = [];
  if (from) { where.push('DATE(a.data_abastecimento) >= ?'); params.push(from); }
  if (to) { where.push('DATE(a.data_abastecimento) <= ?'); params.push(to); }

  const rows = await query(
    `SELECT v.id AS veiculo_id, v.prefixo, v.placa, v.modelo,
            COUNT(a.id) AS qtd_abastecimentos,
            COALESCE(SUM(a.qtd_diesel), 0) AS total_diesel,
            COALESCE(SUM(a.qtd_arla32), 0) AS total_arla32,
            MIN(a.odometro) AS odometro_inicial,
            MAX(a.odometro) AS odometro_final,
            CASE
              WHEN COUNT(a.id) > 1 AND SUM(a.qtd_diesel) > 0
              THEN (MAX(a.odometro) - MIN(a.odometro)) / SUM(a.qtd_diesel)
              ELSE NULL
            END AS km_por_litro,
            MAX(a.data_abastecimento) AS ultimo_abastecimento
       FROM veiculos v
  LEFT JOIN abastecimentos a ON a.veiculo_id = v.id
            ${from || to ? 'AND ' + where.slice(1).join(' AND ') : ''}
      WHERE v.ativo = 1
   GROUP BY v.id, v.prefixo, v.placa, v.modelo
   ORDER BY v.prefixo`,
    params
  );
  return res.json({ data: rows });
}

export default requireAuth(handler);
