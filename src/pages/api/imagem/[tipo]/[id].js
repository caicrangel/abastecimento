import { requireAuth } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { methodNotAllowed, badRequest } from '@/lib/helpers';

const MAPS = {
  'abastecimento-odometro': {
    sql: 'SELECT foto_odometro AS foto, foto_odometro_mime AS mime FROM abastecimentos WHERE id = ?',
  },
  'bomba-iniciante': {
    sql: 'SELECT foto_iniciante AS foto, foto_iniciante_mime AS mime FROM leituras_bomba WHERE id = ?',
  },
  'bomba-encerrante': {
    sql: 'SELECT foto_encerrante AS foto, foto_encerrante_mime AS mime FROM leituras_bomba WHERE id = ?',
  },
};

async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const tipo = String(req.query.tipo || '');
  const id = Number(req.query.id);
  if (!MAPS[tipo]) return badRequest(res, 'Tipo invalido');
  if (!id) return badRequest(res, 'ID invalido');
  const row = await queryOne(MAPS[tipo].sql, [id]);
  if (!row || !row.foto) return res.status(404).json({ error: 'Imagem nao encontrada' });
  res.setHeader('Content-Type', row.mime || 'image/jpeg');
  res.setHeader('Cache-Control', 'private, max-age=300');
  return res.status(200).send(row.foto);
}

export default requireAuth(handler);
