'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <button style={{ width: 40, height: 40, opacity: 0 }} aria-hidden="true" />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      style={{
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        background: 'rgba(128, 128, 128, 0.15)',
        border: '1px solid rgba(128, 128, 128, 0.2)',
        color: 'inherit',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        flexShrink: 0
      }}
    >
      {isDark ? <Sun size={20} color="currentColor" /> : <Moon size={20} color="currentColor" />}
    </button>
  );
}
