import { useEffect, useState } from 'react';

function fileToDataUrl(file, maxDim = 512, quality = 0.92) {
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
        const isPng = file.type === 'image/png' || file.type === 'image/svg+xml' || file.type === 'image/webp';
        resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function LogoUploader({ titulo, descricao, fundo, temLogo, logoVersion, novoLogo, onSelect, onRemover }) {
  const id = `file-${titulo.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 8, padding: 14,
    }}>
      <h3 style={{ marginTop: 0, marginBottom: 4, fontSize: 15 }}>{titulo}</h3>
      <p className="muted" style={{ margin: '0 0 10px', fontSize: 12 }}>{descricao}</p>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{
          width: 120, height: 120, background: fundo, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--border)', overflow: 'hidden',
        }}>
          {novoLogo ? (
            <img src={novoLogo} alt="preview" style={{ maxWidth: '100%', maxHeight: '100%' }} />
          ) : temLogo ? (
            <img src={`/api/settings/logo?theme=${titulo.toLowerCase().includes('escuro') ? 'dark' : 'light'}&v=${logoVersion}`}
              alt="logo atual" style={{ maxWidth: '100%', maxHeight: '100%' }} />
          ) : (
            <span style={{ color: fundo === '#fff' || fundo === '#ffffff' ? '#888' : '#aaa', fontSize: 12 }}>sem logo</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <input id={id} type="file" accept="image/*" onChange={onSelect} />
          {(temLogo || novoLogo) && (
            <button type="button" className="btn" style={{ marginTop: 8 }} onClick={onRemover}>
              Remover logo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrandingForm({ onChange }) {
  const [nome, setNome] = useState('');
  const [info, setInfo] = useState({
    tem_logo_light: false, tem_logo_dark: false,
    logo_light_updated_at: null, logo_dark_updated_at: null,
  });
  const [novoLight, setNovoLight] = useState('');
  const [novoDark, setNovoDark] = useState('');
  const [removerLight, setRemoverLight] = useState(false);
  const [removerDark, setRemoverDark] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function load() {
    const r = await fetch('/api/settings/branding', { credentials: 'same-origin' });
    const d = await r.json();
    setNome(d.nome_sistema || 'Abastecimento');
    setInfo({
      tem_logo_light: !!d.tem_logo_light,
      tem_logo_dark: !!d.tem_logo_dark,
      logo_light_updated_at: d.logo_light_updated_at || Date.now(),
      logo_dark_updated_at: d.logo_dark_updated_at || Date.now(),
    });
  }
  useEffect(() => { load(); }, []);

  async function handleFile(setter, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErro('Selecione uma imagem'); return; }
    setErro('');
    try {
      const dataUrl = await fileToDataUrl(file);
      setter(dataUrl);
    } catch (err) {
      setErro('Falha ao ler imagem');
    }
  }

  async function salvar(e) {
    e.preventDefault();
    setErro(''); setSucesso(''); setSalvando(true);
    try {
      const body = { nome_sistema: nome };
      if (novoLight) body.logo_light = novoLight;
      if (novoDark) body.logo_dark = novoDark;
      if (removerLight) body.remover_logo_light = true;
      if (removerDark) body.remover_logo_dark = true;
      const r = await fetch('/api/settings/branding', {
        method: 'PUT', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) { setErro(d.error || 'Falha ao salvar'); setSalvando(false); return; }
      setSucesso('Salvo! As alteracoes vao aparecer em todo o sistema.');
      setNovoLight(''); setNovoDark('');
      setRemoverLight(false); setRemoverDark(false);
      await load();
      if (onChange) onChange();
    } catch (err) {
      setErro('Erro de conexao');
    } finally { setSalvando(false); }
  }

  return (
    <>
      <h2>Sistema</h2>
      <form onSubmit={salvar}>
        {erro && <div className="msg error">{erro}</div>}
        {sucesso && <div className="msg success">{sucesso}</div>}
        <div style={{ marginBottom: 18 }}>
          <label>Nome do sistema</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} />
          <p className="muted" style={{ marginTop: 4 }}>Aparece no menu lateral, no titulo do navegador e na tela de login.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 18 }}>
          <LogoUploader
            titulo="Logo (tema claro)"
            descricao="Usado quando o tema claro esta ativo. Prefira um logo com cores escuras ou coloridas."
            fundo="#ffffff"
            temLogo={info.tem_logo_light && !removerLight}
            logoVersion={info.logo_light_updated_at}
            novoLogo={novoLight}
            onSelect={(e) => { setRemoverLight(false); handleFile(setNovoLight, e); }}
            onRemover={() => { setRemoverLight(true); setNovoLight(''); }}
          />
          <LogoUploader
            titulo="Logo (tema escuro)"
            descricao="Usado quando o tema escuro esta ativo. Prefira um logo com fundo transparente ou cores claras."
            fundo="#0d1117"
            temLogo={info.tem_logo_dark && !removerDark}
            logoVersion={info.logo_dark_updated_at}
            novoLogo={novoDark}
            onSelect={(e) => { setRemoverDark(false); handleFile(setNovoDark, e); }}
            onRemover={() => { setRemoverDark(true); setNovoDark(''); }}
          />
        </div>

        <p className="muted" style={{ fontSize: 12, marginBottom: 14 }}>
          Recomendado: PNG quadrado, 256x256 ou maior, fundo transparente. As imagens sao redimensionadas para 512px.
          Se voce subir apenas um dos logos, ele sera usado nos dois temas.
        </p>

        <div className="btn-group">
          <button type="submit" className="btn primary" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar configuracoes'}
          </button>
        </div>
      </form>
    </>
  );
}
