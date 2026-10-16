'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';

export default function LandingPage() {
  const { user, loginAs, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) return null; // Prevent flicker and hydration mismatch

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--bg-primary)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(4deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseBg {
          0% { transform: scale(1); opacity: 0.18; }
          50% { transform: scale(1.08); opacity: 0.28; }
          100% { transform: scale(1); opacity: 0.18; }
        }

        /* Glassmorphic Card: Light & Dark theme aware */
        .landing-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          border: 1px solid rgba(222, 228, 223, 0.85);
          box-shadow: 0 25px 50px -12px rgba(31, 42, 36, 0.08), 
                      0 0 0 1px rgba(255, 255, 255, 0.9) inset,
                      0 4px 20px rgba(79, 161, 115, 0.05);
          border-radius: 32px;
          padding: clamp(36px, 7vw, 56px) clamp(24px, 5vw, 48px);
          max-width: 480px;
          width: 100%;
          text-align: center;
          position: relative;
          z-index: 10;
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .dark .landing-card {
          background: rgba(26, 34, 31, 0.78);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 
                      inset 0 1px 1px rgba(255, 255, 255, 0.08);
        }

        /* Gradient Typography */
        .landing-title {
          font-size: 34px;
          font-family: var(--font-serif);
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 12px;
          background: linear-gradient(135deg, #1F2A24 0%, #3B5A49 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          transition: all 0.3s ease;
        }

        .dark .landing-title {
          background: linear-gradient(135deg, #FFFFFF 0%, #D4E2D9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 2px 12px rgba(255, 255, 255, 0.06);
        }

        /* User Buttons */
        .user-btn {
          position: relative;
          overflow: hidden;
          background: #FFFFFF;
          border: 1px solid var(--border);
          box-shadow: 0 2px 8px rgba(31, 42, 36, 0.04);
          color: var(--text-primary);
          padding: 16px 20px;
          border-radius: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          width: 100%;
        }

        .dark .user-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: none;
        }

        .user-btn::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, rgba(79, 161, 115, 0.12), rgba(79, 161, 115, 0.02));
          opacity: 0;
          transition: opacity 0.3s ease;
          border-radius: inherit;
          z-index: 0;
        }

        .user-btn:hover::before {
          opacity: 1;
        }

        .user-btn:hover {
          transform: translateY(-3px) scale(1.01);
          border-color: var(--accent);
          box-shadow: 0 12px 24px -8px rgba(79, 161, 115, 0.22);
        }

        .dark .user-btn:hover {
          background: rgba(255, 255, 255, 0.07);
          box-shadow: 0 12px 24px -10px rgba(90, 179, 132, 0.35);
        }

        .user-btn:active {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px -4px rgba(79, 161, 115, 0.25);
        }

        .btn-content {
          position: relative;
          z-index: 1;
        }

        /* Avatar Container */
        .avatar-container {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          background: linear-gradient(135deg, #EEF5F0 0%, #E2ECE5 100%);
          border: 1px solid rgba(79, 161, 115, 0.18);
          box-shadow: 0 2px 6px rgba(31, 42, 36, 0.05);
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          flex-shrink: 0;
        }

        .dark .avatar-container {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.05);
        }

        .user-btn:hover .avatar-container {
          transform: scale(1.12) rotate(-5deg);
        }

        /* Role Badge */
        .role-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 6px;
          background: rgba(79, 161, 115, 0.12);
          color: var(--accent);
          letter-spacing: 0.02em;
        }

        .dark .role-badge {
          background: rgba(90, 179, 132, 0.18);
          color: #7FC7A1;
        }

        .arrow-indicator {
          font-size: 18px;
          color: var(--text-muted);
          transition: transform 0.3s ease, color 0.3s ease;
          display: flex;
          align-items: center;
        }

        .user-btn:hover .arrow-indicator {
          transform: translateX(4px);
          color: var(--accent);
        }

        /* Floating Theme Toggle */
        .landing-theme-toggle {
          position: absolute;
          top: 24px;
          right: 24px;
          z-index: 50;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid var(--border);
          border-radius: 9999px;
          padding: 2px;
          box-shadow: 0 4px 16px rgba(31, 42, 36, 0.06);
          transition: all 0.2s ease;
        }

        .dark .landing-theme-toggle {
          background: rgba(26, 34, 31, 0.7);
          border-color: rgba(255, 255, 255, 0.12);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }
      `}} />

      {/* Floating Theme Toggle in top right */}
      <div className="landing-theme-toggle">
        <ThemeToggle variant="icon" />
      </div>

      {/* Ambient background glows */}
      <div style={{ 
        position: 'absolute', top: '-10%', left: '-10%', width: '540px', height: '540px', 
        borderRadius: '50%', background: 'linear-gradient(135deg, #4FA173, #94D8D2)', 
        filter: 'blur(130px)', opacity: 0.2, animation: 'pulseBg 10s ease-in-out infinite' 
      }}></div>
      <div style={{ 
        position: 'absolute', bottom: '-15%', right: '-10%', width: '600px', height: '600px', 
        borderRadius: '50%', background: 'linear-gradient(135deg, #F1BD88, #E37452)', 
        filter: 'blur(150px)', opacity: 0.15, animation: 'pulseBg 12s ease-in-out infinite reverse' 
      }}></div>

      {/* Central Glassmorphic Card */}
      <div className="landing-card">
        
        {/* Floating Book Icon */}
        <div style={{ 
          fontSize: '68px', 
          marginBottom: '20px',
          display: 'inline-block',
          animation: 'float 6s ease-in-out infinite',
          filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.12))'
        }}>
          📚
        </div>
        
        <h1 className="landing-title">
          ডিজিটাল বইয়ের ঘর
        </h1>
        
        <p style={{ 
          color: 'var(--text-secondary)', 
          marginBottom: '40px', 
          fontSize: '16px',
          fontFamily: 'var(--font-serif)',
          lineHeight: 1.6,
          fontWeight: 400
        }}>
          বইয়ের হিসাব, পড়ার গল্প, <br/>আর আমাদের এই ছোট্ট সংগ্রহ।
        </p>

        {/* Section Divider */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: '28px',
          gap: '16px'
        }}>
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--border))', flex: 1 }}></div>
          <h3 style={{ 
            fontWeight: 600, 
            color: 'var(--text-muted)', 
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em'
          }}>
            কে প্রবেশ করছেন?
          </h3>
          <div style={{ height: '1px', background: 'linear-gradient(270deg, transparent, var(--border))', flex: 1 }}></div>
        </div>

        {/* User Selection Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { id: 'swapnil', name: 'স্বপ্নীল', icon: '🧑🏻', role: 'অ্যাডমিন' },
            { id: 'bipro', name: 'বিপ্রতীব', icon: '🧑🏽', role: 'অ্যাডমিন' },
            { id: 'srrijan', name: 'সৃজন', icon: '🧑🏻‍🦱', role: 'অ্যাডমিন' }
          ].map((u, i) => (
            <button 
              key={u.id}
              className="user-btn"
              onClick={() => loginAs(u.id as any)}
              style={{ 
                animation: `fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards ${i * 0.1 + 0.25}s`,
                opacity: 0
              }}
            >
              <div className="btn-content" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="avatar-container">
                  {u.icon}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ 
                    fontSize: '17px', 
                    fontWeight: 700, 
                    fontFamily: 'var(--font-serif)', 
                    color: 'var(--text-primary)',
                    marginBottom: '3px' 
                  }}>
                    {u.name}
                  </div>
                  <span className="role-badge">
                    {u.role}
                  </span>
                </div>
              </div>
              <div className="btn-content arrow-indicator">
                →
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

