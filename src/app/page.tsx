'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

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
          50% { transform: translateY(-15px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseBg {
          0% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.05); opacity: 0.2; }
          100% { transform: scale(1); opacity: 0.15; }
        }
        .user-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .user-btn::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, rgba(79, 161, 115, 0.1), rgba(79, 161, 115, 0.02));
          opacity: 0;
          transition: opacity 0.3s ease;
          border-radius: inherit;
          z-index: 0;
        }
        .user-btn:hover::before {
          opacity: 1;
        }
        .user-btn:hover {
          transform: translateY(-4px) scale(1.01);
          border-color: var(--accent);
          box-shadow: 0 12px 24px -10px rgba(79, 161, 115, 0.3);
        }
        .user-btn:active {
          transform: translateY(-1px);
          box-shadow: 0 6px 12px -5px rgba(79, 161, 115, 0.3);
        }
        .btn-content {
          position: relative;
          z-index: 1;
        }
        .avatar-container {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .user-btn:hover .avatar-container {
          transform: scale(1.15) rotate(-5deg);
        }
      `}} />

      {/* Decorative background elements with animations */}
      <div style={{ 
        position: 'absolute', top: '-5%', left: '-5%', width: '500px', height: '500px', 
        borderRadius: '50%', background: 'linear-gradient(135deg, #4fa173, #8bced1)', 
        filter: 'blur(120px)', opacity: 0.15, animation: 'pulseBg 10s ease-in-out infinite' 
      }}></div>
      <div style={{ 
        position: 'absolute', bottom: '-10%', right: '-5%', width: '600px', height: '600px', 
        borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', 
        filter: 'blur(150px)', opacity: 0.1, animation: 'pulseBg 12s ease-in-out infinite reverse' 
      }}></div>

      <div style={{ 
        background: 'rgba(25, 25, 25, 0.6)', 
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        padding: 'clamp(40px, 8vw, 60px) clamp(30px, 6vw, 50px)', 
        borderRadius: '32px', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.05)', 
        textAlign: 'center', 
        maxWidth: '480px', 
        width: '100%',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        zIndex: 10,
        animation: 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}>
        
        {/* Floating Icon */}
        <div style={{ 
          fontSize: '72px', 
          marginBottom: '24px',
          display: 'inline-block',
          animation: 'float 6s ease-in-out infinite',
          filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.2))'
        }}>
          📚
        </div>
        
        <h1 style={{ 
          marginBottom: '16px', 
          color: 'var(--text-primary)', 
          fontSize: '36px', 
          fontFamily: 'var(--font-serif)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 10px rgba(255,255,255,0.05)'
        }}>
          ডিজিটাল বইয়ের ঘর
        </h1>
        
        <p style={{ 
          color: 'var(--text-muted)', 
          marginBottom: '48px', 
          fontSize: '17px',
          fontFamily: 'var(--font-serif)',
          lineHeight: 1.6,
          fontWeight: 400
        }}>
          বইয়ের হিসাব, পড়ার গল্প, <br/>আর আমাদের এই ছোট্ট সংগ্রহ।
        </p>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: '32px',
          gap: '16px'
        }}>
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1))', flex: 1 }}></div>
          <h3 style={{ 
            fontWeight: 600, 
            color: 'var(--text-secondary)', 
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            কে প্রবেশ করছেন?
          </h3>
          <div style={{ height: '1px', background: 'linear-gradient(270deg, transparent, rgba(255,255,255,0.1))', flex: 1 }}></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                padding: '16px 24px', 
                borderRadius: '20px', 
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'var(--text-primary)', 
                border: '1px solid rgba(255, 255, 255, 0.08)', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                animation: `fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards ${i * 0.1 + 0.3}s`,
                opacity: 0,
                backdropFilter: 'blur(10px)'
              }}
            >
              <div className="btn-content" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="avatar-container" style={{ 
                  fontSize: '28px', 
                  width: '56px', 
                  height: '56px', 
                  background: 'rgba(255, 255, 255, 0.08)', 
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.05)'
                }}>
                  {u.icon}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-serif)', marginBottom: '2px' }}>{u.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>{u.role}</div>
                </div>
              </div>
              <div className="btn-content text-muted" style={{ fontSize: '20px', opacity: 0.5 }}>
                →
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
