import { useEffect, useState } from 'react';

function fileToDataUrl(file, maxDim = 512, quality = 0.9) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > maxDim || h > maxDim) {
          if (w >= h) { h = Math.round((h * maxDim) / w); w = maxDim; }
          else { w = Math.round((w * maxDim) / h); h = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const isPng = file.type === 'image/png' || file.type === 'image/svg+xml';
        resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function BrandingForm({ onChange }) {
  const [nome, setNome] = useState('');
  const [temLogo, setTemLogo] = useState(false);
  const [logoVersion, setLogoVersion] = useState(Date.now());
  const [novoLogo, setNovoLogo] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function load() {
    const r = await fetch('/api/settings/branding', { credentials: 'same-origin' });
    const d = await r.json();
    setNome(d.nome_sistema || 'Abastecimento');
    setTemLogo(!!d.tem_logo);
    setLogoVersion(d.logo_updated_at || Date.now());
  }
  useEffect(() => { load(); }, []);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErro('Selecione uma imagem'); return; }
    setErro('');
    try {
      const dataUrl = await fileToDataUrl(file);
      setNovoLogo(dataUrl);
    } catch (err) {
      setErro('Falha ao ler imagem');
    }
  }

  async function salvar(e) {
    e.preventDefault();
    setErro(''); setSucesso(''); setSalvando(true);
    try {
      const body = { nome_sistema: nome };
      if (novoLogo) body.logo = novoLogo;
      const r = await fetch('/api/settings/branding', {
        method: 'PUT', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) { setErro(d.error || 'Falha ao salvar'); setSalvando(false); return; }
      setSucesso('Salvo! Recarregue a pagina para ver no menu.');
      setNovoLogo('');
      await load();
      if (onChange) onChange();
    } catch (err) {
      setErro('Erro de conexao');
    } finally { setSalvando(false); }
  }

  async function removerLogo() {
    if (!confirm('Remover logo customizado?')) return;
    setSalvando(true);
    const r = await fetch('/api/settings/branding', {
      method: 'PUT', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remover_logo: true }),
    });
    const d = await r.json();
    setSalvando(false);
    if (!r.ok) { setErro(d.error || 'Falha'); return; }
    setSucesso('Logo removido');
    setNovoLogo('');
    await load();
    if (onChange) onChange();
  }

  return (
    <>
      <h2>Sistema</h2>
      <form onSubmit={salvar}>
        {erro && <div className="msg error">{erro}</div>}
        {sucesso && <div className="msg success">{sucesso}</div>}
        <div style={{ marginBottom: 14 }}>
          <label>Nome do sistema</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} />
          <p className="muted" style={{ marginTop: 4 }}>Aparece no menu lateral, no titulo do navegador e no login.</p>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label>Logo do sistema</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{
              width: 96, height: 96, background: '#f6f8fa', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--border)', overflow: 'hidden',
            }}>
              {novoLogo ? (
                <img src={novoLogo} alt="preview" style={{ maxWidth: '100%', maxHeight: '100%' }} />
              ) : temLogo ? (
                <img src={`/api/settings/logo?v=${logoVersion}`} alt="logo atual" style={{ maxWidth: '100%', maxHeight: '100%' }} />
              ) : (
                <span className="muted" style={{ fontSize: 12 }}>sem logo</span>
              )}
            </div>
            <div>
              <input type="file" accept="image/*" onChange={handleFile} />
              <p className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                Recomendado: PNG quadrado, 256x256 ou maior. A imagem sera redimensionada para 512px.
              </p>
              {(temLogo || novoLogo) && (
                <button type="button" className="btn" style={{ marginTop: 6 }} onClick={removerLogo} disabled={salvando}>
                  Remover logo
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="btn-group">
          <button type="submit" className="btn primary" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar configuracoes'}
          </button>
        </div>
      </form>
    </>
  );
}
