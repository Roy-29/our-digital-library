'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Room, Shelf, Rack, Book } from '@/lib/types';
import toast from 'react-hot-toast';

export default function LocationsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'room' | 'shelf' | 'rack'>('room');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'room' | 'shelf' | 'rack'>('room');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [selectedShelf, setSelectedShelf] = useState<string>('');
  const [shelfBooks, setShelfBooks] = useState<any[]>([]);
  const [showBooks, setShowBooks] = useState(false);
  const supabase = createClient();

  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [capacity, setCapacity] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [r, s, rk] = await Promise.all([
      supabase.from('rooms').select('*').order('name'),
      supabase.from('shelves').select('*, room:rooms(*)').order('name'),
      supabase.from('racks').select('*, shelf:shelves(*, room:rooms(*))').order('position_order'),
    ]);
    setRooms(r.data || []);
    setShelves(s.data || []);
    setRacks(rk.data || []);
    setLoading(false);
  };

  const resetForm = () => { setName(''); setNameBn(''); setDescription(''); setParentId(''); setCapacity(''); setEditingId(null); };

  const openAdd = (type: 'room' | 'shelf' | 'rack') => { resetForm(); setModalType(type); setShowModal(true); };

  const viewShelfBooks = async (shelfId: string, shelfName: string) => {
    const { data } = await supabase.from('books').select('id, title, author:authors!books_author_id_fkey(name, name_bn), status').eq('shelf_id', shelfId).order('title');
    setShelfBooks(data || []);
    setSelectedShelf(shelfName);
    setShowBooks(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('নাম লিখুন'); return; }

    const table = modalType === 'room' ? 'rooms' : modalType === 'shelf' ? 'shelves' : 'racks';

    let data: Record<string, unknown> = { name: name.trim(), name_bn: nameBn || null };
    if (modalType === 'room') data.description = description || null;
    if (modalType === 'shelf') { data.room_id = parentId; data.description = description || null; data.capacity = capacity ? parseInt(capacity) : null; }
    if (modalType === 'rack') { data.shelf_id = parentId; data.position_order = capacity ? parseInt(capacity) : 0; }

    if (editingId) {
      const { error } = await supabase.from(table).update(data).eq('id', editingId);
      if (error) toast.error('ব্যর্থ: ' + error.message); else toast.success('আপডেট হয়েছে ✅');
    } else {
      const { error } = await supabase.from(table).insert(data);
      if (error) toast.error('ব্যর্থ: ' + error.message); else toast.success('যোগ হয়েছে ✅');
    }
    setShowModal(false); resetForm(); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const table = deleteType === 'room' ? 'rooms' : deleteType === 'shelf' ? 'shelves' : 'racks';
    const { error } = await supabase.from(table).delete().eq('id', deleteId);
    if (error) toast.error('মুছতে পারা যায়নি'); else { toast.success('মুছে ফেলা হয়েছে'); fetchData(); }
    setDeleteId(null);
  };

  return (
    <>
      <div className="page-header"><h2>📍 কোথায় রাখা আছে</h2>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={() => openAdd('room')}>🏠 ঘর যোগ</button>
          <button className="btn btn-secondary" onClick={() => openAdd('shelf')}>📚 শেলফ যোগ</button>
          <button className="btn btn-secondary" onClick={() => openAdd('rack')}>📦 র‍্যাক যোগ</button>
        </div>
      </div>
      <div className="page-body">
        {loading ? <div className="loading-inline"><div className="spinner" /></div> : rooms.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📍</div><h3>কোনো ঘর নেই</h3><p>প্রথমে একটি ঘর যোগ করুন</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {rooms.map(room => {
              const roomShelves = shelves.filter(s => s.room_id === room.id);
              return (
                <div key={room.id} className="card">
                  <div className="card-header">
                    <h3>🏠 {room.name_bn || room.name}</h3>
                    <div className="actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => { setDeleteId(room.id); setDeleteType('room'); }}>🗑️</button>
                    </div>
                  </div>
                  <div className="card-body">
                    {roomShelves.length === 0 ? <p className="text-muted">কোনো শেলফ নেই</p> : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                        {roomShelves.map(shelf => {
                          const shelfRacks = racks.filter(r => r.shelf_id === shelf.id);
                          return (
                            <div key={shelf.id} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '14px', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => viewShelfBooks(shelf.id, shelf.name_bn || shelf.name)}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <strong>📚 {shelf.name_bn || shelf.name}</strong>
                                <div className="actions" onClick={e => e.stopPropagation()}>
                                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setDeleteId(shelf.id); setDeleteType('shelf'); }}>🗑️</button>
                                </div>
                              </div>
                              {shelf.capacity && <div className="text-xs text-muted">ধারণক্ষমতা: {shelf.capacity}</div>}
                              {shelfRacks.length > 0 && (
                                <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {shelfRacks.map(rack => (
                                    <span key={rack.id} className="badge badge-gray">📦 {rack.name_bn || rack.name}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Books in shelf modal */}
      {showBooks && (
        <div className="modal-overlay" onClick={() => setShowBooks(false)}><div className="modal modal-lg" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>📚 {selectedShelf}-এর বই ({shelfBooks.length})</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowBooks(false)}>✕</button></div>
          <div className="modal-body">
            {shelfBooks.length === 0 ? <p className="text-muted">এই শেলফে কোনো বই নেই</p> : (
              <div className="table-container"><table className="table"><thead><tr><th>বই</th><th>লেখক</th><th>স্ট্যাটাস</th></tr></thead><tbody>
                {shelfBooks.map((b: any) => (<tr key={b.id}><td style={{ fontWeight: 500 }}>{b.title}</td><td>{b.author?.name_bn || b.author?.name || '—'}</td><td>{b.status}</td></tr>))}
              </tbody></table></div>
            )}
          </div>
        </div></div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>{editingId ? '✏️ সম্পাদনা' : `➕ নতুন ${modalType === 'room' ? 'ঘর' : modalType === 'shelf' ? 'শেলফ' : 'র‍্যাক'}`}</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button></div>
          <form onSubmit={handleSubmit}><div className="modal-body">
            <div className="form-row">
              <div className="form-group"><label className="form-label">নাম *</label><input className="form-input" value={name} onChange={e => setName(e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">বাংলা নাম</label><input className="form-input" value={nameBn} onChange={e => setNameBn(e.target.value)} /></div>
            </div>
            {modalType === 'shelf' && (
              <div className="form-row">
                <div className="form-group"><label className="form-label">ঘর *</label>
                  <select className="form-select" value={parentId} onChange={e => setParentId(e.target.value)} required>
                    <option value="">— ঘর নির্বাচন —</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name_bn || r.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">ধারণক্ষমতা</label><input className="form-input" type="number" value={capacity} onChange={e => setCapacity(e.target.value)} /></div>
              </div>
            )}
            {modalType === 'rack' && (
              <div className="form-group"><label className="form-label">শেলফ *</label>
                <select className="form-select" value={parentId} onChange={e => setParentId(e.target.value)} required>
                  <option value="">— শেলফ নির্বাচন —</option>
                  {shelves.map(s => <option key={s.id} value={s.id}>{(s as any).room?.name ? `${(s as any).room.name} → ` : ''}{s.name_bn || s.name}</option>)}
                </select>
              </div>
            )}
            {modalType === 'room' && (
              <div className="form-group"><label className="form-label">বিবরণ</label><textarea className="form-textarea" value={description} onChange={e => setDescription(e.target.value)} /></div>
            )}
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>বাতিল</button><button type="submit" className="btn btn-primary">{editingId ? '✅ আপডেট' : '➕ যোগ'}</button></div></form>
        </div></div>
      )}

      {deleteId && (<div className="confirm-overlay" onClick={() => setDeleteId(null)}><div className="confirm-dialog" onClick={e => e.stopPropagation()}><div className="confirm-icon">⚠️</div><h3>মুছে ফেলবেন?</h3><p>এটি মুছে ফেললে সংশ্লিষ্ট সব তথ্য মুছে যাবে।</p><div className="confirm-actions"><button className="btn btn-secondary" onClick={() => setDeleteId(null)}>বাতিল</button><button className="btn btn-danger" onClick={handleDelete}>🗑️ মুছুন</button></div></div></div>)}
    </>
  );
}
