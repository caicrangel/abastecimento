import { getIronSession } from 'iron-session';

export const sessionOptions = {
  password: process.env.SESSION_SECRET || 'dev_secret_change_me_dev_secret_change_me',
  cookieName: 'abastecimento_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
  },
};

export async function getSession(req, res) {
  return getIronSession(req, res, sessionOptions);
}
