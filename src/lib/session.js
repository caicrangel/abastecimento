import jwt from 'jsonwebtoken';
import { parse, serialize } from 'cookie';
import { log } from './logger';

const COOKIE_NAME = 'abastecimento_session';
const COOKIE_MAX_AGE = 60 * 60 * 8;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('SESSION_SECRET ausente ou curto (minimo 16 caracteres)');
  }
  return secret;
}

function cookieIsSecure() {
  return String(process.env.COOKIE_SECURE || '').toLowerCase() === 'true';
}

export function createSession(res, user) {
  const payload = {
    id: user.id,
    username: user.username,
    nome: user.nome,
    role: user.role,
  };
  const token = jwt.sign(payload, getSecret(), { expiresIn: COOKIE_MAX_AGE });
  res.setHeader(
    'Set-Cookie',
    serialize(COOKIE_NAME, token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: cookieIsSecure(),
      maxAge: COOKIE_MAX_AGE,
    })
  );
  return payload;
}

export function destroySession(res) {
  res.setHeader(
    'Set-Cookie',
    serialize(COOKIE_NAME, '', {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: cookieIsSecure(),
      maxAge: 0,
    })
  );
}

export function readSession(req) {
  const header = req.headers?.cookie;
  if (!header) return null;
  let cookies;
  try {
    cookies = parse(header);
  } catch (err) {
    log.warn('readSession: cookie header invalido');
    return null;
  }
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, getSecret());
  } catch (err) {
    log.warn('readSession: token invalido', err.message);
    return null;
  }
}
