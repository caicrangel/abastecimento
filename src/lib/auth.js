import bcrypt from 'bcryptjs';
import { readSession } from './session';
import { query, queryOne } from './db';
import { log } from './logger';

let ensuringAdminPromise = null;

export async function ensureAdminUser() {
  if (!ensuringAdminPromise) {
    ensuringAdminPromise = (async () => {
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
        log.info(`admin '${username}' criado com sucesso`);
      }
    })();
    try {
      await ensuringAdminPromise;
    } catch (err) {
      ensuringAdminPromise = null;
      throw err;
    }
  }
  return ensuringAdminPromise;
}

export async function getCurrentUser(req) {
  const payload = readSession(req);
  if (!payload || !payload.id) return null;
  const user = await queryOne(
    'SELECT id, username, nome, role, ativo FROM users WHERE id = ?',
    [payload.id]
  );
  if (!user || !user.ativo) return null;
  return user;
}

export function requireAuth(handler, opts = {}) {
  return async function (req, res) {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Nao autenticado' });
      }
      if (opts.role && user.role !== opts.role) {
        return res.status(403).json({ error: 'Sem permissao' });
      }
      req.user = user;
      return handler(req, res);
    } catch (err) {
      log.error('requireAuth:', err.message);
      return res.status(500).json({ error: 'Erro interno' });
    }
  };
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}
