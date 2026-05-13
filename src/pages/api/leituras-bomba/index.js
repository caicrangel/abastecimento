import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { methodNotAllowed, badRequest, parseDataUrl } from '@/lib/helpers';

export const config = {
  api: {
    bodyParser: { sizeLimit: '15mb' },
  },
};

async function handler(req, res) {
  if (req.method === 'GET') {
    const { from, to, bomba_id, status } = req.query;
    const where = [];
    const params = [];
    if (from) { where.push('l.data_leitura >= ?'); params.push(from); }
    if (to) { where.push('l.data_leitura <= ?'); params.push(to); }
    if (bomba_id) { where.push('l.bomba_id = ?'); params.push(Number(bomba_id)); }
    if (status === 'aberta') where.push('l.encerrante IS NULL');
    if (status === 'fechada') where.push('l.encerrante IS NOT NULL');
    const sql = `
      SELECT l.id, l.data_leitura, l.data_inicio, l.data_encerramento,
             l.iniciante, l.encerrante,
             CASE WHEN l.encerrante IS NULL THEN NULL
                  ELSE (l.encerrante - l.iniciante) END AS consumo,
             l.observacao, l.created_at,
             b.codigo AS bomba_codigo, b.combustivel,
             u.nome AS operador,
             ue.nome AS operador_encerramento,
             (l.foto_iniciante IS NOT NULL) AS tem_foto_iniciante,
             (l.foto_encerrante IS NOT NULL) AS tem_foto_encerrante,
             (l.encerrante IS NULL) AS aberta
      FROM leituras_bomba l
      JOIN bombas b ON b.id = l.bomba_id
      JOIN users u ON u.id = l.user_id
      LEFT JOIN users ue ON ue.id = l.user_encerramento_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY l.data_leitura DESC, l.id DESC
      LIMIT 500
    `;
    const rows = await query(sql, params);
    return res.json({ data: rows });
  }
  if (req.method === 'POST') {
    const {
      bomba_id, data_leitura, iniciante,
      foto_iniciante, observacao,
    } = req.body || {};
    if (!bomba_id || !data_leitura) return badRequest(res, 'Bomba e data sao obrigatorios');
    if (iniciante == null || iniciante === '') return badRequest(res, 'Iniciante obrigatorio');
    const ini = Number(iniciante);
    if (Number.isNaN(ini) || ini < 0) return badRequest(res, 'Iniciante invalido');
    const fotoIni = parseDataUrl(foto_iniciante);
    if (!fotoIni) return badRequest(res, 'Foto do iniciante obrigatoria');
    const result = await query(
      `INSERT INTO leituras_bomba
        (bomba_id, user_id, data_leitura, data_inicio, iniciante,
         foto_iniciante, foto_iniciante_mime, observacao)
       VALUES (?, ?, ?, NOW(), ?, ?, ?, ?)`,
      [
        Number(bomba_id), req.user.id, data_leitura, ini,
        fotoIni.buffer, fotoIni.mime,
        observacao || null,
      ]
    );
    return res.status(201).json({ id: result.insertId });
  }
  return methodNotAllowed(res, ['GET', 'POST']);
}

export default requireAuth(handler);
