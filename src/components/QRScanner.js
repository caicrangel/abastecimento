import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

export default function QRScanner({ onScan, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const stoppedRef = useRef(false);
  const [erro, setErro] = useState('');
  const [manual, setManual] = useState('');
  const [scanning, setScanning] = useState(false);
  const [iniciando, setIniciando] = useState(false);

  function parar() {
    stoppedRef.current = true;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
    setIniciando(false);
  }

  useEffect(() => () => parar(), []);

  async function iniciarCamera() {
    setErro('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setErro('Este navegador nao suporta acesso a camera. Use "Tirar foto" ou digite o codigo.');
      return;
    }
    setIniciando(true);
    stoppedRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.srcObject = stream;
      await video.play();
      setScanning(true);
      setIniciando(false);
      iniciarLoop();
    } catch (err) {
      setIniciando(false);
      let msg = err.message || 'erro desconhecido';
      if (err.name === 'NotAllowedError') msg = 'Permissao negada. Libere o acesso a camera nas configuracoes do navegador.';
      else if (err.name === 'NotFoundError') msg = 'Nenhuma camera encontrada no dispositivo.';
      else if (err.name === 'NotReadableError') msg = 'Camera em uso por outro aplicativo.';
      setErro(msg);
    }
  }

  function iniciarLoop() {
    const tick = () => {
      if (stoppedRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (video.readyState >= video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(data.data, data.width, data.height, { inversionAttempts: 'dontInvert' });
        if (code && code.data) {
          parar();
          onScan(code.data);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  function handleFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro('');
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 1600;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxDim || h > maxDim) {
        if (w >= h) { h = Math.round((h * maxDim) / w); w = maxDim; }
        else { w = Math.round((w * maxDim) / h); h = maxDim; }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h);
      const code = jsQR(data.data, data.width, data.height);
      if (code && code.data) {
        onScan(code.data);
      } else {
        setErro('Nao foi possivel ler o QRCode nessa foto. Tente novamente com mais luz e foco, ou digite o codigo.');
      }
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => setErro('Falha ao carregar a imagem');
    img.src = URL.createObjectURL(file);
    e.target.value = '';
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
      {!scanning && (
        <div className="btn-group" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          <button
            type="button"
            className="btn primary"
            onClick={iniciarCamera}
            disabled={iniciando}
            style={{ justifyContent: 'center', padding: '12px 16px', fontSize: 16 }}
          >
            {iniciando ? 'Abrindo camera...' : 'Ler QRCode com a camera'}
          </button>
          <label className="btn" style={{ justifyContent: 'center', cursor: 'pointer', padding: '12px 16px', fontSize: 16 }}>
            Tirar foto do QRCode
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFoto}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}

      {scanning && (
        <>
          <div className="scanner-box">
            <video ref={videoRef} playsInline muted autoPlay />
          </div>
          <p className="muted" style={{ textAlign: 'center', marginTop: 8 }}>
            Aponte a camera para o QRCode
          </p>
          <div className="btn-group" style={{ justifyContent: 'center', marginTop: 8 }}>
            <button type="button" className="btn" onClick={parar}>Parar camera</button>
          </div>
        </>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {erro && <div className="msg error" style={{ marginTop: 12 }}>{erro}</div>}

      <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid var(--border)' }} />

      <form onSubmit={submitManual}>
        <label>Ou digite o codigo manualmente</label>
        <input
          type="text"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Cole ou digite o token"
        />
        <div className="btn-group" style={{ marginTop: 10 }}>
          <button type="submit" className="btn primary" disabled={!manual.trim()}>
            Confirmar codigo
          </button>
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
