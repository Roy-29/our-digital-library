'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle({ variant = 'icon' }: { variant?: 'icon' | 'rod' }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <button style={{ width: variant === 'rod' ? '100%' : 40, height: 40, opacity: 0 }} aria-hidden="true" />;
  }

  const isDark = resolvedTheme === 'dark';

  if (variant === 'rod') {
    return (
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        style={{
          width: '100%',
          height: '36px',
          borderRadius: '18px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 4px',
          background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
          border: '1px solid rgba(128,128,128,0.2)',
          position: 'relative',
          cursor: 'pointer',
          boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.1)',
          marginTop: '16px'
        }}
      >
        <div style={{
          position: 'absolute',
          left: isDark ? 'calc(100% - 32px)' : '4px',
          width: '28px',
          height: '28px',
          borderRadius: '14px',
          background: isDark ? 'var(--bg-card)' : '#fff',
          boxShadow: isDark 
            ? '0 0 10px rgba(255,255,255,0.2), inset 0 0 4px rgba(255,255,255,0.5)' 
            : '0 0 15px rgba(255, 215, 0, 0.6), inset 0 0 4px rgba(255, 215, 0, 0.8)',
          transition: 'left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2
        }}>
          {isDark ? <Moon size={14} color="var(--text-primary)" /> : <Sun size={14} color="#d97706" />}
        </div>
        
        {/* Track text */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          width: '100%', 
          padding: '0 12px',
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          position: 'relative',
          zIndex: 1,
          pointerEvents: 'none'
        }}>
          <span style={{ color: 'var(--text-secondary)', opacity: isDark ? 0.3 : 1, transition: 'opacity 0.3s' }}>Light</span>
          <span style={{ color: 'var(--text-secondary)', opacity: isDark ? 1 : 0.3, transition: 'opacity 0.3s' }}>Dark</span>
        </div>
      </button>
    );
  }

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
