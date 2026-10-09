'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { bnToEnNumber, enToBnNumber, getOwnerLabel, formatDateBn } from '@/lib/types';
import { CustomSelect } from '@/components/CustomSelect';
import { CustomCombobox } from '@/components/CustomCombobox';
import { use } from 'react';
import { Edit2, Trash2 } from 'lucide-react';

const MONTH_OPTIONS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const monthOrder: Record<string, number> = {
  'জানুয়ারি': 1, 'জানুয়ারি': 1,
  'ফেব্রুয়ারি': 2, 'ফেব্রুয়ারি': 2,
  'মার্চ': 3,
  'এপ্রিল': 4,
  'মে': 5,
  'জুন': 6,
  'জুলাই': 7,
  'আগস্ট': 8, 'অগাস্ট': 8,
  'সেপ্টেম্বর': 9,
  'অক্টোবর': 10,
  'নভেম্বর': 11,
  'ডিসেম্বর': 12,
  'বৈশাখ': 1,
  'জ্যৈষ্ঠ': 2,
  'আষাঢ়': 3, 'আষাঢ়': 3,
  'শ্রাবণ': 4,
  'ভাদ্র': 5,
  'আশ্বিন': 6,
  'কার্তিক': 7,
  'অগ্রহায়ণ': 8, 'অগ্রহায়ণ': 8,
  'পৌষ': 9,
  'মাঘ': 10,
  'ফাল্গুন': 11,
  'চৈত্র': 12
};

