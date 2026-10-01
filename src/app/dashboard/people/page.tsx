'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Borrower, LendingRecord } from '@/lib/types';
import toast from 'react-hot-toast';

export default function PeoplePage() {
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Borrower | null>(null);
  const [personLendings, setPersonLendings] = useState<LendingRecord[]>([]);
  const supabase = createClient();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('borrowers').select('*').order('name');
    setBorrowers(data || []);
    setLoading(false);
  };

  const resetForm = () => { setName(''); setPhone(''); setEmail(''); setAddress(''); setNotes(''); setEditingId(null); };
  const openAdd = () => { resetForm(); setShowModal(true); };
  const openEdit = (b: Borrower) => { setEditingId(b.id); setName(b.name); setPhone(b.phone || ''); setEmail(b.email || ''); setAddress(b.address || ''); setNotes(b.notes || ''); setShowModal(true); };

  const viewPerson = async (b: Borrower) => {
    setSelectedPerson(b);
    const { data } = await supabase.from('lending_records').select('*, book:books(id, title)').eq('borrower_id', b.id).order('date_lent', { ascending: false });
    setPersonLendings(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('নাম লিখুন'); return; }
    const data = { name: name.trim(), phone: phone || null, email: email || null, address: address || null, notes: notes || null };
    if (editingId) {
      const { error } = await supabase.from('borrowers').update(data).eq('id', editingId);
      if (error) toast.error('ব্যর্থ'); else toast.success('আপডেট হয়েছে ✅');
    } else {
      const { error } = await supabase.from('borrowers').insert(data);
      if (error) toast.error('ব্যর্থ'); else toast.success('যোগ হয়েছে ✅');
    }
    setShowModal(false); resetForm(); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('borrowers').delete().eq('id', deleteId);
    if (error) toast.error('মুছতে পারা যায়নি'); else { toast.success('মুছে ফেলা হয়েছে'); fetchData(); }
    setDeleteId(null);
  };

  return (
    <>
      <div className="page-header"><h2>👥 মানুষ ({borrowers.length})</h2><button className="btn btn-primary" onClick={openAdd}>➕ নতুন ব্যক্তি</button></div>
      <div className="page-body">
        {loading ? <div className="loading-inline"><div className="spinner" /></div> : borrowers.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">👥</div><h3>কেউ নেই</h3><p>যাদের বই ধার দেন তাদের যোগ করুন</p></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {borrowers.map(b => (
              <div key={b.id} className="card" style={{ padding: '20px', cursor: 'pointer' }} onClick={() => viewPerson(b)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--forest-green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                    {b.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{b.name}</div>
                    {b.phone && <div className="text-xs text-muted">{b.phone}</div>}
                  </div>
                  <div className="actions" onClick={e => e.stopPropagation()}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(b)}>✏️</button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteId(b.id)}>🗑️</button>
                  </div>
                </div>
                {b.email && <div className="text-xs text-muted">📧 {b.email}</div>}
                {b.notes && <div className="text-xs text-muted mt-2">📝 {b.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Person Detail Modal */}
      {selectedPerson && (
        <div className="modal-overlay" onClick={() => setSelectedPerson(null)}><div className="modal modal-lg" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>👤 {selectedPerson.name}</h3><button className="btn btn-ghost btn-icon" onClick={() => setSelectedPerson(null)}>✕</button></div>
          <div className="modal-body">
            <div style={{ marginBottom: '16px' }}>
              {selectedPerson.phone && <p>📱 {selectedPerson.phone}</p>}
              {selectedPerson.email && <p>📧 {selectedPerson.email}</p>}
              {selectedPerson.address && <p>📍 {selectedPerson.address}</p>}
            </div>
            <h4 style={{ marginBottom: '12px' }}>📚 ধার নেওয়া বই</h4>
            {personLendings.length === 0 ? <p className="text-muted">কোনো রেকর্ড নেই</p> : (
              <div className="table-container"><table className="table"><thead><tr><th>বই</th><th>তারিখ</th><th>ফেরত</th><th>অবস্থা</th></tr></thead><tbody>
                {personLendings.map(l => (
                  <tr key={l.id}><td>{l.book?.title}</td><td>{l.date_lent}</td><td>{l.date_returned || '—'}</td>
                    <td>{l.is_returned ? <span className="badge badge-green">✅ ফেরত</span> : <span className="badge badge-yellow">📤 ধার</span>}</td></tr>
                ))}
              </tbody></table></div>
            )}
          </div>
        </div></div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>{editingId ? '✏️ সম্পাদনা' : '➕ নতুন ব্যক্তি'}</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button></div>
          <form onSubmit={handleSubmit}><div className="modal-body">
            <div className="form-group"><label className="form-label">নাম *</label><input className="form-input" value={name} onChange={e => setName(e.target.value)} required /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">ফোন</label><input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">ইমেইল</label><input className="form-input" value={email} onChange={e => setEmail(e.target.value)} /></div>
            </div>
            <div className="form-group"><label className="form-label">ঠিকানা</label><input className="form-input" value={address} onChange={e => setAddress(e.target.value)} /></div>
            <div className="form-group"><label className="form-label">নোট</label><textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} /></div>
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>বাতিল</button><button type="submit" className="btn btn-primary">{editingId ? '✅ আপডেট' : '➕ যোগ'}</button></div></form>
        </div></div>
      )}

      {deleteId && (<div className="confirm-overlay" onClick={() => setDeleteId(null)}><div className="confirm-dialog" onClick={e => e.stopPropagation()}><div className="confirm-icon">⚠️</div><h3>মুছে ফেলবেন?</h3><div className="confirm-actions"><button className="btn btn-secondary" onClick={() => setDeleteId(null)}>বাতিল</button><button className="btn btn-danger" onClick={handleDelete}>🗑️ মুছুন</button></div></div></div>)}
    </>
  );
}
