import { queryOne } from '@/lib/db';
import { initApp } from '@/lib/auth';
import { methodNotAllowed } from '@/lib/helpers';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try {
    await initApp();
  } catch (err) {
    return res.status(500).end();
  }
  const row = await queryOne(
    "SELECT valor_blob AS foto, valor_mime AS mime FROM settings WHERE chave = 'logo'"
  );
  if (!row || !row.foto) return res.status(404).end();
  res.setHeader('Content-Type', row.mime || 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=60');
  return res.status(200).send(row.foto);
}
