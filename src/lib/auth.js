import bcrypt from 'bcryptjs';
import { getSession } from './session';
import { query, queryOne } from './db';

let ensuringAdmin = null;

export async function ensureAdminUser() {
  if (ensuringAdmin) return ensuringAdmin;
  ensuringAdmin = (async () => {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const nome = process.env.ADMIN_NOME || 'Administrador';
    const existing = await queryOne('SELECT id FROM users WHERE username = ?', [username]);
    if (!existing) {
      const hash = await bcrypt.hash(password, 10);
      await query(
        'INSERT INTO users (username, password_hash, nome, role, ativo) VALUES (?, ?, ?, ?, 1)',
        [username, hash, nome, 'admin']
      );
    }
  })();
  try {
    await ensuringAdmin;
  } catch (err) {
    ensuringAdmin = null;
    throw err;
  }
}

export async function getCurrentUser(req, res) {
  const session = await getSession(req, res);
  if (!session.user) return null;
  const user = await queryOne(
    'SELECT id, username, nome, role, ativo FROM users WHERE id = ?',
    [session.user.id]
  );
  if (!user || !user.ativo) return null;
  return user;
}

export function requireAuth(handler, opts = {}) {
  return async function (req, res) {
    const user = await getCurrentUser(req, res);
    if (!user) {
      return res.status(401).json({ error: 'Nao autenticado' });
    }
    if (opts.role && user.role !== opts.role) {
      return res.status(403).json({ error: 'Sem permissao' });
    }
    req.user = user;
    return handler(req, res);
  };
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}
