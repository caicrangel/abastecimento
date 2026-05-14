import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { IconCamera, IconImage, IconKeyboard, IconLock, IconStop } from './Icons';

export default function QRScanner({ onScan, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const stoppedRef = useRef(false);
  const fileRef = useRef(null);
  const [erro, setErro] = useState('');
  const [info, setInfo] = useState('');
  const [manual, setManual] = useState('');
  const [scanning, setScanning] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [secureContext, setSecureContext] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seguro =
      window.isSecureContext ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.localhost');
    setSecureContext(seguro);
    return () => parar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function parar() {
    stoppedRef.current = true;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
    setIniciando(false);
  }

  async function iniciarCamera() {
    setErro(''); setInfo('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setErro('Camera ao vivo nao disponivel neste contexto. Use "Tirar foto" abaixo, que abre a camera do celular e funciona em qualquer rede.');
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
      if (!video) { stream.getTracks().forEach((t) => t.stop()); return; }
      video.srcObject = stream;
      await video.play();
      setScanning(true);
      setIniciando(false);
      iniciarLoop();
    } catch (err) {
      setIniciando(false);
      const nome = err?.name || '';
      let msg = err?.message || 'erro desconhecido';
      if (nome === 'NotAllowedError') {
        msg = 'Permissao da camera negada. Em HTTP, navegadores bloqueiam a camera por seguranca. Use "Tirar foto" abaixo (funciona em HTTP) ou habilite HTTPS no servidor.';
      } else if (nome === 'NotFoundError') {
        msg = 'Nenhuma camera encontrada neste dispositivo.';
      } else if (nome === 'NotReadableError') {
        msg = 'Camera em uso por outro aplicativo.';
      } else if (nome === 'SecurityError' || /secure/i.test(msg)) {
        msg = 'Camera ao vivo so funciona em HTTPS. Use "Tirar foto" abaixo, que abre a camera nativa do celular sem essa restricao.';
      }
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

  function abrirFoto() {
    if (fileRef.current) fileRef.current.click();
  }

  function handleFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro(''); setInfo('Decodificando QRCode da foto...');
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
      setInfo('');
      if (code && code.data) {
        onScan(code.data);
      } else {
        setErro('Nao foi possivel ler o QRCode nessa foto. Tente novamente com mais luz, mais foco, ou digite o codigo manualmente.');
      }
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => { setInfo(''); setErro('Falha ao carregar a imagem'); };
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
      {!secureContext && !scanning && (
        <div className="msg info" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconLock />
          <span>
            Conexao HTTP detectada. A camera ao vivo so funciona em HTTPS (localhost ou certificado).
            <strong> Use "Tirar foto"</strong> abaixo - abre a camera nativa do celular e funciona normalmente.
          </span>
        </div>
      )}

      {!scanning && (
        <div className="btn-group" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          {secureContext && (
            <button
              type="button"
              className="btn primary"
              onClick={iniciarCamera}
              disabled={iniciando}
              style={{ justifyContent: 'center', padding: '10px 14px' }}
            >
              <IconCamera />
              <span>{iniciando ? 'Abrindo camera...' : 'Ler QRCode com a camera'}</span>
            </button>
          )}
          <button
            type="button"
            className={secureContext ? 'btn' : 'btn primary'}
            onClick={abrirFoto}
            style={{ justifyContent: 'center', padding: '10px 14px' }}
          >
            <IconImage />
            <span>Tirar foto do QRCode</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFoto}
            style={{ display: 'none' }}
          />
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
            <button type="button" className="btn" onClick={parar}>
              <IconStop /> <span>Parar camera</span>
            </button>
          </div>
        </>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {erro && <div className="msg error" style={{ marginTop: 12 }}>{erro}</div>}
      {info && <div className="msg info" style={{ marginTop: 12 }}>{info}</div>}

      <details style={{ marginTop: 16 }}>
        <summary style={{
          cursor: 'pointer', padding: '8px 10px', borderRadius: 6,
          background: 'var(--surface-elevated)', display: 'inline-flex',
          alignItems: 'center', gap: 6, fontSize: 13,
        }}>
          <IconKeyboard size={14} /> <span>Digitar codigo manualmente</span>
        </summary>
        <form onSubmit={submitManual} style={{ marginTop: 10 }}>
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
      </details>
    </div>
  );
}
