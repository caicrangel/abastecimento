import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { methodNotAllowed } from '@/lib/helpers';

async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const { from, to, veiculo_id } = req.query;

  const where = [];
  const params = [];
  if (from) { where.push('o.data >= ?'); params.push(from); }
  if (to) { where.push('o.data <= ?'); params.push(to); }

  const vehFilter = veiculo_id ? 'AND a.veiculo_id = ?' : '';
  const vehParams = veiculo_id ? [Number(veiculo_id)] : [];

  const rows = await query(
    `SELECT o.id, o.data, o.iniciado_em, o.encerrado_em,
            (o.encerrado_em IS NULL) AS aberta,
            TIMESTAMPDIFF(MINUTE, o.iniciado_em, COALESCE(o.encerrado_em, NOW())) AS duracao_min,
            ui.nome AS iniciado_por_nome,
            ue.nome AS encerrado_por_nome,
            COALESCE(stats.qtd, 0) AS qtd_abastecimentos,
            COALESCE(stats.veiculos, 0) AS veiculos_atendidos,
            COALESCE(stats.diesel, 0) AS total_diesel,
            COALESCE(stats.arla32, 0) AS total_arla32
       FROM operacoes o
       JOIN users ui ON ui.id = o.iniciado_por
  LEFT JOIN users ue ON ue.id = o.encerrado_por
  LEFT JOIN (
       SELECT a.operacao_id AS op_id,
              COUNT(*) AS qtd,
              COUNT(DISTINCT a.veiculo_id) AS veiculos,
              SUM(a.qtd_diesel) AS diesel,
              SUM(a.qtd_arla32) AS arla32
         FROM abastecimentos a
        WHERE a.operacao_id IS NOT NULL ${vehFilter}
        GROUP BY a.operacao_id
       ) stats ON stats.op_id = o.id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY o.iniciado_em DESC
      LIMIT 200`,
    [...vehParams, ...params]
  );

  return res.json({
    data: rows.map((r) => ({
      ...r,
      qtd_abastecimentos: Number(r.qtd_abastecimentos),
      veiculos_atendidos: Number(r.veiculos_atendidos),
      total_diesel: Number(r.total_diesel),
      total_arla32: Number(r.total_arla32),
      duracao_min: r.duracao_min == null ? null : Number(r.duracao_min),
    })),
  });
}

export default requireAuth(handler);
