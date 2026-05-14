import { requireAuth } from '@/lib/auth';
import { getPool, query, queryOne } from '@/lib/db';
import { methodNotAllowed, badRequest, parseDataUrl } from '@/lib/helpers';
import { log } from '@/lib/logger';

export const config = {
  api: {
    bodyParser: { sizeLimit: '30mb' },
  },
};

async function handler(req, res) {
  if (req.method === 'GET') {
    const rows = await query(
      `SELECT o.id, o.data, o.iniciado_em, o.encerrado_em,
              TIMESTAMPDIFF(MINUTE, o.iniciado_em, COALESCE(o.encerrado_em, NOW())) AS duracao_min,
              ui.nome AS iniciado_por_nome,
              ue.nome AS encerrado_por_nome,
              (o.encerrado_em IS NULL) AS aberta,
              (SELECT COUNT(*) FROM abastecimentos a WHERE a.operacao_id = o.id) AS qtd_abastecimentos
         FROM operacoes o
         JOIN users ui ON ui.id = o.iniciado_por
    LEFT JOIN users ue ON ue.id = o.encerrado_por
        ORDER BY o.iniciado_em DESC
        LIMIT 200`
    );
    return res.json({ data: rows });
  }

  if (req.method === 'POST') {
    const { data, leituras, observacao } = req.body || {};
    if (!data) return badRequest(res, 'Data obrigatoria');
    if (!Array.isArray(leituras) || leituras.length === 0) {
      return badRequest(res, 'Informe a leitura inicial de cada bomba');
    }

    const aberta = await queryOne(
      'SELECT id FROM operacoes WHERE encerrado_em IS NULL LIMIT 1'
    );
    if (aberta) return badRequest(res, `Ja existe operacao aberta (id ${aberta.id}). Encerre antes de iniciar uma nova.`);

    const bombasAtivas = await query('SELECT id, codigo FROM bombas WHERE ativo = 1');
    const idsAtivos = new Set(bombasAtivas.map((b) => b.id));
    const idsRecebidos = new Set(leituras.map((l) => Number(l.bomba_id)));
    for (const b of bombasAtivas) {
      if (!idsRecebidos.has(b.id)) {
        return badRequest(res, `Falta iniciante da bomba ${b.codigo}`);
      }
    }

    const parsed = [];
    for (const l of leituras) {
      const bombaId = Number(l.bomba_id);
      if (!idsAtivos.has(bombaId)) return badRequest(res, `Bomba ${bombaId} inativa ou inexistente`);
      if (l.iniciante == null || l.iniciante === '') return badRequest(res, `Iniciante obrigatorio (bomba ${bombaId})`);
      const ini = Number(l.iniciante);
      if (Number.isNaN(ini) || ini < 0) return badRequest(res, `Iniciante invalido (bomba ${bombaId})`);
      const foto = parseDataUrl(l.foto_iniciante);
      if (!foto) return badRequest(res, `Foto do iniciante obrigatoria (bomba ${bombaId})`);
      parsed.push({ bombaId, ini, foto });
    }

    const conn = await getPool().getConnection();
    try {
      await conn.beginTransaction();
      const [opRes] = await conn.execute(
        `INSERT INTO operacoes (data, iniciado_em, iniciado_por, observacao)
         VALUES (?, NOW(), ?, ?)`,
        [data, req.user.id, observacao || null]
      );
      const operacaoId = opRes.insertId;
      for (const p of parsed) {
        await conn.execute(
          `INSERT INTO leituras_bomba
             (bomba_id, user_id, operacao_id, data_leitura, data_inicio, iniciante,
              foto_iniciante, foto_iniciante_mime)
           VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)`,
          [p.bombaId, req.user.id, operacaoId, data, p.ini, p.foto.buffer, p.foto.mime]
        );
      }
      await conn.commit();
      log.info(`operacao ${operacaoId} iniciada por ${req.user.username} (${parsed.length} bombas)`);
      return res.status(201).json({ id: operacaoId });
    } catch (err) {
      await conn.rollback();
      log.error('operacoes POST:', err.message);
      return res.status(500).json({ error: 'Falha ao iniciar operacao: ' + err.message });
    } finally {
      conn.release();
    }
  }

  return methodNotAllowed(res, ['GET', 'POST']);
}

export default requireAuth(handler);
