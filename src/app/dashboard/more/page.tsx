'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const MENU_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'ড্যাশবোর্ড', desc: 'পরিসংখ্যান ও সারসংক্ষেপ' },
  { href: '/dashboard/books', icon: '📚', label: 'সব বই', desc: 'সংগ্রহের সব বই দেখুন' },
  { href: '/dashboard/books/add', icon: '➕', label: 'নতুন বই যোগ', desc: 'সংগ্রহে নতুন বই যোগ করুন' },
  { href: '/dashboard/reading', icon: '📖', label: 'পড়ছি', desc: 'পড়ার অগ্রগতি ট্র্যাক করুন' },
  { href: '/dashboard/lending', icon: '📤', label: 'ধার দেওয়া', desc: 'ধার দেওয়া বই পরিচালনা' },
  { href: '/dashboard/wishlist', icon: '🛒', label: 'কিনতে হবে', desc: 'কিনতে চাওয়া বইয়ের তালিকা' },
  { href: '/dashboard/authors', icon: '✍️', label: 'লেখক', desc: 'লেখক যোগ/সম্পাদনা' },
  { href: '/dashboard/publishers', icon: '🏢', label: 'প্রকাশক', desc: 'প্রকাশক পরিচালনা' },
  { href: '/dashboard/categories', icon: '🏷️', label: 'Category / Genre', desc: 'ক্যাটাগরি ও ধরন' },
  { href: '/dashboard/people', icon: '👥', label: 'মানুষ', desc: 'ধারকারীদের তথ্য' },
  { href: '/dashboard/locations', icon: '📍', label: 'কোথায় রাখা আছে', desc: 'ঘর, শেলফ, র‍্যাক' },
  { href: '/dashboard/activity', icon: '📋', label: 'কার্যকলাপ', desc: 'সব কার্যকলাপের ইতিহাস' },
  { href: '/dashboard/backup', icon: '💾', label: 'ব্যাকআপ', desc: 'ডেটা ব্যাকআপ ও পুনরুদ্ধার' },
];

export default function MorePage() {
  const { signOut } = useAuth();

  return (
    <>
      <div className="page-header"><h2>☰ আরও</h2></div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
          {MENU_ITEMS.map(item => (
            <Link key={item.href} href={item.href} className="card" style={{ padding: '16px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '1.8rem' }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--charcoal)' }}>{item.label}</div>
                <div className="text-xs text-muted">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button className="btn btn-danger" onClick={signOut}>🚪 লগআউট</button>
        </div>

        <div style={{ marginTop: '48px', textAlign: 'center', opacity: 0.4 }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem' }}>📚 ডিজিটাল বইয়ের ঘর</p>
          <p className="text-xs">Swapnil & Bipro-এর ব্যক্তিগত লাইব্রেরি</p>
        </div>
      </div>
    </>
  );
}
