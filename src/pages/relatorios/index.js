import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { formatDate, formatDateTime, formatNumber, formatInt } from '@/lib/format';

const HOJE = new Date().toISOString().slice(0, 10);

function Card({ titulo, valor, sufixo, cor }) {
  return (
    <div className="card" style={{ flex: '1 1 180px', minWidth: 0, margin: 0 }}>
      <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase' }}>{titulo}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: cor || 'var(--text)', marginTop: 4 }}>
        {valor}{sufixo ? <span style={{ fontSize: 14, marginLeft: 4 }}>{sufixo}</span> : null}
      </div>
    </div>
  );
}

export default function Relatorios() {
  const [from, setFrom] = useState(HOJE);
  const [to, setTo] = useState(HOJE);
  const [dias, setDias] = useState(7);
  const [resumo, setResumo] = useState(null);
  const [consumoVeiculo, setConsumoVeiculo] = useState([]);
  const [semAbastecer, setSemAbastecer] = useState([]);
  const [consumoDiario, setConsumoDiario] = useState([]);
  const [conferencia, setConferencia] = useState([]);

  async function carregar() {
    const qs = `from=${from}&to=${to}`;
    const [r1, r2, r3, r4, r5] = await Promise.all([
      fetch(`/api/relatorios/resumo?${qs}`).then((r) => r.json()),
      fetch(`/api/relatorios/consumo-veiculo?${qs}`).then((r) => r.json()),
      fetch(`/api/relatorios/veiculos-sem-abastecer?dias=${dias}`).then((r) => r.json()),
      fetch(`/api/relatorios/consumo-diario?dias=30`).then((r) => r.json()),
      fetch(`/api/relatorios/conferencia-bombas?${qs}`).then((r) => r.json()),
    ]);
    setResumo(r1);
    setConsumoVeiculo(r2.data || []);
    setSemAbastecer(r3.data || []);
    setConsumoDiario(r4.data || []);
    setConferencia(r5.data || []);
  }

  useEffect(() => { carregar(); /* eslint-disable-next-line */ }, []);

  return (
    <Layout>
      <div className="card">
        <h1 style={{ margin: 0 }}>Relatorios</h1>
      </div>

      <div className="card">
        <div className="row">
          <div className="col">
            <label>De</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="col">
            <label>Ate</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="col">
            <label>Veiculos sem abastecer ha N dias</label>
            <input type="number" min="1" value={dias} onChange={(e) => setDias(Number(e.target.value) || 1)} />
          </div>
          <div className="col" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn primary" onClick={carregar} style={{ width: '100%' }}>Atualizar</button>
          </div>
        </div>
      </div>

      {resumo && (
        <>
          <h2 style={{ marginTop: 8 }}>Resumo do periodo ({formatDate(from)} a {formatDate(to)})</h2>
          <div className="row" style={{ marginBottom: 16 }}>
            <Card titulo="Abastecimentos" valor={formatInt(resumo.abastecimentos.total)} />
            <Card titulo="Diesel abastecido" valor={formatNumber(resumo.abastecimentos.diesel)} sufixo="L" cor="#0969da" />
            <Card titulo="Arla32 abastecido" valor={formatNumber(resumo.abastecimentos.arla32)} sufixo="L" cor="#1a7f37" />
            <Card titulo="Veiculos atendidos" valor={`${resumo.abastecimentos.veiculos_atendidos}/${resumo.veiculos.ativos}`} />
          </div>
          <div className="row" style={{ marginBottom: 16 }}>
            <Card titulo="Leituras de bomba" valor={formatInt(resumo.bombas.leituras)} />
            <Card titulo="Leituras abertas" valor={formatInt(resumo.bombas.abertas)} cor={resumo.bombas.abertas > 0 ? '#bf8700' : undefined} />
            <Card titulo="Volume registrado (bombas)" valor={formatNumber(resumo.bombas.volume)} sufixo="L" />
            <Card titulo="Veiculos sem abastecer" valor={formatInt(resumo.veiculos.nao_atendidos)} cor={resumo.veiculos.nao_atendidos > 0 ? '#bf8700' : undefined} />
          </div>
        </>
      )}

      <div className="card">
        <h2>Consumo por veiculo (km/L)</h2>
        {consumoVeiculo.length === 0 ? (
          <p className="muted">Sem dados no periodo.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Prefixo</th>
                  <th>Placa</th>
                  <th>Abastecimentos</th>
                  <th>Diesel (L)</th>
                  <th>Arla32 (L)</th>
                  <th>Km rodado</th>
                  <th>Km/L</th>
                  <th>Ultimo</th>
                </tr>
              </thead>
              <tbody>
                {consumoVeiculo.map((v) => {
                  const km = v.odometro_final && v.odometro_inicial
                    ? Number(v.odometro_final) - Number(v.odometro_inicial) : null;
                  return (
                    <tr key={v.veiculo_id}>
                      <td><strong>{v.prefixo}</strong></td>
                      <td>{v.placa || '-'}</td>
                      <td>{formatInt(v.qtd_abastecimentos)}</td>
                      <td>{formatNumber(v.total_diesel)}</td>
                      <td>{formatNumber(v.total_arla32)}</td>
                      <td>{km != null ? formatInt(km) : '-'}</td>
                      <td>
                        {v.km_por_litro != null
                          ? <strong>{formatNumber(v.km_por_litro)}</strong>
                          : <span className="muted">-</span>}
                      </td>
                      <td>{v.ultimo_abastecimento ? formatDateTime(v.ultimo_abastecimento) : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Veiculos sem abastecer ha {dias} dia(s) ou mais</h2>
        {semAbastecer.length === 0 ? (
          <p className="muted">Todos os veiculos ativos abasteceram recentemente.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Prefixo</th>
                  <th>Placa</th>
                  <th>Modelo</th>
                  <th>Ultimo abastecimento</th>
                  <th>Dias sem abastecer</th>
                </tr>
              </thead>
              <tbody>
                {semAbastecer.map((v) => (
                  <tr key={v.id}>
                    <td><strong>{v.prefixo}</strong></td>
                    <td>{v.placa || '-'}</td>
                    <td>{v.modelo || '-'}</td>
                    <td>{v.ultimo_abastecimento ? formatDateTime(v.ultimo_abastecimento) : <em className="muted">nunca</em>}</td>
                    <td>
                      {v.dias_sem_abastecer != null
                        ? <strong style={{ color: '#cf222e' }}>{v.dias_sem_abastecer}</strong>
                        : <em className="muted">-</em>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Consumo diario (ultimos 30 dias)</h2>
        {consumoDiario.length === 0 ? (
          <p className="muted">Sem dados.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Dia</th>
                  <th>Abastecimentos</th>
                  <th>Veiculos</th>
                  <th>Diesel (L)</th>
                  <th>Arla32 (L)</th>
                </tr>
              </thead>
              <tbody>
                {consumoDiario.map((d) => (
                  <tr key={d.dia}>
                    <td><strong>{formatDate(d.dia)}</strong></td>
                    <td>{formatInt(d.qtd_abastecimentos)}</td>
                    <td>{formatInt(d.veiculos)}</td>
                    <td>{formatNumber(d.diesel)}</td>
                    <td>{formatNumber(d.arla32)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Conferencia bombas x abastecimentos no periodo</h2>
        <p className="muted">Compara o volume registrado nas bombas (encerrante - iniciante) com o total abastecido nos veiculos pela mesma bomba.</p>
        {conferencia.length === 0 ? (
          <p className="muted">Sem dados.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Bomba</th>
                  <th>Combustivel</th>
                  <th>Volume bomba (L)</th>
                  <th>Volume abastecido (L)</th>
                  <th>Divergencia</th>
                  <th>Leituras abertas</th>
                </tr>
              </thead>
              <tbody>
                {conferencia.map((b) => (
                  <tr key={b.bomba_id}>
                    <td><strong>{b.codigo}</strong></td>
                    <td><span className={`tag ${b.combustivel}`}>{b.combustivel}</span></td>
                    <td>{formatNumber(b.volume_bomba)}</td>
                    <td>{formatNumber(b.volume_abastecido)}</td>
                    <td>
                      <strong style={{ color: Math.abs(b.divergencia) > 1 ? '#cf222e' : '#1a7f37' }}>
                        {b.divergencia > 0 ? '+' : ''}{formatNumber(b.divergencia)}
                      </strong>
                    </td>
                    <td>
                      {b.leituras_abertas > 0
                        ? <span className="tag inativo">{b.leituras_abertas}</span>
                        : '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
