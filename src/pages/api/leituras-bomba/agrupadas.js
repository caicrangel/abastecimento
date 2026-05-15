import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { methodNotAllowed } from '@/lib/helpers';

async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const { from, to, bomba_id } = req.query;

  const where = [];
  const params = [];
  if (from) { where.push('o.data >= ?'); params.push(from); }
  if (to) { where.push('o.data <= ?'); params.push(to); }

  const bombaFilter = bomba_id ? 'AND l.bomba_id = ?' : '';
  const bombaParams = bomba_id ? [Number(bomba_id)] : [];

  const rows = await query(
    `SELECT o.id, o.data, o.iniciado_em, o.encerrado_em,
            (o.encerrado_em IS NULL) AS aberta,
            TIMESTAMPDIFF(MINUTE, o.iniciado_em, COALESCE(o.encerrado_em, NOW())) AS duracao_min,
            ui.nome AS iniciado_por_nome,
            ue.nome AS encerrado_por_nome,
            COALESCE(stats.qtd, 0) AS qtd_leituras,
            COALESCE(stats.abertas, 0) AS leituras_abertas,
            COALESCE(stats.volume, 0) AS volume_total
       FROM operacoes o
       JOIN users ui ON ui.id = o.iniciado_por
  LEFT JOIN users ue ON ue.id = o.encerrado_por
  LEFT JOIN (
       SELECT l.operacao_id AS op_id,
              COUNT(*) AS qtd,
              SUM(CASE WHEN l.encerrante IS NULL THEN 1 ELSE 0 END) AS abertas,
              SUM(CASE WHEN l.encerrante IS NOT NULL THEN l.encerrante - l.iniciante ELSE 0 END) AS volume
         FROM leituras_bomba l
        WHERE l.operacao_id IS NOT NULL ${bombaFilter}
        GROUP BY l.operacao_id
       ) stats ON stats.op_id = o.id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
        ${where.length ? 'AND' : 'WHERE'} stats.qtd IS NOT NULL
      ORDER BY o.iniciado_em DESC
      LIMIT 200`,
    [...bombaParams, ...params]
  );

  return res.json({
    data: rows.map((r) => ({
      ...r,
      qtd_leituras: Number(r.qtd_leituras),
      leituras_abertas: Number(r.leituras_abertas),
      volume_total: Number(r.volume_total),
      duracao_min: r.duracao_min == null ? null : Number(r.duracao_min),
    })),
  });
}

export default requireAuth(handler);
