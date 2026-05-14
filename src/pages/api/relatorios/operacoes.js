import { requireAuth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { methodNotAllowed } from '@/lib/helpers';

async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const from = req.query.from || null;
  const to = req.query.to || null;

  const where = ['o.encerrado_em IS NOT NULL'];
  const params = [];
  if (from) { where.push('o.data >= ?'); params.push(from); }
  if (to) { where.push('o.data <= ?'); params.push(to); }

  const rows = await query(
    `SELECT o.id, o.data, o.iniciado_em, o.encerrado_em,
            TIMESTAMPDIFF(MINUTE, o.iniciado_em, o.encerrado_em) AS duracao_min,
            ui.nome AS iniciado_por_nome,
            ue.nome AS encerrado_por_nome,
            (SELECT COUNT(*) FROM abastecimentos a WHERE a.operacao_id = o.id) AS qtd_abastecimentos,
            (SELECT COALESCE(SUM(a.qtd_diesel), 0) FROM abastecimentos a WHERE a.operacao_id = o.id) AS total_diesel,
            (SELECT COALESCE(SUM(a.qtd_arla32), 0) FROM abastecimentos a WHERE a.operacao_id = o.id) AS total_arla32,
            (SELECT COALESCE(SUM(l.encerrante - l.iniciante), 0) FROM leituras_bomba l
              WHERE l.operacao_id = o.id AND l.encerrante IS NOT NULL) AS volume_bombas
       FROM operacoes o
       JOIN users ui ON ui.id = o.iniciado_por
  LEFT JOIN users ue ON ue.id = o.encerrado_por
      WHERE ${where.join(' AND ')}
      ORDER BY o.iniciado_em DESC
      LIMIT 200`,
    params
  );

  const data = rows.map((r) => ({
    ...r,
    duracao_min: Number(r.duracao_min),
    qtd_abastecimentos: Number(r.qtd_abastecimentos),
    tempo_medio_por_veiculo_min: r.qtd_abastecimentos > 0
      ? Math.round(Number(r.duracao_min) / Number(r.qtd_abastecimentos))
      : null,
    total_diesel: Number(r.total_diesel),
    total_arla32: Number(r.total_arla32),
    volume_bombas: Number(r.volume_bombas),
  }));

  const resumo = await queryOne(
    `SELECT COUNT(*) AS total_operacoes,
            COALESCE(AVG(TIMESTAMPDIFF(MINUTE, iniciado_em, encerrado_em)), 0) AS duracao_media_min,
            COALESCE(MIN(TIMESTAMPDIFF(MINUTE, iniciado_em, encerrado_em)), 0) AS duracao_min_min,
            COALESCE(MAX(TIMESTAMPDIFF(MINUTE, iniciado_em, encerrado_em)), 0) AS duracao_max_min
       FROM operacoes o
      WHERE ${where.join(' AND ')}`,
    params
  );

  return res.json({
    data,
    resumo: {
      total: Number(resumo.total_operacoes),
      duracao_media_min: Math.round(Number(resumo.duracao_media_min)),
      duracao_min_min: Number(resumo.duracao_min_min),
      duracao_max_min: Number(resumo.duracao_max_min),
    },
  });
}

export default requireAuth(handler);
