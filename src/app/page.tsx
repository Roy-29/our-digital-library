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

  useEffect(() => {
    if (user && mounted) {
      router.push('/dashboard');
    }
  }, [user, mounted, router]);

  if (!mounted || loading || user) return null; // Prevent flicker and hydration mismatch

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
      {/* Decorative background elements */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'var(--pastel-aqua-grad)', filter: 'blur(100px)', opacity: 0.15 }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '500px', height: '500px', borderRadius: '50%', background: 'var(--pastel-terra-grad)', filter: 'blur(120px)', opacity: 0.12 }}></div>

      <div style={{ 
        background: 'var(--bg-card)', 
        padding: 'clamp(30px, 6vw, 50px) clamp(20px, 5vw, 40px)', 
        borderRadius: '24px', 
        boxShadow: 'var(--shadow-xl)', 
        textAlign: 'center', 
        maxWidth: '440px', 
        width: '100%',
        border: '1px solid var(--border-light)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ 
          fontSize: '64px', 
          marginBottom: '20px',
          textShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          📚
        </div>
        
        <h1 style={{ 
          marginBottom: '12px', 
          color: 'var(--text-primary)', 
          fontSize: '32px', 
          fontFamily: 'var(--font-serif)',
          fontWeight: 700,
          letterSpacing: '-0.02em'
        }}>
          ডিজিটাল বইয়ের ঘর
        </h1>
        
        <p style={{ 
          color: 'var(--text-muted)', 
          marginBottom: '40px', 
          fontSize: '16px',
          fontFamily: 'var(--font-serif)',
          lineHeight: 1.6
        }}>
          বইয়ের হিসাব, পড়ার গল্প, <br/>আর এই ছোট্ট সংগ্রহ।
        </p>

        <div style={{ 
          height: '1px', 
          background: 'var(--border-light)', 
          margin: '0 auto 30px', 
          width: '60%' 
        }}></div>

        <h3 style={{ 
          marginBottom: '24px', 
          fontWeight: 500, 
          color: 'var(--text-secondary)', 
          fontSize: '15px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          কে প্রবেশ করছেন?
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button 
            onClick={() => loginAs('swapnil')}
            style={{ 
              padding: '16px 20px', 
              fontSize: '17px', 
              borderRadius: '16px', 
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)', 
              border: '1.5px solid var(--border)', 
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '16px',
              transition: 'all var(--transition-base)',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <span style={{ fontSize: '24px' }}>🧑🏻</span>
            স্বপ্নীল
          </button>
          
          <button 
            onClick={() => loginAs('bipro')}
            style={{ 
              padding: '16px 20px', 
              fontSize: '17px', 
              borderRadius: '16px', 
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)', 
              border: '1.5px solid var(--border)', 
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '16px',
              transition: 'all var(--transition-base)',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <span style={{ fontSize: '24px' }}>🧑🏽</span>
            বিপ্রতীব
          </button>

          <button 
            onClick={() => loginAs('srrijan')}
            style={{ 
              padding: '16px 20px', 
              fontSize: '17px', 
              borderRadius: '16px', 
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)', 
              border: '1.5px solid var(--border)', 
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '16px',
              transition: 'all var(--transition-base)',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <span style={{ fontSize: '24px' }}>🧑🏻‍🦱</span>
            সৃজন
          </button>
        </div>
      </div>
    </div>
  );
}
