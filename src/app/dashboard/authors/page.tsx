'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Author } from '@/lib/types';
import toast from 'react-hot-toast';

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const supabase = createClient();

  // Form
  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [bio, setBio] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [deathYear, setDeathYear] = useState('');
  const [nationality, setNationality] = useState('');

  useEffect(() => { fetchAuthors(); }, []);

  const fetchAuthors = async () => {
    setLoading(true);
    const { data } = await supabase.from('authors').select('*').order('name');
    setAuthors(data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setName(''); setNameBn(''); setBio(''); setBirthYear(''); setDeathYear(''); setNationality('');
    setEditingId(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (a: Author) => {
    setEditingId(a.id); setName(a.name); setNameBn(a.name_bn || '');
    setBio(a.bio || ''); setBirthYear(a.birth_year?.toString() || '');
    setDeathYear(a.death_year?.toString() || ''); setNationality(a.nationality || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedNameBn = nameBn.trim();
    if (!trimmedName) { toast.error('নাম লিখুন'); return; }

    const isDuplicate = authors.some(a => {
      if (editingId && a.id === editingId) return false;
      const lowerName = trimmedName.toLowerCase();
      const lowerNameBn = trimmedNameBn.toLowerCase();
      const sameName = a.name && a.name.trim().toLowerCase() === lowerName;
      const sameNameBn = lowerNameBn && a.name_bn && a.name_bn.trim().toLowerCase() === lowerNameBn;
      const crossName1 = lowerNameBn && a.name && a.name.trim().toLowerCase() === lowerNameBn;
      const crossName2 = a.name_bn && a.name_bn.trim().toLowerCase() === lowerName;
      return sameName || sameNameBn || crossName1 || crossName2;
    });

    if (isDuplicate) {
      toast.error('এই নামের লেখক ইতিমধ্যে তালিকায় রয়েছে!');
      return;
    }

    const data = {
      name: trimmedName,
      name_bn: trimmedNameBn || null,
      bio: bio || null,
      birth_year: birthYear ? parseInt(birthYear) : null,
      death_year: deathYear ? parseInt(deathYear) : null,
      nationality: nationality || null,
    };

    if (editingId) {
      const { error } = await supabase.from('authors').update(data).eq('id', editingId);
      if (error) {
        if (error.message?.includes('UNIQUE') || error.message?.includes('unique')) {
          toast.error('এই নামের লেখক ইতিমধ্যে তালিকায় রয়েছে!');
        } else {
          toast.error('আপডেট ব্যর্থ');
        }
        return;
      }
      toast.success('লেখক আপডেট হয়েছে ✅');
    } else {
      const { error } = await supabase.from('authors').insert(data);
      if (error) {
        if (error.message?.includes('UNIQUE') || error.message?.includes('unique')) {
          toast.error('এই নামের লেখক ইতিমধ্যে তালিকায় রয়েছে!');
        } else {
          toast.error('যোগ করতে ব্যর্থ');
        }
        return;
      }
      toast.success('লেখক যোগ হয়েছে ✅');
    }
    setShowModal(false); resetForm(); fetchAuthors();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('authors').delete().eq('id', deleteId);
    if (error) toast.error('মুছতে পারা যায়নি'); else { toast.success('লেখক মুছে ফেলা হয়েছে'); fetchAuthors(); }
    setDeleteId(null);
  };

  const filtered = authors.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.name_bn?.toLowerCase().includes(q);
  });

  return (
    <>
      <div className="page-header">
        <h2>✍️ লেখক ({filtered.length})</h2>
        <button className="btn btn-primary" onClick={openAdd}>➕ নতুন লেখক</button>
      </div>
      <div className="page-body">
        <div className="search-bar" style={{ marginBottom: '16px', maxWidth: '100%' }}>
          <span className="search-icon">🔍</span>
          <input placeholder="লেখক খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? <div className="loading-inline"><div className="spinner" /></div> : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">✍️</div><h3>কোনো লেখক নেই</h3><p>নতুন লেখক যোগ করুন</p></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>নাম</th><th>বাংলা নাম</th><th>জাতীয়তা</th><th>জন্ম</th><th>মৃত্যু</th><th style={{ textAlign: 'right' }}>অ্যাকশন</th></tr></thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 500 }}>{a.name}</td>
                    <td>{a.name_bn || '—'}</td>
                    <td>{a.nationality || '—'}</td>
                    <td>{a.birth_year || '—'}</td>
                    <td>{a.death_year || '—'}</td>
                    <td><div className="actions">
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(a)}>✏️</button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteId(a.id)}>🗑️</button>
                    </div></td>
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
              <h3>{editingId ? '✏️ লেখক সম্পাদনা' : '➕ নতুন লেখক'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group"><label className="form-label">নাম (English) *</label><input className="form-input" value={name} onChange={e => setName(e.target.value)} required /></div>
                  <div className="form-group"><label className="form-label">বাংলা নাম</label><input className="form-input" value={nameBn} onChange={e => setNameBn(e.target.value)} /></div>
                </div>
                <div className="form-group"><label className="form-label">জীবনী</label><textarea className="form-textarea" value={bio} onChange={e => setBio(e.target.value)} /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">জন্ম সাল</label><input className="form-input" type="number" value={birthYear} onChange={e => setBirthYear(e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">মৃত্যু সাল</label><input className="form-input" type="number" value={deathYear} onChange={e => setDeathYear(e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">জাতীয়তা</label><input className="form-input" value={nationality} onChange={e => setNationality(e.target.value)} /></div>
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

      {deleteId && (
        <div className="confirm-overlay" onClick={() => setDeleteId(null)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">⚠️</div><h3>মুছে ফেলবেন?</h3><p>এই লেখক মুছে যাবে।</p>
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
