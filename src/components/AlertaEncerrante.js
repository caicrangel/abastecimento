import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const POLL_MS = 60 * 1000;
const NOTIFY_MS = 20 * 60 * 1000;

export default function AlertaEncerrante() {
  const [abertas, setAbertas] = useState([]);
  const ultimaNotifRef = useRef(0);

  useEffect(() => {
    let ativo = true;

    if (typeof window !== 'undefined' && 'Notification' in window
        && Notification.permission === 'default') {
      try { Notification.requestPermission(); } catch (e) {}
    }

    async function check() {
      try {
        const r = await fetch('/api/leituras-bomba/abertas', { credentials: 'same-origin' });
        if (!r.ok) return;
        const d = await r.json();
        if (!ativo) return;
        setAbertas(d.data || []);
        if ((d.data || []).length > 0) {
          const agora = Date.now();
          if (agora - ultimaNotifRef.current >= NOTIFY_MS) {
            ultimaNotifRef.current = agora;
            disparaAlerta(d.data);
          }
        }
      } catch (e) {}
    }

    check();
    const i = setInterval(check, POLL_MS);
    return () => { ativo = false; clearInterval(i); };
  }, []);

  function disparaAlerta(lista) {
    const n = lista.length;
    const msg = n === 1
      ? `Há 1 bomba com encerrante pendente: ${lista[0].bomba_codigo}`
      : `Há ${n} bombas com encerrante pendente`;
    if (typeof window !== 'undefined' && 'Notification' in window
        && Notification.permission === 'granted') {
      try {
        new Notification('Abastecimento - lembrete', {
          body: msg + '. Feche as leituras antes do fim do expediente.',
          tag: 'encerrante-pendente',
          renotify: true,
        });
      } catch (e) {}
    }
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.value = 0.05;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      setTimeout(() => { osc.stop(); ctx.close(); }, 250);
    } catch (e) {}
  }

  if (abertas.length === 0) return null;

  return (
    <div style={{
      background: 'var(--alerta-bg)', color: 'var(--alerta-fg)',
      borderBottom: '1px solid var(--alerta-border)',
      padding: '8px 16px', fontSize: 14,
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    }}>
      <strong>Atenção:</strong>
      <span>
        {abertas.length === 1
          ? `1 bomba com encerrante pendente: ${abertas[0].bomba_codigo} (${abertas[0].minutos_aberta}min)`
          : `${abertas.length} bombas com encerrante pendente`}
      </span>
      <Link href="/bombas?status=aberta" className="btn" style={{ padding: '3px 10px', fontSize: 13 }}>
        Ver leituras abertas
      </Link>
    </div>
  );
}
