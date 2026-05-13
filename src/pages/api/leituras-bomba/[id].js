import { requireAuth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { methodNotAllowed, badRequest, parseDataUrl } from '@/lib/helpers';

export const config = {
  api: {
    bodyParser: { sizeLimit: '15mb' },
  },
};

async function handler(req, res) {
  const id = Number(req.query.id);
  if (!id) return badRequest(res, 'ID invalido');

  if (req.method === 'GET') {
    const row = await queryOne(
      `SELECT l.id, l.bomba_id, l.data_leitura, l.data_inicio, l.data_encerramento,
              l.iniciante, l.encerrante, l.observacao,
              b.codigo AS bomba_codigo, b.combustivel,
              (l.foto_iniciante IS NOT NULL) AS tem_foto_iniciante,
              (l.foto_encerrante IS NOT NULL) AS tem_foto_encerrante,
              (l.encerrante IS NULL) AS aberta
       FROM leituras_bomba l JOIN bombas b ON b.id = l.bomba_id
       WHERE l.id = ?`,
      [id]
    );
    if (!row) return res.status(404).json({ error: 'Leitura nao encontrada' });
    return res.json({ data: row });
  }

  if (req.method === 'PUT') {
    const row = await queryOne(
      'SELECT id, iniciante, encerrante FROM leituras_bomba WHERE id = ?',
      [id]
    );
    if (!row) return res.status(404).json({ error: 'Leitura nao encontrada' });
    if (row.encerrante !== null) return badRequest(res, 'Esta leitura ja esta fechada');
    const { encerrante, foto_encerrante, observacao } = req.body || {};
    if (encerrante == null || encerrante === '') return badRequest(res, 'Encerrante obrigatorio');
    const enc = Number(encerrante);
    const ini = Number(row.iniciante);
    if (Number.isNaN(enc) || enc < 0) return badRequest(res, 'Encerrante invalido');
    if (enc < ini) return badRequest(res, `Encerrante (${enc}) deve ser maior ou igual ao iniciante (${ini})`);
    const foto = parseDataUrl(foto_encerrante);
    if (!foto) return badRequest(res, 'Foto do encerrante obrigatoria');
    await query(
      `UPDATE leituras_bomba
          SET encerrante = ?,
              foto_encerrante = ?,
              foto_encerrante_mime = ?,
              data_encerramento = NOW(),
              user_encerramento_id = ?,
              observacao = COALESCE(?, observacao)
        WHERE id = ?`,
      [enc, foto.buffer, foto.mime, req.user.id, observacao || null, id]
    );
    return res.json({ ok: true });
  }

  if (req.method === 'DELETE') {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Sem permissao' });
    await query('DELETE FROM leituras_bomba WHERE id = ?', [id]);
    return res.json({ ok: true });
  }

  return methodNotAllowed(res, ['GET', 'PUT', 'DELETE']);
}

export default requireAuth(handler);
