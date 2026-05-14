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
  const variant = req.query.theme === 'dark' ? 'dark' : 'light';
  const chave = variant === 'dark' ? 'logo_dark' : 'logo_light';
  let row = await queryOne(
    'SELECT valor_blob AS foto, valor_mime AS mime FROM settings WHERE chave = ?',
    [chave]
  );
  if (!row || !row.foto) {
    const fallback = variant === 'dark' ? 'logo_light' : 'logo_dark';
    row = await queryOne(
      'SELECT valor_blob AS foto, valor_mime AS mime FROM settings WHERE chave = ?',
      [fallback]
    );
  }
  if (!row || !row.foto) return res.status(404).end();
  res.setHeader('Content-Type', row.mime || 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=60');
  return res.status(200).send(row.foto);
}
