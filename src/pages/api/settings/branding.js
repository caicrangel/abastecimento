import { requireAuth, initApp } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { methodNotAllowed, badRequest, parseDataUrl } from '@/lib/helpers';

export const config = {
  api: {
    bodyParser: { sizeLimit: '5mb' },
  },
};

async function getHandler(req, res) {
  try {
    await initApp();
  } catch (err) {
    return res.status(500).json({ error: 'Falha de inicializacao' });
  }
  const nome = await queryOne(
    'SELECT valor_texto FROM settings WHERE chave = ?',
    ['nome_sistema']
  );
  const light = await queryOne(
    'SELECT (valor_blob IS NOT NULL) AS tem, updated_at FROM settings WHERE chave = ?',
    ['logo_light']
  );
  const dark = await queryOne(
    'SELECT (valor_blob IS NOT NULL) AS tem, updated_at FROM settings WHERE chave = ?',
    ['logo_dark']
  );
  return res.json({
    nome_sistema: nome?.valor_texto || 'Abastecimento',
    tem_logo_light: !!(light && Number(light.tem) === 1),
    tem_logo_dark: !!(dark && Number(dark.tem) === 1),
    logo_light_updated_at: light?.updated_at || null,
    logo_dark_updated_at: dark?.updated_at || null,
  });
}

const putAuth = requireAuth(async function putHandler(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Sem permissao' });
  const {
    nome_sistema,
    logo_light, logo_dark,
    remover_logo_light, remover_logo_dark,
  } = req.body || {};
  if (typeof nome_sistema === 'string') {
    const valor = nome_sistema.trim().slice(0, 80) || 'Abastecimento';
    await query(
      `INSERT INTO settings (chave, valor_texto) VALUES ('nome_sistema', ?)
       ON DUPLICATE KEY UPDATE valor_texto = VALUES(valor_texto)`,
      [valor]
    );
  }
  async function upsertLogo(chave, dataUrl) {
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) throw new Error('Logo invalido');
    if (!parsed.mime.startsWith('image/')) throw new Error('Logo deve ser imagem');
    await query(
      `INSERT INTO settings (chave, valor_blob, valor_mime) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE valor_blob = VALUES(valor_blob), valor_mime = VALUES(valor_mime)`,
      [chave, parsed.buffer, parsed.mime]
    );
  }
  try {
    if (remover_logo_light) await query("DELETE FROM settings WHERE chave = 'logo_light'");
    else if (logo_light) await upsertLogo('logo_light', logo_light);
    if (remover_logo_dark) await query("DELETE FROM settings WHERE chave = 'logo_dark'");
    else if (logo_dark) await upsertLogo('logo_dark', logo_dark);
  } catch (err) {
    return badRequest(res, err.message);
  }
  return res.json({ ok: true });
});

export default async function handler(req, res) {
  if (req.method === 'GET') return getHandler(req, res);
  if (req.method === 'PUT') return putAuth(req, res);
  return methodNotAllowed(res, ['GET', 'PUT']);
}
