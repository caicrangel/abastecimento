import { getSession } from '@/lib/session';
import { methodNotAllowed } from '@/lib/helpers';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  const session = await getSession(req, res);
  session.destroy();
  return res.json({ ok: true });
}
