import QRCode from 'qrcode';
import { requireAuth } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { methodNotAllowed, badRequest } from '@/lib/helpers';

async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const id = Number(req.query.id);
  if (!id) return badRequest(res, 'ID invalido');
  const row = await queryOne(
    'SELECT prefixo, qr_token FROM veiculos WHERE id = ?',
    [id]
  );
  if (!row) return res.status(404).json({ error: 'Nao encontrado' });
  const png = await QRCode.toBuffer(row.qr_token, {
    type: 'png',
    errorCorrectionLevel: 'M',
    width: 512,
    margin: 1,
  });
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.setHeader('Content-Disposition', `inline; filename="veiculo-${row.prefixo}.png"`);
  return res.status(200).send(png);
}

export default requireAuth(handler);
