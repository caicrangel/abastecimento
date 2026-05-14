import { useEffect, useState } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    let inicial = 'light';
    try {
      const armazenado = localStorage.getItem('theme');
      if (armazenado === 'dark' || armazenado === 'light') {
        inicial = armazenado;
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        inicial = 'dark';
      }
    } catch (e) {}
    setTheme(inicial);
    document.documentElement.setAttribute('data-theme', inicial);
  }, []);

  function toggle() {
    const novo = theme === 'dark' ? 'light' : 'dark';
    setTheme(novo);
    document.documentElement.setAttribute('data-theme', novo);
    try { localStorage.setItem('theme', novo); } catch (e) {}
  }

  return { theme, toggle };
}
