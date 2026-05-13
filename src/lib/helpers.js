import crypto from 'crypto';

export function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

export function parseDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mime: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

export function bufferToDataUrl(buffer, mime) {
  if (!buffer || !mime) return null;
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

export function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  return res.status(405).json({ error: 'Metodo nao permitido' });
}

export function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

export function formatDate(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR');
}
