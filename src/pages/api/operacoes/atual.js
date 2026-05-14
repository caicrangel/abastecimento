import { requireAuth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { methodNotAllowed } from '@/lib/helpers';

async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const op = await queryOne(
    `SELECT o.id, o.data, o.iniciado_em,
            TIMESTAMPDIFF(MINUTE, o.iniciado_em, NOW()) AS duracao_min,
            ui.nome AS iniciado_por_nome,
            (SELECT COUNT(*) FROM abastecimentos a WHERE a.operacao_id = o.id) AS qtd_abastecimentos
       FROM operacoes o
       JOIN users ui ON ui.id = o.iniciado_por
      WHERE o.encerrado_em IS NULL
      ORDER BY o.iniciado_em DESC
      LIMIT 1`
  );
  if (!op) return res.json({ data: null });
  const leituras = await query(
    `SELECT l.id, l.bomba_id, l.iniciante, l.encerrante,
            b.codigo AS bomba_codigo, b.combustivel,
            (l.foto_iniciante IS NOT NULL) AS tem_foto_iniciante,
            (l.foto_encerrante IS NOT NULL) AS tem_foto_encerrante
       FROM leituras_bomba l
       JOIN bombas b ON b.id = l.bomba_id
      WHERE l.operacao_id = ?
      ORDER BY b.codigo`,
    [op.id]
  );
  return res.json({ data: { ...op, leituras } });
}

export default requireAuth(handler);
