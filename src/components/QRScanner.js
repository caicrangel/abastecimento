import { useEffect, useRef, useState } from 'react';

export default function QRScanner({ onScan, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const stoppedRef = useRef(false);
  const [erro, setErro] = useState('');
  const [manual, setManual] = useState('');
  const [suporta, setSuporta] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('BarcodeDetector' in window)) {
      setSuporta(false);
      return;
    }
    iniciar();
    return parar;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function iniciar() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const loop = async () => {
        if (stoppedRef.current || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes && codes.length > 0) {
            const value = codes[0].rawValue;
            parar();
            onScan(value);
            return;
          }
        } catch (e) {}
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      setErro('Nao foi possivel acessar a camera: ' + err.message);
      setSuporta(false);
    }
  }

  function parar() {
    stoppedRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  function submitManual(e) {
    e.preventDefault();
    if (manual.trim()) {
      parar();
      onScan(manual.trim());
    }
  }

  return (
    <div>
      {suporta ? (
        <>
          <div className="scanner-box">
            <video ref={videoRef} playsInline muted />
          </div>
          <p className="muted" style={{ textAlign: 'center', marginTop: 8 }}>
            Aponte a camera para o QRCode do veiculo
          </p>
        </>
      ) : (
        <div className="msg info">
          Camera nao disponivel ou seu navegador nao suporta leitor de QR. Digite o codigo manualmente abaixo.
        </div>
      )}
      {erro && <div className="msg error">{erro}</div>}
      <form onSubmit={submitManual} style={{ marginTop: 12 }}>
        <label>Codigo manual (token do veiculo)</label>
        <input
          type="text"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Cole ou digite o token"
        />
        <div className="btn-group" style={{ marginTop: 10 }}>
          <button type="submit" className="btn primary">Confirmar codigo</button>
          {onCancel && (
            <button type="button" className="btn" onClick={() => { parar(); onCancel(); }}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
