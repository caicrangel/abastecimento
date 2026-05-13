import { destroySession } from '@/lib/session';
import { methodNotAllowed } from '@/lib/helpers';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  destroySession(res);
  return res.json({ ok: true });
}
