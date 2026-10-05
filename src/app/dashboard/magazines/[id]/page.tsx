'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { bnToEnNumber, enToBnNumber, getOwnerLabel, formatDateBn } from '@/lib/types';
import { use } from 'react';
import { Edit2, Trash2 } from 'lucide-react';

export default function ViewMagazinePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const resolvedParams = use(params);
  
  const [loading, setLoading] = useState(true);
  const [magazine, setMagazine] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [newMonth, setNewMonth] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newVolume, setNewVolume] = useState('');
  const [newStatus, setNewStatus] = useState('আছে');
  const [newCopies, setNewCopies] = useState('1');
  const [addingIssue, setAddingIssue] = useState(false);
  
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [editIssueForm, setEditIssueForm] = useState({ month: '', year: '', volume: '', status: 'আছে', copies: '1' });

  const handleYearInput = (inputVal: string, setter: (val: string) => void) => {
    const englishVal = bnToEnNumber(inputVal);
    const cleanVal = englishVal.replace(/\D/g, '');
    const truncated = cleanVal.slice(0, 4);
    setter(truncated);
  };

  const handleCopiesInput = (inputVal: string, setter: (val: string) => void) => {
    const englishVal = bnToEnNumber(inputVal);
    const cleanVal = englishVal.replace(/\D/g, '');
    setter(cleanVal);
  };

  useEffect(() => {
    async function fetchMagazineData() {
      try {
        const { data: magData, error: magErr } = await supabase.from('magazines').select('*').eq('id', resolvedParams.id).single();
        if (magErr) throw magErr;
        
        if (magData) {
          setMagazine(magData);
          const { data: issuesData, error: issuesErr } = await supabase.from('magazine_issues').select('*').eq('magazine_id', resolvedParams.id).order('issue_year', { ascending: false });
          if (!issuesErr && issuesData) {
            setIssues(issuesData);
          }
        }
      } catch (err: any) {
        toast.error('তথ্য লোড করতে সমস্যা: ' + err.message);
        router.push('/dashboard/magazines');
      } finally {
        setLoading(false);
      }
    }
    
    fetchMagazineData();
  }, [resolvedParams.id, router]);

  const handleAddIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magazine || !user) return;
    
    setAddingIssue(true);
    try {
      const issueData = {
        magazine_id: magazine.id,
        issue_month: newMonth.trim() || null,
        issue_year: newYear ? parseInt(bnToEnNumber(newYear)) : null,
        volume: newVolume.trim() || null,
        status: newStatus,
        copies: newCopies ? parseInt(bnToEnNumber(newCopies)) : 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const { data, error } = await supabase.from('magazine_issues').insert(issueData).select().single();
      if (error) throw error;
      
      if (data) {
        setIssues([data, ...issues].sort((a, b) => (b.issue_year || 0) - (a.issue_year || 0)));
        setNewMonth('');
        setNewYear('');
        setNewVolume('');
        setNewCopies('1');
        toast.success('নতুন ইস্যু যোগ করা হয়েছে! 📰');
      }
    } catch (err: any) {
      toast.error('ইস্যু যোগ করতে সমস্যা: ' + err.message);
    } finally {
      setAddingIssue(false);
    }
  };

  const startEditingIssue = (issue: any) => {
    setEditingIssueId(issue.id);
    setEditIssueForm({
      month: issue.issue_month || '',
      year: issue.issue_year ? issue.issue_year.toString() : '',
      volume: issue.volume || '',
      status: issue.status || 'আছে',
      copies: issue.copies ? issue.copies.toString() : '1'
    });
  };

  const handleSaveIssueEdit = async (issueId: string) => {
    try {
      const { error } = await supabase.from('magazine_issues').update({
        issue_month: editIssueForm.month.trim() || null,
        issue_year: editIssueForm.year ? parseInt(bnToEnNumber(editIssueForm.year)) : null,
        volume: editIssueForm.volume.trim() || null,
        status: editIssueForm.status,
        copies: parseInt(bnToEnNumber(editIssueForm.copies)) || 1,
        updated_at: new Date().toISOString()
      }).eq('id', issueId);

      if (error) throw error;
      
      setIssues(issues.map(issue => 
        issue.id === issueId ? {
          ...issue,
          issue_month: editIssueForm.month.trim() || null,
          issue_year: editIssueForm.year ? parseInt(bnToEnNumber(editIssueForm.year)) : null,
          volume: editIssueForm.volume.trim() || null,
          status: editIssueForm.status,
          copies: parseInt(bnToEnNumber(editIssueForm.copies)) || 1,
        } : issue
      ));
      setEditingIssueId(null);
      toast.success('ইস্যু আপডেট হয়েছে!');
    } catch(err: any) {
      toast.error('সমস্যা হয়েছে: ' + err.message);
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই ইস্যুটি মুছে ফেলতে চান?')) return;
    try {
      const { error } = await supabase.from('magazine_issues').delete().eq('id', issueId);
      if (error) throw error;
      setIssues(issues.filter(i => i.id !== issueId));
      toast.success('মুছে ফেলা হয়েছে!');
    } catch (err: any) {
      toast.error('সমস্যা হয়েছে: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!magazine || !user) return;
    if (magazine.owner !== user.id) return;
    
    if (!confirm(`আপনি কি নিশ্চিত যে আপনি "${magazine.title}" ম্যাগাজিনটি মুছে ফেলতে চান?`)) {
      return;
    }

    try {
      const { error } = await supabase.from('magazines').delete().eq('id', magazine.id);
      if (error) throw error;
      
      toast.success('ম্যাগাজিন মুছে ফেলা হয়েছে');
      
      await supabase.from('activity_log').insert({
        user_id: user.id,
        action: 'magazine_deleted',
        entity_type: 'magazine',
        entity_id: magazine.id,
        entity_name: magazine.title,
        details: { owner: user.id },
      });
      
      router.push('/dashboard/magazines');
    } catch (err: any) {
      toast.error('ম্যাগাজিন মুছতে সমস্যা: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="page-body">
        <div className="loading-state">
          <div className="spinner" />
          <p>তথ্য লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!magazine) return null;

  return (
    <>
      <div className="page-header">
        <h2>📰 ম্যাগাজিনের বিস্তারিত</h2>
        {user?.id === magazine.owner && (
          <div className="page-header-actions" style={{ display: 'flex', gap: '8px' }}>
            <Link href={`/dashboard/magazines/${magazine.id}/edit`} className="btn btn-secondary">
              <Edit2 size={16} /> এডিট
            </Link>
            <button onClick={handleDelete} className="btn btn-danger" style={{ backgroundColor: '#fee2e2', color: '#ef4444', borderColor: '#fca5a5' }}>
              <Trash2 size={16} /> ডিলিট
            </button>
          </div>
        )}
      </div>

      <datalist id="months-datalist">
        <option value="জানুয়ারি" />
        <option value="ফেব্রুয়ারি" />
        <option value="মার্চ" />
        <option value="এপ্রিল" />
        <option value="মে" />
        <option value="জুন" />
        <option value="জুলাই" />
        <option value="আগস্ট" />
        <option value="সেপ্টেম্বর" />
        <option value="অক্টোবর" />
        <option value="নভেম্বর" />
        <option value="ডিসেম্বর" />
      </datalist>

      <datalist id="copies-datalist">
        <option value="১" />
        <option value="২" />
        <option value="৩" />
        <option value="৪" />
        <option value="৫" />
      </datalist>

      <div className="page-body">
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>{magazine.title}</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              
              <div className="info-group">
                <span style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>মালিক</span>
                <span className="badge badge-gray" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  👤 {getOwnerLabel(magazine.owner)}
                  {user?.id === magazine.owner && (
                    <span style={{ color: '#10b981', fontSize: '0.8rem' }}> (✅ আপনি)</span>
                  )}
                </span>
              </div>



              <div className="info-group">
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>মোট ইস্যু/সংখ্যা</span>
                <span style={{ fontWeight: 600, fontSize: '1.3rem', color: 'var(--accent)', fontFamily: 'var(--font-serif)' }}>{enToBnNumber(issues.length.toString())} টি</span>
              </div>
            </div>
            
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              সিরিজ তৈরি হয়েছে: {formatDateBn(magazine.created_at)}
            </div>
          </div>
        </div>

        {/* Issues List Section */}
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <h3>📚 ইস্যু তালিকা</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {issues.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>সাল ও মাস</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>সংখ্যা (Volume)</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>কপি</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>অবস্থা</th>
                      {user?.id === magazine.owner && (
                        <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'right' }}>অ্যাকশন</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map(issue => (
                      <tr key={issue.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        {editingIssueId === issue.id ? (
                          <>
                            <td style={{ padding: '8px 16px' }}>
                              <input className="form-input font-serif" style={{ width: '80px', marginBottom: '4px', padding: '4px 8px', fontFamily: 'var(--font-serif)' }} placeholder="সাল" value={enToBnNumber(editIssueForm.year)} onChange={e => handleYearInput(e.target.value, val => setEditIssueForm({...editIssueForm, year: val}))} />
                              <input className="form-input" style={{ width: '100px', padding: '4px 8px' }} placeholder="মাস" value={editIssueForm.month} onChange={e => setEditIssueForm({...editIssueForm, month: e.target.value})} list="months-datalist" />
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <input className="form-input" style={{ width: '120px', padding: '4px 8px' }} placeholder="সংখ্যা" value={editIssueForm.volume} onChange={e => setEditIssueForm({...editIssueForm, volume: e.target.value})} />
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <input className="form-input font-serif" style={{ width: '60px', padding: '4px 8px', fontFamily: 'var(--font-serif)' }} type="text" inputMode="numeric" value={enToBnNumber(editIssueForm.copies)} onChange={e => handleCopiesInput(e.target.value, val => setEditIssueForm({...editIssueForm, copies: val}))} list="copies-datalist" />
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <select className="form-input" style={{ padding: '4px 8px' }} value={editIssueForm.status} onChange={e => setEditIssueForm({...editIssueForm, status: e.target.value})}>
                                <option value="আছে">আছে</option>
                                <option value="নাই">নাই</option>
                                <option value="ধার দেওয়া হয়েছে">ধার দেওয়া</option>
                                <option value="হারিয়ে গেছে">হারানো</option>
                              </select>
                            </td>
                            <td style={{ padding: '8px 16px', textAlign: 'right' }}>
                              <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.8rem', marginRight: '4px' }} onClick={() => handleSaveIssueEdit(issue.id)}>সেভ</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => setEditingIssueId(null)}>বাতিল</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontWeight: 600, fontFamily: 'var(--font-serif)', fontSize: '1.05rem' }}>{issue.issue_year ? enToBnNumber(issue.issue_year.toString()) : '-'}</div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{issue.issue_month || '-'}</div>
                            </td>
                            <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{issue.volume || '-'}</td>
                            <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'var(--font-serif)', fontSize: '1.1rem' }}>
                              {enToBnNumber(issue.copies?.toString() || '1')} টি
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span className={`status-badge status-${issue.status === 'আছে' ? 'owned' : 'missing'}`}>
                                {issue.status}
                              </span>
                            </td>
                            {user?.id === magazine.owner && (
                              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem', marginRight: '4px' }} onClick={() => startEditingIssue(issue)}>এডিট</button>
                                <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.8rem', backgroundColor: '#fee2e2', color: '#ef4444', borderColor: '#fca5a5' }} onClick={() => handleDeleteIssue(issue.id)}>মুছুন</button>
                              </td>
                            )}
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📂</span>
                <p>এখনো কোনো ইস্যু যোগ করা হয়নি।</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Issue Form */}
        {user?.id === magazine.owner && (
          <div className="card" style={{ marginTop: '24px' }}>
            <div className="card-header" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>➕ নতুন ইস্যু যোগ করুন</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleAddIssue}>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '16px', alignItems: 'end' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>মাস</label>
                    <input 
                      className="form-input" 
                      value={newMonth} 
                      onChange={e => setNewMonth(e.target.value)} 
                      placeholder="যেমন: জুন" 
                      list="months-datalist"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>সাল *</label>
                    <input 
                      className="form-input font-serif" 
                      type="text"
                      inputMode="numeric"
                      value={enToBnNumber(newYear)} 
                      onChange={e => handleYearInput(e.target.value, setNewYear)} 
                      placeholder="যেমন: ২০২৪"
                      style={{ fontFamily: 'var(--font-serif)' }}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>সংখ্যা (Volume)</label>
                    <input 
                      className="form-input" 
                      value={newVolume} 
                      onChange={e => setNewVolume(e.target.value)} 
                      placeholder="যেমন: ২য় বর্ষ, ১ম সংখ্যা" 
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>কপি</label>
                    <input 
                      className="form-input font-serif" 
                      type="text"
                      inputMode="numeric"
                      value={enToBnNumber(newCopies)} 
                      onChange={e => handleCopiesInput(e.target.value, setNewCopies)} 
                      placeholder="যেমন: ১" 
                      list="copies-datalist"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>অবস্থা</label>
                    <select 
                      className="form-input"
                      value={newStatus}
                      onChange={e => setNewStatus(e.target.value)}
                    >
                      <option value="আছে">আছে</option>
                      <option value="নাই">নাই</option>
                      <option value="ধার দেওয়া হয়েছে">ধার দেওয়া</option>
                      <option value="হারিয়ে গেছে">হারিয়ে গেছে</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={addingIssue}>
                    {addingIssue ? 'যোগ হচ্ছে...' : 'যোগ করুন'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <Link href="/dashboard/magazines" className="btn btn-secondary">
            ← ফিরে যান
          </Link>
        </div>
      </div>
    </>
  );
}
