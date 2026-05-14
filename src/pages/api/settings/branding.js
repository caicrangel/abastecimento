import { requireAuth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { methodNotAllowed, badRequest, parseDataUrl } from '@/lib/helpers';

export const config = {
  api: {
    bodyParser: { sizeLimit: '5mb' },
  },
};

async function handler(req, res) {
  if (req.method === 'GET') {
    const nome = await queryOne(
      'SELECT valor_texto FROM settings WHERE chave = ?',
      ['nome_sistema']
    );
    const logoMeta = await queryOne(
      'SELECT (valor_blob IS NOT NULL) AS tem_logo, valor_mime, updated_at FROM settings WHERE chave = ?',
      ['logo']
    );
    return res.json({
      nome_sistema: nome?.valor_texto || 'Abastecimento',
      tem_logo: !!(logoMeta && Number(logoMeta.tem_logo) === 1),
      logo_updated_at: logoMeta?.updated_at || null,
    });
  }
  if (req.method === 'PUT') {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Sem permissao' });
    const { nome_sistema, logo, remover_logo } = req.body || {};
    if (typeof nome_sistema === 'string') {
      const valor = nome_sistema.trim().slice(0, 80) || 'Abastecimento';
      await query(
        `INSERT INTO settings (chave, valor_texto) VALUES ('nome_sistema', ?)
         ON DUPLICATE KEY UPDATE valor_texto = VALUES(valor_texto)`,
        [valor]
      );
    }
    if (remover_logo) {
      await query("DELETE FROM settings WHERE chave = 'logo'");
    } else if (logo) {
      const parsed = parseDataUrl(logo);
      if (!parsed) return badRequest(res, 'Logo invalido');
      if (!parsed.mime.startsWith('image/')) return badRequest(res, 'Logo deve ser imagem');
      await query(
        `INSERT INTO settings (chave, valor_blob, valor_mime) VALUES ('logo', ?, ?)
         ON DUPLICATE KEY UPDATE valor_blob = VALUES(valor_blob), valor_mime = VALUES(valor_mime)`,
        [parsed.buffer, parsed.mime]
      );
    }
    return res.json({ ok: true });
  }
  return methodNotAllowed(res, ['GET', 'PUT']);
}

export default requireAuth(handler);
