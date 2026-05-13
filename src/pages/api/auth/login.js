import { getSession } from '@/lib/session';
import { queryOne } from '@/lib/db';
import { verifyPassword, ensureAdminUser } from '@/lib/auth';
import { methodNotAllowed, badRequest } from '@/lib/helpers';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  await ensureAdminUser();
  const { username, password } = req.body || {};
  if (!username || !password) return badRequest(res, 'Usuario e senha sao obrigatorios');
  const user = await queryOne(
    'SELECT id, username, password_hash, nome, role, ativo FROM users WHERE username = ?',
    [username]
  );
  if (!user || !user.ativo) return res.status(401).json({ error: 'Credenciais invalidas' });
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Credenciais invalidas' });
  const session = await getSession(req, res);
  session.user = { id: user.id, username: user.username, nome: user.nome, role: user.role };
  await session.save();
  return res.json({ user: session.user });
}
