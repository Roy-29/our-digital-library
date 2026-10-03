'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Author } from '@/lib/types';
import toast from 'react-hot-toast';

export default function AuthorsPage() {
  const [allPersons, setAllPersons] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'authors' | 'translators'>('authors');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const supabase = createClient();

  // Form
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [deathYear, setDeathYear] = useState('');
  const [nationality, setNationality] = useState('');

  useEffect(() => { fetchPersons(); }, []);

  const fetchPersons = async () => {
    setLoading(true);
    const { data } = await supabase.from('authors').select('*').order('name');
    setAllPersons(data || []);
    setLoading(false);
  };

  const authorsList = allPersons.filter(
    (a: any) => a.is_author !== 0 && a.is_author !== false && a.isAuthor !== 0 && a.isAuthor !== false
  );

  const translatorsList = allPersons.filter(
    (a: any) => a.is_translator === 1 || a.is_translator === true || a.isTranslator === 1 || a.isTranslator === true
  );

  const currentList = viewMode === 'authors' ? authorsList : translatorsList;

  const resetForm = () => {
    setName(''); setBio(''); setBirthYear(''); setDeathYear(''); setNationality('');
    setEditingId(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (a: Author) => {
    setEditingId(a.id); setName(a.name_bn || a.name || '');
    setBio(a.bio || ''); setBirthYear(a.birth_year?.toString() || '');
    setDeathYear(a.death_year?.toString() || ''); setNationality(a.nationality || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) { 
      toast.error(viewMode === 'authors' ? 'লেখকের নাম লিখুন' : 'অনুবাদকের নাম লিখুন'); 
      return; 
    }

    const isDuplicate = currentList.some(a => {
      if (editingId && a.id === editingId) return false;
      const lowerName = trimmedName.toLowerCase();
      const sameName = a.name && a.name.trim().toLowerCase() === lowerName;
      const sameNameBn = a.name_bn && a.name_bn.trim().toLowerCase() === lowerName;
      return sameName || sameNameBn;
    });

    if (isDuplicate) {
      toast.error(viewMode === 'authors' ? 'এই নামের লেখক ইতিমধ্যে তালিকায় রয়েছে!' : 'এই নামের অনুবাদক ইতিমধ্যে তালিকায় রয়েছে!');
      return;
    }

    const editingPerson = editingId ? allPersons.find(p => p.id === editingId) : null;

    const data: any = {
      name: trimmedName,
      name_bn: trimmedName,
      bio: bio || null,
      birth_year: birthYear ? parseInt(birthYear) : null,
      death_year: deathYear ? parseInt(deathYear) : null,
      nationality: nationality || null,
    };

    if (viewMode === 'authors') {
      data.is_author = 1;
      if (!editingId) {
        data.is_translator = 0;
      }
    } else {
      data.is_translator = 1;
      if (!editingId) {
        data.is_author = 0;
      }
    }

    if (editingId) {
      const { error } = await supabase.from('authors').update(data).eq('id', editingId);
      if (error) {
        if (error.message?.includes('UNIQUE') || error.message?.includes('unique')) {
          toast.error(viewMode === 'authors' ? 'এই নামের লেখক ইতিমধ্যে রয়েছে!' : 'এই নামের অনুবাদক ইতিমধ্যে রয়েছে!');
        } else {
          toast.error('আপডেট ব্যর্থ');
        }
        return;
      }
      toast.success(viewMode === 'authors' ? 'লেখক আপডেট হয়েছে ✅' : 'অনুবাদক আপডেট হয়েছে ✅');
    } else {
      const { error } = await supabase.from('authors').insert(data);
      if (error) {
        if (error.message?.includes('UNIQUE') || error.message?.includes('unique')) {
          toast.error(viewMode === 'authors' ? 'এই নামের লেখক ইতিমধ্যে রয়েছে!' : 'এই নামের অনুবাদক ইতিমধ্যে রয়েছে!');
        } else {
          toast.error('যোগ করতে ব্যর্থ');
        }
        return;
      }
      toast.success(viewMode === 'authors' ? 'লেখক যোগ হয়েছে ✅' : 'অনুবাদক যোগ হয়েছে ✅');
    }
    setShowModal(false); 
    resetForm(); 
    fetchPersons();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('authors').delete().eq('id', deleteId);
    if (error) {
      toast.error('মুছতে পারা যায়নি'); 
    } else { 
      toast.success(viewMode === 'authors' ? 'লেখক মুছে ফেলা হয়েছে' : 'অনুবাদক মুছে ফেলা হয়েছে'); 
      fetchPersons(); 
    }
    setDeleteId(null);
  };

  const filtered = currentList.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.name_bn?.toLowerCase().includes(q);
  });

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2>{viewMode === 'authors' ? `✍️ লেখক তালিকা (${filtered.length})` : `🔄 অনুবাদক তালিকা (${filtered.length})`}</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {viewMode === 'authors' ? 'বইয়ের মূল লেখকদের তালিকা ও তথ্য পরিচালনা' : 'অনূদিত বইয়ের অনুবাদকদের তালিকা ও তথ্য পরিচালনা'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            type="button"
            className="btn btn-secondary" 
            style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={() => { setViewMode(viewMode === 'authors' ? 'translators' : 'authors'); setSearch(''); }}
          >
            {viewMode === 'authors' ? `🔄 অনুবাদক তালিকা (${translatorsList.length})` : `✍️ লেখক তালিকা (${authorsList.length})`}
          </button>
          <button type="button" className="btn btn-primary" onClick={openAdd}>
            {viewMode === 'authors' ? '➕ নতুন লেখক' : '➕ নতুন অনুবাদক'}
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Tab Navigation */}
        <div className="tabs" style={{ marginBottom: '20px' }}>
          <button 
            type="button"
            className={`tab ${viewMode === 'authors' ? 'active' : ''}`}
            onClick={() => { setViewMode('authors'); setSearch(''); }}
          >
            ✍️ লেখক তালিকা ({authorsList.length})
          </button>
          <button 
            type="button"
            className={`tab ${viewMode === 'translators' ? 'active' : ''}`}
            onClick={() => { setViewMode('translators'); setSearch(''); }}
          >
            🔄 অনুবাদক তালিকা ({translatorsList.length})
          </button>
        </div>

        <div className="search-bar" style={{ marginBottom: '16px', maxWidth: '100%' }}>
          <span className="search-icon">🔍</span>
          <input 
            placeholder={viewMode === 'authors' ? 'লেখক খুঁজুন...' : 'অনুবাদক খুঁজুন...'} 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>

        {loading ? (
          <div className="loading-inline"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{viewMode === 'authors' ? '✍️' : '🔄'}</div>
            <h3>{viewMode === 'authors' ? 'কোনো লেখক নেই' : 'কোনো অনুবাদক নেই'}</h3>
            <p>{viewMode === 'authors' ? 'নতুন লেখক যোগ করুন' : 'নতুন অনুবাদক যোগ করুন'}</p>
            <button type="button" className="btn btn-primary" style={{ marginTop: '12px' }} onClick={openAdd}>
              {viewMode === 'authors' ? '➕ নতুন লেখক যোগ করুন' : '➕ নতুন অনুবাদক যোগ করুন'}
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>নাম</th>
                  <th>জাতীয়তা</th>
                  <th>জন্ম</th>
                  <th>মৃত্যু</th>
                  <th style={{ textAlign: 'right' }}>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 500 }}>
                      <span style={{ marginRight: '6px' }}>{viewMode === 'authors' ? '✍️' : '🔄'}</span>
                      {a.name_bn || a.name}
                    </td>
                    <td>{a.nationality || '—'}</td>
                    <td>{a.birth_year || '—'}</td>
                    <td>{a.death_year || '—'}</td>
                    <td>
                      <div className="actions">
                        <button 
                          className="btn btn-ghost btn-icon btn-sm" 
                          title="সম্পাদনা করুন"
                          onClick={() => openEdit(a)}
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn btn-ghost btn-icon btn-sm" 
                          title="মুছে ফেলুন"
                          onClick={() => setDeleteId(a.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingId 
                  ? (viewMode === 'authors' ? '✏️ লেখক সম্পাদনা' : '✏️ অনুবাদক সম্পাদনা') 
                  : (viewMode === 'authors' ? '➕ নতুন লেখক' : '➕ নতুন অনুবাদক')}
              </h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    {viewMode === 'authors' ? 'লেখকের নাম *' : 'অনুবাদকের নাম *'}
                  </label>
                  <input 
                    className="form-input" 
                    placeholder={viewMode === 'authors' ? 'লেখকের নাম লিখুন...' : 'অনুবাদকের নাম লিখুন...'} 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                    autoFocus 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">জীবনী / বিবরণ</label>
                  <textarea 
                    className="form-textarea" 
                    value={bio} 
                    onChange={e => setBio(e.target.value)} 
                    placeholder={viewMode === 'authors' ? 'লেখকের সংক্ষিপ্ত পরিচিতি...' : 'অনুবাদকের সংক্ষিপ্ত পরিচিতি...'} 
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">জন্ম সাল</label>
                    <input className="form-input" type="number" value={birthYear} onChange={e => setBirthYear(e.target.value)} placeholder="যেমন: 1948" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">মৃত্যু সাল</label>
                    <input className="form-input" type="number" value={deathYear} onChange={e => setDeathYear(e.target.value)} placeholder="যেমন: 2012" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">জাতীয়তা</label>
                    <input className="form-input" value={nationality} onChange={e => setNationality(e.target.value)} placeholder="যেমন: বাংলাদেশী" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>বাতিল</button>
                <button type="submit" className="btn btn-primary">{editingId ? '✅ আপডেট' : '➕ যোগ করুন'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="confirm-overlay" onClick={() => setDeleteId(null)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">⚠️</div>
            <h3>মুছে ফেলবেন?</h3>
            <p>{viewMode === 'authors' ? 'এই লেখক মুছে যাবে।' : 'এই অনুবাদক মুছে যাবে।'}</p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>বাতিল</button>
              <button className="btn btn-danger" onClick={handleDelete}>🗑️ মুছুন</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
