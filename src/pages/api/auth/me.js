import { getCurrentUser } from '@/lib/auth';

export default async function handler(req, res) {
  const user = await getCurrentUser(req, res);
  if (!user) return res.status(401).json({ user: null });
  return res.json({ user });
}
