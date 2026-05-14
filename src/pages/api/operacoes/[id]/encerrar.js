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
  if (req.method !== 'PUT' && req.method !== 'POST') return methodNotAllowed(res, ['PUT', 'POST']);
  const id = Number(req.query.id);
  if (!id) return badRequest(res, 'ID invalido');

  const op = await queryOne('SELECT id, encerrado_em FROM operacoes WHERE id = ?', [id]);
  if (!op) return res.status(404).json({ error: 'Operacao nao encontrada' });
  if (op.encerrado_em) return badRequest(res, 'Operacao ja encerrada');

  const { leituras, observacao } = req.body || {};
  if (!Array.isArray(leituras) || leituras.length === 0) {
    return badRequest(res, 'Informe o encerrante de cada bomba');
  }

  const leiturasOp = await query(
    'SELECT id, bomba_id, iniciante FROM leituras_bomba WHERE operacao_id = ?',
    [id]
  );
  const byId = new Map(leiturasOp.map((l) => [l.id, l]));

  const updates = [];
  for (const l of leituras) {
    const lid = Number(l.id);
    const orig = byId.get(lid);
    if (!orig) return badRequest(res, `Leitura ${lid} nao pertence a esta operacao`);
    if (l.encerrante == null || l.encerrante === '') return badRequest(res, `Encerrante obrigatorio (leitura ${lid})`);
    const enc = Number(l.encerrante);
    const ini = Number(orig.iniciante);
    if (Number.isNaN(enc) || enc < 0) return badRequest(res, `Encerrante invalido (leitura ${lid})`);
    if (enc < ini) return badRequest(res, `Encerrante (${enc}) deve ser >= iniciante (${ini}) na leitura ${lid}`);
    const foto = parseDataUrl(l.foto_encerrante);
    if (!foto) return badRequest(res, `Foto do encerrante obrigatoria (leitura ${lid})`);
    updates.push({ lid, enc, foto });
  }

  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    for (const u of updates) {
      await conn.execute(
        `UPDATE leituras_bomba
            SET encerrante = ?, foto_encerrante = ?, foto_encerrante_mime = ?,
                data_encerramento = NOW(), user_encerramento_id = ?
          WHERE id = ?`,
        [u.enc, u.foto.buffer, u.foto.mime, req.user.id, u.lid]
      );
    }
    await conn.execute(
      `UPDATE operacoes
          SET encerrado_em = NOW(), encerrado_por = ?,
              observacao = CONCAT_WS(' | ', observacao, ?)
        WHERE id = ?`,
      [req.user.id, observacao || null, id]
    );
    await conn.commit();
    log.info(`operacao ${id} encerrada por ${req.user.username}`);
    return res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    log.error('encerrar operacao:', err.message);
    return res.status(500).json({ error: 'Falha ao encerrar: ' + err.message });
  } finally {
    conn.release();
  }
}

export default requireAuth(handler);
