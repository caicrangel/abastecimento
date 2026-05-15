import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { methodNotAllowed } from '@/lib/helpers';

async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const from = req.query.from || new Date().toISOString().slice(0, 10);
  const to = req.query.to || from;

  const operacoes = await query(
    `SELECT o.id, o.data, o.iniciado_em, o.encerrado_em,
            TIMESTAMPDIFF(MINUTE, o.iniciado_em, o.encerrado_em) AS duracao_min,
            ui.nome AS iniciado_por_nome,
            ue.nome AS encerrado_por_nome
       FROM operacoes o
       JOIN users ui ON ui.id = o.iniciado_por
  LEFT JOIN users ue ON ue.id = o.encerrado_por
      WHERE o.encerrado_em IS NOT NULL
        AND o.data BETWEEN ? AND ?
      ORDER BY o.iniciado_em DESC
      LIMIT 200`,
    [from, to]
  );

  if (operacoes.length === 0) {
    return res.json({ data: [], from, to });
  }

  const ids = operacoes.map((o) => o.id);
  const placeholders = ids.map(() => '?').join(',');

  const leituras = await query(
    `SELECT l.operacao_id, l.bomba_id, l.iniciante, l.encerrante,
            (l.encerrante - l.iniciante) AS volume_bomba,
            b.codigo AS bomba_codigo, b.combustivel
       FROM leituras_bomba l
       JOIN bombas b ON b.id = l.bomba_id
      WHERE l.operacao_id IN (${placeholders})
        AND l.encerrante IS NOT NULL
      ORDER BY b.codigo`,
    ids
  );

  const abastecimentos = await query(
    `SELECT a.operacao_id, a.bomba_id, b.combustivel,
            SUM(a.qtd_diesel) AS diesel,
            SUM(a.qtd_arla32) AS arla32
       FROM abastecimentos a
  LEFT JOIN bombas b ON b.id = a.bomba_id
      WHERE a.operacao_id IN (${placeholders})
      GROUP BY a.operacao_id, a.bomba_id, b.combustivel`,
    ids
  );

  const abastSemBomba = await query(
    `SELECT a.operacao_id,
            SUM(a.qtd_diesel) AS diesel,
            SUM(a.qtd_arla32) AS arla32
       FROM abastecimentos a
      WHERE a.operacao_id IN (${placeholders})
        AND a.bomba_id IS NULL
      GROUP BY a.operacao_id`,
    ids
  );

  const abastMap = new Map();
  for (const a of abastecimentos) {
    const key = `${a.operacao_id}-${a.bomba_id || 'null'}`;
    abastMap.set(key, a);
  }

  const semBombaMap = new Map();
  for (const a of abastSemBomba) semBombaMap.set(a.operacao_id, a);

  const data = operacoes.map((op) => {
    const leiturasOp = leituras.filter((l) => l.operacao_id === op.id);
    const bombasInfo = leiturasOp.map((l) => {
      const a = abastMap.get(`${op.id}-${l.bomba_id}`);
      const volAbast = a
        ? Number(l.combustivel === 'diesel' ? a.diesel : a.arla32)
        : 0;
      const volBomba = Number(l.volume_bomba);
      return {
        bomba_id: l.bomba_id,
        bomba_codigo: l.bomba_codigo,
        combustivel: l.combustivel,
        iniciante: Number(l.iniciante),
        encerrante: Number(l.encerrante),
        volume_bomba: volBomba,
        volume_abastecido: volAbast,
        divergencia: volBomba - volAbast,
      };
    });
    const semBomba = semBombaMap.get(op.id);
    const totVolBomba = bombasInfo.reduce((s, b) => s + b.volume_bomba, 0);
    const totVolAbast = bombasInfo.reduce((s, b) => s + b.volume_abastecido, 0);
    return {
      operacao_id: op.id,
      data: op.data,
      iniciado_em: op.iniciado_em,
      encerrado_em: op.encerrado_em,
      duracao_min: Number(op.duracao_min),
      iniciado_por_nome: op.iniciado_por_nome,
      encerrado_por_nome: op.encerrado_por_nome,
      bombas: bombasInfo,
      abastecimento_sem_bomba: semBomba ? {
        diesel: Number(semBomba.diesel),
        arla32: Number(semBomba.arla32),
      } : null,
      totais: {
        volume_bomba: totVolBomba,
        volume_abastecido: totVolAbast,
        divergencia: totVolBomba - totVolAbast,
      },
    };
  });

  return res.json({ data, from, to });
}

export default requireAuth(handler);
