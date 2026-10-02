'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <button className="btn btn-ghost btn-icon" style={{ opacity: 0 }} aria-hidden="true"><Sun size={20} /></button>;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      className="btn btn-ghost btn-icon"
      onClick={() => {
        setTheme(isDark ? 'light' : 'dark');
      }}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      style={{
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      }}
    >
      {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
    </button>
  );
}
