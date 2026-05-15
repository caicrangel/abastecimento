import { createSession } from '@/lib/session';
import { queryOne } from '@/lib/db';
import { verifyPassword, ensureAdminUser } from '@/lib/auth';
import { methodNotAllowed, badRequest } from '@/lib/helpers';
import { log } from '@/lib/logger';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    await ensureAdminUser();
  } catch (err) {
    log.error('login: ensureAdminUser falhou:', err.message);
    return res.status(500).json({ error: 'Falha ao inicializar admin: ' + err.message });
  }
  const { username, password } = req.body || {};
  if (!username || !password) return badRequest(res, 'Usuário e senha são obrigatórios');
  let user;
  try {
    user = await queryOne(
      'SELECT id, username, password_hash, nome, role, ativo FROM users WHERE username = ?',
      [username]
    );
  } catch (err) {
    log.error('login: erro de BD:', err.message);
    return res.status(500).json({ error: 'Erro de banco de dados' });
  }
  if (!user) {
    log.warn(`login: usuario nao encontrado: ${username}`);
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  if (!user.ativo) {
    log.warn(`login: usuario inativo: ${username}`);
    return res.status(401).json({ error: 'Usuário inativo' });
  }
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    log.warn(`login: senha incorreta para ${username}`);
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  try {
    createSession(res, user);
  } catch (err) {
    log.error('login: createSession falhou:', err.message);
    return res.status(500).json({ error: 'Falha ao criar sessão: ' + err.message });
  }
  log.info(`login OK: ${user.username} (${user.role})`);
  return res.json({
    user: { id: user.id, username: user.username, nome: user.nome, role: user.role },
  });
}