const sortIssuesList = (issuesList: any[]) => {
  return [...issuesList].sort((a, b) => {
    const yearA = a.issue_year || 0;
    const yearB = b.issue_year || 0;
    if (yearA !== yearB) {
      return yearB - yearA; // Descending year
    }
    const monthA = a.issue_month ? (monthOrder[a.issue_month.trim()] || 0) : 0;
    const monthB = b.issue_month ? (monthOrder[b.issue_month.trim()] || 0) : 0;
    
    if (monthA !== monthB) {
      return monthB - monthA; // Descending month
    }
    
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeB - timeA; // Newer first
  });
};

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
  const [isCustomNewCopies, setIsCustomNewCopies] = useState(false);
  const [addingIssue, setAddingIssue] = useState(false);
  const [duplicateIssueConfirm, setDuplicateIssueConfirm] = useState<any>(null);
  
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [deleteIssueId, setDeleteIssueId] = useState<string | null>(null);
  const [editIssueForm, setEditIssueForm] = useState({ month: '', year: '', volume: '', status: 'আছে', copies: '1' });
  const [isCustomEditCopies, setIsCustomEditCopies] = useState(false);

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
          const { data: issuesData, error: issuesErr } = await supabase.from('magazine_issues').select('*').eq('magazine_id', resolvedParams.id);
          if (!issuesErr && issuesData) {
            setIssues(sortIssuesList(issuesData));
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
      const proposedMonth = newMonth.trim() || null;
      const proposedYear = newYear ? parseInt(bnToEnNumber(newYear)) : null;

      const duplicateIssue = issues.find(
        issue => {
          const existingMonth = issue.issue_month?.trim() || null;
          const existingYear = issue.issue_year ? parseInt(bnToEnNumber(issue.issue_year.toString())) : null;
          return existingMonth === proposedMonth && existingYear === proposedYear;
        }
      );

      if (duplicateIssue) {
        setAddingIssue(false);
        setDuplicateIssueConfirm(duplicateIssue);
        return;
      }

      const issueData = {
        magazine_id: magazine.id,
        issue_month: proposedMonth,
        issue_year: proposedYear,
        volume: newVolume.trim() || null,
        status: newStatus,
        copies: newCopies ? parseInt(bnToEnNumber(newCopies)) : 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const { data, error } = await supabase.from('magazine_issues').insert(issueData).select().single();
      if (error) throw error;
      
      if (data) {
        setIssues(sortIssuesList([data, ...issues]));
        setNewMonth('');
        setNewYear('');
        setNewVolume('');
        setNewCopies('1');
        setIsCustomNewCopies(false);
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
    const cp = issue.copies ? issue.copies.toString() : '1';
    setEditIssueForm({
      month: issue.issue_month || '',
      year: issue.issue_year ? issue.issue_year.toString() : '',
      volume: issue.volume || '',
      status: issue.status || 'আছে',
      copies: cp
    });
    setIsCustomEditCopies(!['1', '2', '3', '4', '5'].includes(cp));
  };

  const handleSaveIssueEdit = async (issueId: string) => {
    try {
      const proposedMonth = editIssueForm.month.trim() || null;
      const proposedYear = editIssueForm.year ? parseInt(bnToEnNumber(editIssueForm.year)) : null;

      const isDuplicate = issues.some(
        issue => {
          if (issue.id === issueId) return false;
          const existingMonth = issue.issue_month?.trim() || null;
          const existingYear = issue.issue_year ? parseInt(bnToEnNumber(issue.issue_year.toString())) : null;
          return existingMonth === proposedMonth && existingYear === proposedYear;
        }
      );

      if (isDuplicate) {
        toast.error('এই মাস এবং সালের ইস্যু আগে থেকেই যুক্ত করা আছে।');
        return;
      }

      const { error } = await supabase.from('magazine_issues').update({
        issue_month: proposedMonth,
        issue_year: proposedYear,
        volume: editIssueForm.volume.trim() || null,
        status: editIssueForm.status,
        copies: parseInt(bnToEnNumber(editIssueForm.copies)) || 1,
        updated_at: new Date().toISOString()
      }).eq('id', issueId);

      if (error) throw error;
      
      setIssues(sortIssuesList(issues.map(issue => 
        issue.id === issueId ? {
          ...issue,
          issue_month: editIssueForm.month.trim() || null,
          issue_year: editIssueForm.year ? parseInt(bnToEnNumber(editIssueForm.year)) : null,
          volume: editIssueForm.volume.trim() || null,
          status: editIssueForm.status,
          copies: parseInt(bnToEnNumber(editIssueForm.copies)) || 1,
        } : issue
      )));
      setEditingIssueId(null);
      toast.success('ইস্যু আপডেট হয়েছে!');
    } catch(err: any) {
      toast.error('সমস্যা হয়েছে: ' + err.message);
    }
  };

  const confirmDeleteIssue = async () => {
    if (!deleteIssueId) return;
    try {
      const { error } = await supabase.from('magazine_issues').delete().eq('id', deleteIssueId);
      if (error) throw error;
      setIssues(issues.filter(i => i.id !== deleteIssueId));
      toast.success('মুছে ফেলা হয়েছে!');
      setDeleteIssueId(null);
      setEditingIssueId(null);
    } catch (err: any) {
      toast.error('সমস্যা হয়েছে: ' + err.message);
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
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>মোট ইস্যু ও কপি</span>
                <span style={{ fontWeight: 600, fontSize: '1.3rem', color: 'var(--accent)', fontFamily: 'var(--font-serif)' }}>
                  {enToBnNumber(issues.length.toString())} টি ইস্যু 
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '8px' }}>
                    (মোট {enToBnNumber(issues.reduce((sum, issue) => sum + (issue.copies || 1), 0).toString())} কপি)
                  </span>
                </span>
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
              <div style={{ overflowX: 'visible' }}>
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
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <input className="form-input font-serif" style={{ width: '80px', marginBottom: '4px', padding: '4px 8px', fontFamily: 'var(--font-serif)' }} placeholder="সাল" value={enToBnNumber(editIssueForm.year)} onChange={e => handleYearInput(e.target.value, val => setEditIssueForm({...editIssueForm, year: val}))} />
                                <div style={{ width: '100px' }}>
                                  <CustomCombobox 
                                    className="form-input" 
                                    placeholder="মাস" 
                                    value={editIssueForm.month} 
                                    onChange={val => setEditIssueForm({...editIssueForm, month: val})} 
                                    options={MONTH_OPTIONS} 
                                  />
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <input className="form-input" style={{ width: '120px', padding: '4px 8px' }} placeholder="সংখ্যা" value={editIssueForm.volume} onChange={e => setEditIssueForm({...editIssueForm, volume: e.target.value})} />
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <div style={{ flex: 1, minWidth: '85px' }}>
                                  <CustomSelect
                                    className="font-serif"
                                    value={isCustomEditCopies ? 'custom' : (['1', '2', '3', '4', '5'].includes(editIssueForm.copies) ? editIssueForm.copies : 'custom')}
                                    onChange={val => {
                                      if (val === 'custom') {
                                        setIsCustomEditCopies(true);
                                      } else {
                                        setIsCustomEditCopies(false);
                                        setEditIssueForm({ ...editIssueForm, copies: val });
                                      }
                                    }}
                                    options={[
                                      { value: '1', label: '১ কপি' },
                                      { value: '2', label: '২ কপি' },
                                      { value: '3', label: '৩ কপি' },
                                      { value: '4', label: '৪ কপি' },
                                      { value: '5', label: '৫ কপি' },
                                      { value: 'custom', label: '✏️ অন্য...' }
                                    ]}
                                  />
                                </div>
                                {isCustomEditCopies && (
                                  <input
                                    className="form-input font-serif"
                                    style={{ width: '55px', padding: '4px 6px', height: '34px', fontFamily: 'var(--font-serif)', fontSize: '0.85rem' }}
                                    type="text"
                                    inputMode="numeric"
                                    value={enToBnNumber(editIssueForm.copies)}
                                    onChange={e => handleCopiesInput(e.target.value, val => setEditIssueForm({ ...editIssueForm, copies: val }))}
                                    placeholder="কপি"
                                    autoFocus
                                  />
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <CustomSelect
                                value={editIssueForm.status} 
                                onChange={val => setEditIssueForm({...editIssueForm, status: val})}
                                options={[
                                  { value: 'আছে', label: 'আছে' },
                                  { value: 'নাই', label: 'নাই' },
                                  { value: 'ধার দেওয়া হয়েছে', label: 'ধার দেওয়া' },
                                  { value: 'হারিয়ে গেছে', label: 'হারানো' }
                                ]}
                              />
                            </td>
                            <td style={{ padding: '8px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.8rem', backgroundColor: '#fee2e2', color: '#ef4444', borderColor: '#fca5a5', marginRight: '4px' }} onClick={() => setDeleteIssueId(issue.id)}>মুছুন</button>
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
                            <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontFamily: 'var(--font-serif)', fontSize: '0.95rem' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{enToBnNumber(issue.copies?.toString() || '1')}</span> কপি
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span className={`status-badge status-${issue.status === 'আছে' ? 'owned' : 'missing'}`}>
                                {issue.status}
                              </span>
                            </td>
                            {user?.id === magazine.owner && (
                              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => startEditingIssue(issue)}>এডিট</button>
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
                    <CustomCombobox 
                      className="form-input" 
                      value={newMonth} 
                      onChange={val => setNewMonth(val)} 
                      placeholder="যেমন: জুন" 
                      options={MONTH_OPTIONS}
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
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <div style={{ flex: 1, minWidth: '95px' }}>
                        <CustomSelect 
                          className="font-serif" 
                          value={isCustomNewCopies ? 'custom' : (['1', '2', '3', '4', '5'].includes(newCopies) ? newCopies : 'custom')} 
                          onChange={val => {
                            if (val === 'custom') {
                              setIsCustomNewCopies(true);
                            } else {
                              setIsCustomNewCopies(false);
                              setNewCopies(val);
                            }
                          }}
                          options={[
                            { value: '1', label: '১ কপি' },
                            { value: '2', label: '২ কপি' },
                            { value: '3', label: '৩ কপি' },
                            { value: '4', label: '৪ কপি' },
                            { value: '5', label: '৫ কপি' },
                            { value: 'custom', label: '✏️ অন্যান্য...' }
                          ]}
                        />
                      </div>
                      {isCustomNewCopies && (
                        <input 
                          className="form-input font-serif" 
                          type="text"
                          inputMode="numeric"
                          value={newCopies === '0' ? '' : enToBnNumber(newCopies)} 
                          onChange={e => handleCopiesInput(e.target.value, setNewCopies)} 
                          placeholder="সংখ্যা" 
                          style={{ fontFamily: 'var(--font-serif)', height: '42px', width: '70px', padding: '6px 8px' }}
                          autoFocus
                        />
                      )}
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>অবস্থা</label>
                    <CustomSelect 
                      value={newStatus}
                      onChange={val => setNewStatus(val)}
                      options={[
                        { value: 'আছে', label: 'আছে' },
                        { value: 'নাই', label: 'নাই' },
                        { value: 'ধার দেওয়া হয়েছে', label: 'ধার দেওয়া' },
                        { value: 'হারিয়ে গেছে', label: 'হারিয়ে গেছে' }
                      ]}
                    />
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

        {deleteIssueId && (
          <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div className="modal-content card" style={{
              maxWidth: '400px', width: '90%', padding: '24px',
              backgroundColor: 'var(--bg-primary)', borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ 
                  width: '48px', height: '48px', borderRadius: '50%', 
                  backgroundColor: '#fee2e2', color: '#ef4444', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  margin: '0 auto 16px', fontSize: '24px' 
                }}>
                  ⚠️
                </div>
                <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)', fontSize: '1.25rem' }}>ইস্যুটি মুছে ফেলতে চান?</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  আপনি কি নিশ্চিত যে আপনি এই ইস্যুটি মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setDeleteIssueId(null)}
                  style={{ flex: 1 }}
                >
                  বাতিল
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={confirmDeleteIssue}
                  style={{ flex: 1, backgroundColor: '#ef4444', color: 'white', border: 'none' }}
                >
                  হ্যাঁ, মুছুন
                </button>
              </div>
            </div>
          </div>
        )}

        {duplicateIssueConfirm && (
          <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div className="modal-content card" style={{
              maxWidth: '400px', width: '90%', padding: '24px',
              backgroundColor: 'var(--bg-primary)', borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ 
                  width: '48px', height: '48px', borderRadius: '50%', 
                  backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  margin: '0 auto 16px', fontSize: '24px' 
                }}>
                  ⚠️
                </div>
                <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)', fontSize: '1.25rem' }}>ইস্যুটি আগে থেকেই আছে</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  এই মাস এবং সালের ইস্যু আগে থেকেই যুক্ত করা আছে। আপনি কি ওই ইস্যুটির কপি সংখ্যা বাড়াতে বা সেটি এডিট করতে চান?
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setDuplicateIssueConfirm(null)}
                  style={{ flex: 1 }}
                >
                  বাতিল
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    const issue = duplicateIssueConfirm;
                    setDuplicateIssueConfirm(null);
                    setNewMonth('');
                    setNewYear('');
                    setNewVolume('');
                    setNewCopies('1');
                    setIsCustomNewCopies(false);
                    startEditingIssue(issue);
                  }}
                  style={{ flex: 1 }}
                >
                  হ্যাঁ, এডিট করুন
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
