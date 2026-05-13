import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { methodNotAllowed } from '@/lib/helpers';

async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const from = req.query.from || new Date().toISOString().slice(0, 10);
  const to = req.query.to || from;

  const rows = await query(
    `SELECT b.id AS bomba_id, b.codigo, b.combustivel,
            COALESCE(SUM(CASE WHEN l.encerrante IS NOT NULL
                              THEN l.encerrante - l.iniciante ELSE 0 END), 0) AS volume_bomba,
            SUM(CASE WHEN l.encerrante IS NULL THEN 1 ELSE 0 END) AS leituras_abertas,
            COUNT(l.id) AS total_leituras,
            COALESCE((
              SELECT SUM(CASE WHEN b.combustivel = 'diesel' THEN a.qtd_diesel ELSE a.qtd_arla32 END)
                FROM abastecimentos a
               WHERE a.bomba_id = b.id
                 AND DATE(a.data_abastecimento) BETWEEN ? AND ?
            ), 0) AS volume_abastecido
       FROM bombas b
  LEFT JOIN leituras_bomba l ON l.bomba_id = b.id
            AND l.data_leitura BETWEEN ? AND ?
      WHERE b.ativo = 1
   GROUP BY b.id, b.codigo, b.combustivel
   ORDER BY b.codigo`,
    [from, to, from, to]
  );
  const data = rows.map((r) => ({
    ...r,
    volume_bomba: Number(r.volume_bomba),
    volume_abastecido: Number(r.volume_abastecido),
    divergencia: Number(r.volume_bomba) - Number(r.volume_abastecido),
  }));
  return res.json({ data, from, to });
}

export default requireAuth(handler);
