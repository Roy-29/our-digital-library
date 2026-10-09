'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Category, Genre } from '@/lib/types';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'categories' | 'genres'>('categories');
  const [showModal, setShowModal] = useState(false);
  const [viewingItem, setViewingItem] = useState<Category | Genre | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'category' | 'genre'>('category');
  const supabase = createClient();

  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6B7280');
  const [icon, setIcon] = useState('📁');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [c, g] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('genres').select('*').order('name'),
    ]);
    setCategories(c.data || []);
    setGenres(g.data || []);
    setLoading(false);
  };

  const resetForm = () => { setName(''); setNameBn(''); setDescription(''); setColor('#6B7280'); setIcon(activeTab === 'categories' ? '📁' : '🏷️'); setEditingId(null); };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (item: Category | Genre) => {
    setEditingId(item.id); setName(item.name_bn || item.name);
    setDescription(item.description || ''); setColor(item.color); setIcon(item.icon);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) { toast.error('নাম লিখুন'); return; }
    const table = activeTab === 'categories' ? 'categories' : 'genres';
    const data = { name: trimmedName, name_bn: trimmedName, description: description || null, color, icon };

    if (editingId) {
      const { error } = await supabase.from(table).update(data).eq('id', editingId);
      if (error) toast.error('আপডেট ব্যর্থ'); else toast.success('আপডেট হয়েছে ✅');
    } else {
      const { error } = await supabase.from(table).insert(data);
      if (error) toast.error('যোগ করতে ব্যর্থ: ' + error.message); else toast.success('যোগ হয়েছে ✅');
    }
    setShowModal(false); resetForm(); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const table = deleteType === 'category' ? 'categories' : 'genres';
    const { error } = await supabase.from(table).delete().eq('id', deleteId);
    if (error) toast.error('মুছতে পারা যায়নি'); else { toast.success('মুছে ফেলা হয়েছে'); fetchData(); }
    setDeleteId(null);
  };

  const items = activeTab === 'categories' ? categories : genres;

  return (
    <>
      <div className="page-header"><h2>🏷️ Category / Genre</h2><button className="btn btn-primary" onClick={openAdd}>➕ নতুন যোগ</button></div>
      <div className="page-body">
        <div className="tabs" style={{ marginBottom: '20px' }}>
          <button className={`tab ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>📁 Categories ({categories.length})</button>
          <button className={`tab ${activeTab === 'genres' ? 'active' : ''}`} onClick={() => setActiveTab('genres')}>🏷️ Genres ({genres.length})</button>
        </div>

        {loading ? <div className="loading-inline"><div className="spinner" /></div> : items.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🏷️</div><h3>কিছু নেই</h3></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
            {items.map(item => (
              <div 
                key={item.id} 
                className="card" 
                style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => setViewingItem(item)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.border = '1px solid var(--border-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  e.currentTarget.style.border = '1px solid var(--border)';
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.name_bn || item.name}
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                  </div>
                  {item.name_bn && <div className="text-xs text-muted">{item.name}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewingItem && (
        <div className="modal-overlay" onClick={() => setViewingItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏷️ বিস্তারিত তথ্য</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setViewingItem(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ fontSize: '3rem' }}>{viewingItem.icon}</div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {viewingItem.name_bn || viewingItem.name}
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: viewingItem.color, display: 'inline-block' }} />
                  </div>
                  {viewingItem.name_bn && <div className="text-muted">{viewingItem.name}</div>}
                </div>
              </div>
              {viewingItem.description && (
                <div className="info-group">
                  <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>বিবরণ</label>
                  <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{viewingItem.description}</div>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn btn-primary" onClick={() => {
                const item = viewingItem;
                setViewingItem(null);
                openEdit(item);
              }}>✏️ এডিট করুন</button>
              <button type="button" className="btn btn-secondary" onClick={() => setViewingItem(null)}>বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{editingId ? '✏️ সম্পাদনা' : `➕ নতুন ${activeTab === 'categories' ? 'Category' : 'Genre'}`}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {editingId && (
                <button type="button" className="btn btn-icon" style={{ 
                  backgroundColor: '#ef4444', 
                  color: 'white', 
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  fontSize: '14px'
                }} onClick={() => {
                  setShowModal(false);
                  setDeleteId(editingId);
                  setDeleteType(activeTab === 'categories' ? 'category' : 'genre');
                }} title="মুছুন">
                  🗑️
                </button>
              )}
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
          </div>
          <form onSubmit={handleSubmit}><div className="modal-body">
            <div className="form-group"><label className="form-label">নাম *</label><input className="form-input" placeholder="নাম লিখুন..." value={name} onChange={e => setName(e.target.value)} required autoFocus /></div>
            <div className="form-group"><label className="form-label">বিবরণ</label><textarea className="form-textarea" value={description} onChange={e => setDescription(e.target.value)} /></div>
            <div className="form-row"><div className="form-group"><label className="form-label">আইকন (emoji)</label><input className="form-input" value={icon} onChange={e => setIcon(e.target.value)} /></div><div className="form-group"><label className="form-label">রঙ</label><input className="form-input" type="color" value={color} onChange={e => setColor(e.target.value)} /></div></div>
          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>বাতিল</button>
              <button type="submit" className="btn btn-primary">{editingId ? '✅ আপডেট' : '➕ যোগ'}</button>
            </div>
          </div>
          </form>
        </div></div>
      )}

      {deleteId && (<div className="confirm-overlay" onClick={() => setDeleteId(null)}><div className="confirm-dialog" onClick={e => e.stopPropagation()}><div className="confirm-icon">⚠️</div><h3>মুছে ফেলবেন?</h3><div className="confirm-actions"><button className="btn btn-secondary" onClick={() => setDeleteId(null)}>বাতিল</button><button className="btn btn-danger" onClick={handleDelete}>🗑️ মুছুন</button></div></div></div>)}
    </>
  );
}

