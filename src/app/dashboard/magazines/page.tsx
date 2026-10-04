'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function MagazinesPage() {
  const [magazines, setMagazines] = useState([]);
  
  return (
    <>
      <div className="page-header">
        <h2>📰 ম্যাগাজিন</h2>
        <div className="page-header-actions">
          <Link href="/dashboard/magazines/add" className="btn btn-primary">
            ➕ ম্যাগাজিন যোগ করুন
          </Link>
        </div>
      </div>

      <div className="page-body">
        {magazines.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📰</div>
            <h3>কোনো ম্যাগাজিন নেই</h3>
            <p>আপনার সংগ্রহে এখনও কোনো ম্যাগাজিন যোগ করা হয়নি। নতুন ম্যাগাজিন যোগ করতে উপরের বাটনে ক্লিক করুন।</p>
          </div>
        ) : (
          <div className="card">
            <div className="card-body">
              {/* Table or grid for magazines will go here */}
              <p>Magazines list...</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
