'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Publisher } from '@/lib/types';
import toast from 'react-hot-toast';

export default function PublishersPage() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const supabase = createClient();

  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => { setLoading(true); const { data } = await supabase.from('publishers').select('*').order('name'); setPublishers(data || []); setLoading(false); };

  const resetForm = () => { setName(''); setNameBn(''); setAddress(''); setWebsite(''); setPhone(''); setEmail(''); setEditingId(null); };

  const openAdd = () => { resetForm(); setShowModal(true); };
  const openEdit = (p: Publisher) => { setEditingId(p.id); setName(p.name); setNameBn(p.name_bn || ''); setAddress(p.address || ''); setWebsite(p.website || ''); setPhone(p.phone || ''); setEmail(p.email || ''); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedNameBn = nameBn.trim();
    if (!trimmedName) { toast.error('নাম লিখুন'); return; }

    const isDuplicate = publishers.some(p => {
      if (editingId && p.id === editingId) return false;
      const lowerName = trimmedName.toLowerCase();
      const lowerNameBn = trimmedNameBn.toLowerCase();
      const sameName = p.name && p.name.trim().toLowerCase() === lowerName;
      const sameNameBn = lowerNameBn && p.name_bn && p.name_bn.trim().toLowerCase() === lowerNameBn;
      const crossName1 = lowerNameBn && p.name && p.name.trim().toLowerCase() === lowerNameBn;
      const crossName2 = p.name_bn && p.name_bn.trim().toLowerCase() === lowerName;
      return sameName || sameNameBn || crossName1 || crossName2;
    });

    if (isDuplicate) {
      toast.error('এই নামের প্রকাশক ইতিমধ্যে তালিকায় রয়েছে!');
      return;
    }

    const data = {
      name: trimmedName,
      name_bn: trimmedNameBn || null,
      address: address || null,
      website: website || null,
      phone: phone || null,
      email: email || null
    };

    if (editingId) {
      const { error } = await supabase.from('publishers').update(data).eq('id', editingId);
      if (error) {
        if (error.message?.includes('UNIQUE') || error.message?.includes('unique')) {
          toast.error('এই নামের প্রকাশক ইতিমধ্যে তালিকায় রয়েছে!');
        } else {
          toast.error('আপডেট ব্যর্থ');
        }
        return;
      }
      toast.success('প্রকাশক আপডেট হয়েছে ✅');
    } else {
      const { error } = await supabase.from('publishers').insert(data);
      if (error) {
        if (error.message?.includes('UNIQUE') || error.message?.includes('unique')) {
          toast.error('এই নামের প্রকাশক ইতিমধ্যে তালিকায় রয়েছে!');
        } else {
          toast.error('যোগ করতে ব্যর্থ');
        }
        return;
      }
      toast.success('প্রকাশক যোগ হয়েছে ✅');
    }
    setShowModal(false); resetForm(); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('publishers').delete().eq('id', deleteId);
    if (error) toast.error('মুছতে পারা যায়নি'); else { toast.success('মুছে ফেলা হয়েছে'); fetchData(); }
    setDeleteId(null);
  };

  const filtered = publishers.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.name_bn?.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="page-header"><h2>🏢 প্রকাশক ({filtered.length})</h2><button className="btn btn-primary" onClick={openAdd}>➕ নতুন প্রকাশক</button></div>
      <div className="page-body">
        <div className="search-bar" style={{ marginBottom: '16px', maxWidth: '100%' }}><span className="search-icon">🔍</span><input placeholder="প্রকাশক খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        {loading ? <div className="loading-inline"><div className="spinner" /></div> : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🏢</div><h3>কোনো প্রকাশক নেই</h3></div>
        ) : (
          <div className="table-container"><table className="table"><thead><tr><th>নাম</th><th>বাংলা নাম</th><th>ঠিকানা</th><th>ফোন</th><th style={{ textAlign: 'right' }}>অ্যাকশন</th></tr></thead><tbody>
            {filtered.map(p => (<tr key={p.id}><td style={{ fontWeight: 500 }}>{p.name}</td><td>{p.name_bn || '—'}</td><td>{p.address || '—'}</td><td>{p.phone || '—'}</td><td><div className="actions"><button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(p)}>✏️</button><button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteId(p.id)}>🗑️</button></div></td></tr>))}
          </tbody></table></div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>{editingId ? '✏️ সম্পাদনা' : '➕ নতুন প্রকাশক'}</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button></div>
          <form onSubmit={handleSubmit}><div className="modal-body">
            <div className="form-row"><div className="form-group"><label className="form-label">নাম *</label><input className="form-input" value={name} onChange={e => setName(e.target.value)} required /></div><div className="form-group"><label className="form-label">বাংলা নাম</label><input className="form-input" value={nameBn} onChange={e => setNameBn(e.target.value)} /></div></div>
            <div className="form-group"><label className="form-label">ঠিকানা</label><input className="form-input" value={address} onChange={e => setAddress(e.target.value)} /></div>
            <div className="form-row"><div className="form-group"><label className="form-label">ওয়েবসাইট</label><input className="form-input" value={website} onChange={e => setWebsite(e.target.value)} /></div><div className="form-group"><label className="form-label">ফোন</label><input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} /></div><div className="form-group"><label className="form-label">ইমেইল</label><input className="form-input" value={email} onChange={e => setEmail(e.target.value)} /></div></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>বাতিল</button><button type="submit" className="btn btn-primary">{editingId ? '✅ আপডেট' : '➕ যোগ'}</button></div></form>
        </div></div>
      )}

      {deleteId && (<div className="confirm-overlay" onClick={() => setDeleteId(null)}><div className="confirm-dialog" onClick={e => e.stopPropagation()}><div className="confirm-icon">⚠️</div><h3>মুছে ফেলবেন?</h3><p>এই প্রকাশক মুছে যাবে।</p><div className="confirm-actions"><button className="btn btn-secondary" onClick={() => setDeleteId(null)}>বাতিল</button><button className="btn btn-danger" onClick={handleDelete}>🗑️ মুছুন</button></div></div></div>)}
    </>
  );
}
