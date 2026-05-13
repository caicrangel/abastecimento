import { getCurrentUser } from '@/lib/auth';
import { log } from '@/lib/logger';

export default async function handler(req, res) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ user: null });
    return res.json({ user });
  } catch (err) {
    log.error('me: erro:', err.message);
    return res.status(500).json({ user: null, error: 'Erro interno' });
  }
}
