import { useRef, useState } from 'react';

export default function FotoCaptura({ label, value, onChange, required }) {
  const inputRef = useRef(null);
  const [erro, setErro] = useState('');

  function handleChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErro('Selecione uma imagem valida');
      return;
    }
    setErro('');
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      try {
        const compressed = await compressImage(dataUrl);
        onChange(compressed);
      } catch (err) {
        onChange(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <label>{label}{required && ' *'}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
      />
      {erro && <div className="msg error" style={{ marginTop: 6 }}>{erro}</div>}
      {value && <img src={value} alt="preview" className="preview-img" />}
    </div>
  );
}

function compressImage(dataUrl, maxDim = 1280, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
