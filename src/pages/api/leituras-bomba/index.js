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
    const { from, to, bomba_id } = req.query;
    const where = [];
    const params = [];
    if (from) { where.push('l.data_leitura >= ?'); params.push(from); }
    if (to) { where.push('l.data_leitura <= ?'); params.push(to); }
    if (bomba_id) { where.push('l.bomba_id = ?'); params.push(Number(bomba_id)); }
    const sql = `
      SELECT l.id, l.data_leitura, l.iniciante, l.encerrante,
             (l.encerrante - l.iniciante) AS consumo,
             l.observacao, l.created_at,
             b.codigo AS bomba_codigo, b.combustivel,
             u.nome AS operador,
             (l.foto_iniciante IS NOT NULL) AS tem_foto_iniciante,
             (l.foto_encerrante IS NOT NULL) AS tem_foto_encerrante
      FROM leituras_bomba l
      JOIN bombas b ON b.id = l.bomba_id
      JOIN users u ON u.id = l.user_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY l.data_leitura DESC, l.id DESC
      LIMIT 500
    `;
    const rows = await query(sql, params);
    return res.json({ data: rows });
  }
  if (req.method === 'POST') {
    const {
      bomba_id, data_leitura, iniciante, encerrante,
      foto_iniciante, foto_encerrante, observacao,
    } = req.body || {};
    if (!bomba_id || !data_leitura) return badRequest(res, 'Bomba e data sao obrigatorios');
    if (iniciante == null || encerrante == null) {
      return badRequest(res, 'Iniciante e encerrante obrigatorios');
    }
    const ini = Number(iniciante);
    const enc = Number(encerrante);
    if (Number.isNaN(ini) || Number.isNaN(enc)) return badRequest(res, 'Valores numericos invalidos');
    if (enc < ini) return badRequest(res, 'Encerrante deve ser maior ou igual ao iniciante');
    const fotoIni = parseDataUrl(foto_iniciante);
    const fotoEnc = parseDataUrl(foto_encerrante);
    if (!fotoIni) return badRequest(res, 'Foto do iniciante obrigatoria');
    if (!fotoEnc) return badRequest(res, 'Foto do encerrante obrigatoria');
    const result = await query(
      `INSERT INTO leituras_bomba
        (bomba_id, user_id, data_leitura, iniciante, encerrante,
         foto_iniciante, foto_iniciante_mime, foto_encerrante, foto_encerrante_mime, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(bomba_id), req.user.id, data_leitura, ini, enc,
        fotoIni.buffer, fotoIni.mime,
        fotoEnc.buffer, fotoEnc.mime,
        observacao || null,
      ]
    );
    return res.status(201).json({ id: result.insertId });
  }
  return methodNotAllowed(res, ['GET', 'POST']);
}

export default requireAuth(handler);
