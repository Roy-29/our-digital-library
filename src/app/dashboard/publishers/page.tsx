'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Publisher, enToBnNumber } from '@/lib/types';
import toast from 'react-hot-toast';

export default function PublishersPage() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState<'view' | 'edit' | 'add'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const supabase = createClient();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() { setLoading(true); const { data } = await supabase.from('publishers').select('*').order('name'); setPublishers(data || []); setLoading(false); }

  const resetForm = () => { setName(''); setAddress(''); setWebsite(''); setPhone(''); setEmail(''); setImageUrl(''); setEditingId(null); };

  const openAdd = () => { resetForm(); setFormMode('add'); setShowModal(true); };
  const openView = (p: Publisher) => { setEditingId(p.id); setName(p.name_bn || p.name); setAddress(p.address || ''); setWebsite(p.website || ''); setPhone(p.phone || ''); setEmail(p.email || ''); setImageUrl(p.image_url || ''); setFormMode('view'); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) { toast.error('নাম লিখুন'); return; }

    const isDuplicate = publishers.some(p => {
      if (editingId && p.id === editingId) return false;
      const lowerName = trimmedName.toLowerCase();
      const sameName = p.name && p.name.trim().toLowerCase() === lowerName;
      const sameNameBn = p.name_bn && p.name_bn.trim().toLowerCase() === lowerName;
      return sameName || sameNameBn;
    });

    if (isDuplicate) {
      toast.error('এই নামের প্রকাশক ইতিমধ্যে তালিকায় রয়েছে!');
      return;
    }

    const data = {
      name: trimmedName,
      name_bn: trimmedName,
      address: address || null,
      website: website || null,
      phone: phone || null,
      email: email || null,
      image_url: imageUrl || null
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
      <div className="page-header"><h2>🏢 প্রকাশক <span style={{ fontFamily: 'var(--font-serif)' }}>({enToBnNumber(filtered.length.toString())})</span></h2><button className="btn btn-primary" onClick={openAdd}>➕ নতুন প্রকাশক</button></div>
      <div className="page-body">
        <div className="search-bar" style={{ marginBottom: '16px', maxWidth: '100%' }}><span className="search-icon">🔍</span><input placeholder="প্রকাশক খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        {loading ? <div className="loading-inline"><div className="spinner" /></div> : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🏢</div><h3>কোনো প্রকাশক নেই</h3></div>
        ) : (
          <div className="table-container"><table className="table"><thead><tr><th>নাম</th><th>ঠিকানা</th><th>ফোন</th></tr></thead><tbody>
            {filtered.map(p => (<tr key={p.id} onClick={() => openView(p)} style={{ cursor: 'pointer' }}>
              <td style={{ fontWeight: 500 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🏢</div>
                  )}
                  <span>{p.name_bn || p.name}</span>
                </div>
              </td>
              <td>{p.address || '—'}</td><td>{p.phone || '—'}</td>
            </tr>))}
          </tbody></table></div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{formMode === 'edit' ? '✏️ সম্পাদনা' : formMode === 'add' ? '➕ নতুন প্রকাশক' : '📖 বিস্তারিত তথ্য'}</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {formMode === 'edit' && (
                <button type="button" className="btn btn-danger" onClick={() => { setShowModal(false); setDeleteId(editingId); }} style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                  🗑️ মুছুন
                </button>
              )}
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
          </div>
          {formMode === 'view' ? (
            <>
              <div className="modal-body">
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '16px' }}>
                  {imageUrl && (
                    <div style={{ flexShrink: 0, width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--border)', background: 'var(--bg-secondary)' }}>
                      <img src={imageUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div className="info-group" style={{ flexGrow: 1 }}><label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>নাম</label><div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div></div>
                </div>
                {address && <div className="info-group" style={{ marginBottom: '16px' }}><label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ঠিকানা</label><div style={{ color: 'var(--text-primary)' }}>{address}</div></div>}
                <div className="form-row" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                  {website && <div className="info-group"><label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ওয়েবসাইট</label><div><a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>{website}</a></div></div>}
                  {phone && <div className="info-group"><label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ফোন</label><div style={{ color: 'var(--text-primary)' }}>{phone}</div></div>}
                  {email && <div className="info-group"><label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ইমেইল</label><div><a href={`mailto:${email}`} style={{ color: 'var(--primary)' }}>{email}</a></div></div>}
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>বন্ধ করুন</button>
                <button type="button" className="btn btn-primary" onClick={() => setFormMode('edit')}>✏️ এডিট করুন</button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit}><div className="modal-body">
              <div className="form-group"><label className="form-label">নাম *</label><input className="form-input" placeholder="প্রকাশকের নাম লিখুন..." value={name} onChange={e => setName(e.target.value)} required autoFocus /></div>
              <div className="form-group">
                <label className="form-label">লোগো / ছবির লিংক (URL)</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <input className="form-input" type="url" placeholder="https://example.com/logo.png" value={imageUrl} onChange={e => setImageUrl(e.target.value)} style={{ flexGrow: 1 }} />
                  {imageUrl && (
                    <div style={{ width: '42px', height: '42px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg-secondary)' }}>
                      <img src={imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} onLoad={(e) => { (e.target as HTMLImageElement).style.display = 'block'; }} />
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group"><label className="form-label">ঠিকানা</label><input className="form-input" value={address} onChange={e => setAddress(e.target.value)} /></div>
              <div className="form-row"><div className="form-group"><label className="form-label">ওয়েবসাইট</label><input className="form-input" value={website} onChange={e => setWebsite(e.target.value)} /></div><div className="form-group"><label className="form-label">ফোন</label><input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} /></div><div className="form-group"><label className="form-label">ইমেইল</label><input className="form-input" value={email} onChange={e => setEmail(e.target.value)} /></div></div>
            </div><div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>বাতিল</button>
                <button type="submit" className="btn btn-primary">{formMode === 'edit' ? '✅ আপডেট' : '➕ যোগ'}</button>
              </div>
            </div></form>
          )}
        </div></div>
      )}

      {deleteId && (<div className="confirm-overlay" onClick={() => setDeleteId(null)}><div className="confirm-dialog" onClick={e => e.stopPropagation()}><div className="confirm-icon">⚠️</div><h3>মুছে ফেলবেন?</h3><p>এই প্রকাশক মুছে যাবে।</p><div className="confirm-actions"><button className="btn btn-secondary" onClick={() => setDeleteId(null)}>বাতিল</button><button className="btn btn-danger" onClick={handleDelete}>🗑️ মুছুন</button></div></div></div>)}
    </>
  );
}
