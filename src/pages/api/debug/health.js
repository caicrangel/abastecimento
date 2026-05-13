import { query } from '@/lib/db';

export default async function handler(req, res) {
  const out = {
    app: 'ok',
    env: process.env.NODE_ENV || 'unknown',
    cookieSecure: String(process.env.COOKIE_SECURE || '').toLowerCase() === 'true',
    sessionSecretLength: (process.env.SESSION_SECRET || '').length,
    db: 'unknown',
    dbError: null,
    userCount: null,
    veiculoCount: null,
    bombaCount: null,
    timestamp: new Date().toISOString(),
  };
  try {
    const u = await query('SELECT COUNT(*) AS c FROM users');
    const v = await query('SELECT COUNT(*) AS c FROM veiculos');
    const b = await query('SELECT COUNT(*) AS c FROM bombas');
    out.db = 'ok';
    out.userCount = u[0].c;
    out.veiculoCount = v[0].c;
    out.bombaCount = b[0].c;
  } catch (err) {
    out.db = 'error';
    out.dbError = err.message;
  }
  return res.json(out);
}
