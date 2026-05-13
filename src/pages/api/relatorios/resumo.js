import { requireAuth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { methodNotAllowed } from '@/lib/helpers';

function range(req) {
  const today = new Date().toISOString().slice(0, 10);
  const from = req.query.from || today;
  const to = req.query.to || today;
  return { from, to };
}

async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const { from, to } = range(req);

  const abast = await queryOne(
    `SELECT COUNT(*) AS total_abastecimentos,
            COALESCE(SUM(qtd_diesel), 0) AS total_diesel,
            COALESCE(SUM(qtd_arla32), 0) AS total_arla32,
            COUNT(DISTINCT veiculo_id) AS veiculos_atendidos
       FROM abastecimentos
      WHERE DATE(data_abastecimento) BETWEEN ? AND ?`,
    [from, to]
  );

  const leituras = await queryOne(
    `SELECT COUNT(*) AS total_leituras,
            SUM(CASE WHEN encerrante IS NULL THEN 1 ELSE 0 END) AS leituras_abertas,
            COALESCE(SUM(CASE WHEN encerrante IS NOT NULL THEN encerrante - iniciante ELSE 0 END), 0) AS volume_bombas
       FROM leituras_bomba
      WHERE data_leitura BETWEEN ? AND ?`,
    [from, to]
  );

  const veiculosAtivos = await queryOne(
    'SELECT COUNT(*) AS c FROM veiculos WHERE ativo = 1'
  );

  return res.json({
    from, to,
    abastecimentos: {
      total: Number(abast.total_abastecimentos),
      diesel: Number(abast.total_diesel),
      arla32: Number(abast.total_arla32),
      veiculos_atendidos: Number(abast.veiculos_atendidos),
    },
    bombas: {
      leituras: Number(leituras.total_leituras),
      abertas: Number(leituras.leituras_abertas),
      volume: Number(leituras.volume_bombas),
    },
    veiculos: {
      ativos: Number(veiculosAtivos.c),
      nao_atendidos: Math.max(0, Number(veiculosAtivos.c) - Number(abast.veiculos_atendidos)),
    },
  });
}

export default requireAuth(handler);
