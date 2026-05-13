import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { methodNotAllowed } from '@/lib/helpers';

async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const dias = Number(req.query.dias || 1);
  const rows = await query(
    `SELECT v.id, v.prefixo, v.placa, v.modelo,
            MAX(a.data_abastecimento) AS ultimo_abastecimento,
            DATEDIFF(NOW(), MAX(a.data_abastecimento)) AS dias_sem_abastecer
       FROM veiculos v
  LEFT JOIN abastecimentos a ON a.veiculo_id = v.id
      WHERE v.ativo = 1
   GROUP BY v.id, v.prefixo, v.placa, v.modelo
     HAVING MAX(a.data_abastecimento) IS NULL
         OR DATEDIFF(NOW(), MAX(a.data_abastecimento)) >= ?
   ORDER BY ultimo_abastecimento IS NOT NULL, ultimo_abastecimento ASC`,
    [dias]
  );
  return res.json({ data: rows, dias });
}

export default requireAuth(handler);
