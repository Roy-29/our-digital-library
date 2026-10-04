'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { LogOut } from 'lucide-react';
import { getOwnerLabel } from '@/lib/types';

const NAV_ITEMS = [
  { section: 'প্রধান' },
  { href: '/dashboard', icon: '🏠', label: 'ড্যাশবোর্ড' },
  { href: '/dashboard/books', icon: '📚', label: 'সব বই' },
  { href: '/dashboard/sort', icon: '🔀', label: 'বই বাছাইকরণ' },
  { href: '/dashboard/books/add', icon: '➕', label: 'নতুন বই যোগ' },
  { href: '/dashboard/magazines', icon: '📰', label: 'ম্যাগাজিন' },
  { section: 'ট্র্যাকিং' },
  { href: '/dashboard/reading', icon: '📖', label: 'পড়ছি' },
  { href: '/dashboard/lending', icon: '📤', label: 'ধার দেওয়া' },
  { href: '/dashboard/wishlist', icon: '🛒', label: 'উইশলিস্ট' },
  { href: '/dashboard/unowned', icon: '🔖', label: 'আমার কাছে নেই' },
  { section: 'পরিচালনা' },
  { href: '/dashboard/authors', icon: '✍️', label: 'লেখক' },
  { href: '/dashboard/publishers', icon: '🏢', label: 'প্রকাশক' },
  { href: '/dashboard/categories', icon: '🏷️', label: 'Category / Genre' },
  { section: 'অন্যান্য' },
  { href: '/dashboard/users', icon: '👥', label: 'ব্যবহারকারী' },
  { href: '/dashboard/activity', icon: '📋', label: 'কার্যকলাপ' },
  { href: '/dashboard/backup', icon: '💾', label: 'ব্যাকআপ' },
];

const MOBILE_NAV = [
  { href: '/dashboard', icon: '🏠', label: 'Home' },
  { href: '/dashboard/books', icon: '📚', label: 'Books' },
  { href: '/dashboard/books/add', icon: '➕', label: 'Add', isAdd: true },
  { href: '/dashboard/lending', icon: '📤', label: 'Lent' },
  { href: '/dashboard/more', icon: '☰', label: 'More' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="app-layout">
      {/* Mobile top app bar */}
      <header className="mobile-top-bar">
        <div className="mobile-top-bar-left">
          <button
            className="mobile-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <Link href="/dashboard" className="mobile-brand-link">
            <span className="mobile-brand-icon">📚</span>
            <span className="mobile-brand-text">ডিজিটাল বইয়ের ঘর</span>
          </Link>
        </div>

        <div className="mobile-top-bar-right">
          <div className="mobile-user-badge" title={`লগইন: ${displayName} (${user.email})`}>
            <span className="mobile-user-avatar">{initials}</span>
            <span className="mobile-user-name">{displayName}</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 1040, backdropFilter: 'blur(2px)',
          }}
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <button
            className="mobile-close-sidebar-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
          <Link href="/dashboard" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <h1>📚 ডিজিটাল বইয়ের ঘর</h1>
            <p>Personal Digital Library</p>
          </Link>
        </div>

        {/* User Card at top of sidebar for quick visibility on mobile */}
        <div className="sidebar-top-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{displayName}</div>
            <div className="sidebar-user-email">{user.email}</div>
          </div>
          <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>{profile?.owner ? getOwnerLabel(profile.owner) : 'সদস্য'}</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item, i) => {
            if ('section' in item && item.section) {
              return (
                <div key={i} className="sidebar-section-title">
                  {item.section}
                </div>
              );
            }
            const navItem = item as { href: string; icon: string; label: string };
            const isActive = pathname === navItem.href || 
              (navItem.href !== '/dashboard' && pathname.startsWith(navItem.href));
            return (
              <Link
                key={navItem.href}
                href={navItem.href}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="icon">{navItem.icon}</span>
                <span>{navItem.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info" style={{ color: 'rgba(255,255,255,0.9)' }}>
            <div className="sidebar-user-name">{displayName}</div>
            <div className="sidebar-user-email" style={{ color: 'rgba(255,255,255,0.5)' }}>{user.email}</div>
          </div>
          <div className="desktop-theme-toggle">
            <ThemeToggle />
          </div>
          <button
            className="btn btn-ghost btn-icon"
            onClick={signOut}
            title="লগআউট"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        <div className="mobile-nav-items">
          {MOBILE_NAV.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && !item.isAdd && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-nav-item ${isActive ? 'active' : ''} ${item.isAdd ? 'add-btn' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <style jsx>{`
        @media (max-width: 768px) {
          .sidebar-overlay {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
