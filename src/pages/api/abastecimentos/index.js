import { requireAuth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { methodNotAllowed, badRequest, parseDataUrl } from '@/lib/helpers';

export const config = {
  api: {
    bodyParser: { sizeLimit: '15mb' },
  },
};

async function handler(req, res) {
  if (req.method === 'GET') {
    const { from, to, veiculo_id } = req.query;
    const where = [];
    const params = [];
    if (from) { where.push('a.data_abastecimento >= ?'); params.push(from + ' 00:00:00'); }
    if (to) { where.push('a.data_abastecimento <= ?'); params.push(to + ' 23:59:59'); }
    if (veiculo_id) { where.push('a.veiculo_id = ?'); params.push(Number(veiculo_id)); }
    const sql = `
      SELECT a.id, a.data_abastecimento, a.odometro, a.qtd_diesel, a.qtd_arla32,
             a.observacao, a.created_at,
             v.prefixo, v.placa,
             b.codigo AS bomba_codigo,
             u.nome AS operador,
             (a.foto_odometro IS NOT NULL) AS tem_foto
      FROM abastecimentos a
      JOIN veiculos v ON v.id = a.veiculo_id
      LEFT JOIN bombas b ON b.id = a.bomba_id
      JOIN users u ON u.id = a.user_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY a.data_abastecimento DESC, a.id DESC
      LIMIT 500
    `;
    const rows = await query(sql, params);
    return res.json({ data: rows });
  }
  if (req.method === 'POST') {
    const operacao = await queryOne(
      'SELECT id FROM operacoes WHERE encerrado_em IS NULL ORDER BY iniciado_em DESC LIMIT 1'
    );
    if (!operacao) {
      return res.status(409).json({
        error: 'Nenhuma operacao aberta. Inicie o abastecimento do dia antes de registrar abastecimentos.',
        code: 'NO_OPEN_OPERATION',
      });
    }

    const {
      veiculo_id, bomba_id, data_abastecimento,
      odometro, qtd_diesel, qtd_arla32,
      foto_odometro, observacao,
    } = req.body || {};
    if (!veiculo_id) return badRequest(res, 'Veiculo obrigatorio');
    const veiculo = await queryOne('SELECT id, ativo FROM veiculos WHERE id = ?', [Number(veiculo_id)]);
    if (!veiculo) return badRequest(res, 'Veiculo nao encontrado');
    if (!veiculo.ativo) return badRequest(res, 'Veiculo inativo');
    if (odometro == null) return badRequest(res, 'Odometro obrigatorio');
    const od = Number(odometro);
    if (Number.isNaN(od) || od < 0) return badRequest(res, 'Odometro invalido');
    const diesel = Number(qtd_diesel || 0);
    const arla = Number(qtd_arla32 || 0);
    if (Number.isNaN(diesel) || Number.isNaN(arla) || diesel < 0 || arla < 0) {
      return badRequest(res, 'Quantidades invalidas');
    }
    if (diesel === 0 && arla === 0) return badRequest(res, 'Informe diesel e/ou arla32');
    const foto = parseDataUrl(foto_odometro);
    if (!foto) return badRequest(res, 'Foto do odometro obrigatoria');
    const data = data_abastecimento || new Date().toISOString().slice(0, 19).replace('T', ' ');
    const result = await query(
      `INSERT INTO abastecimentos
        (veiculo_id, bomba_id, user_id, operacao_id, data_abastecimento,
         odometro, qtd_diesel, qtd_arla32, foto_odometro, foto_odometro_mime, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(veiculo_id),
        bomba_id ? Number(bomba_id) : null,
        req.user.id,
        operacao.id,
        data,
        od,
        diesel,
        arla,
        foto.buffer,
        foto.mime,
        observacao || null,
      ]
    );
    return res.status(201).json({ id: result.insertId, operacao_id: operacao.id });
  }
  return methodNotAllowed(res, ['GET', 'POST']);
}

export default requireAuth(handler);
