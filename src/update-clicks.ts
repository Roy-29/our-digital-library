import fs from 'fs';

const p = 'src/app/dashboard/books/BooksClient.tsx';
let c = fs.readFileSync(p, 'utf-8');

c = c.replace(
  `  const [deleteId, setDeleteId] = useState<string | null>(null);`,
  `  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewingAuthor, setViewingAuthor] = useState<any | null>(null);
  const [viewingPublisher, setViewingPublisher] = useState<any | null>(null);`
);

c = c.replace(
  `onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFilterAuthor(filterAuthor === book.authorId ? '' : (book.authorId || ''));
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            color: filterAuthor === book.authorId ? 'var(--accent)' : 'inherit',
                            fontWeight: filterAuthor === book.authorId ? 600 : 'inherit',
                            fontSize: 'inherit',
                            fontFamily: 'inherit',
                          }}
                          onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                          title={filterAuthor === book.authorId ? 'লেখকের ফিল্টার মুছুন' : \`\${book.authorNameBn || book.authorName}-এর বই ফিল্টার করুন\`}`,
  `onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const authorObj = authors?.find(a => a.id === book.authorId);
                            if (authorObj) setViewingAuthor(authorObj);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            color: 'inherit',
                            fontSize: 'inherit',
                            fontFamily: 'inherit',
                          }}
                          onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                          title="লেখকের বিস্তারিত দেখুন"`
);

c = c.replace(
  `onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setFilterAuthor(filterAuthor === book.authorId ? '' : (book.authorId || ''));
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                color: filterAuthor === book.authorId ? 'var(--accent)' : 'inherit',
                                fontWeight: filterAuthor === book.authorId ? 600 : 'inherit',
                                fontSize: 'inherit',
                                fontFamily: 'inherit',
                              }}
                              onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                              title={filterAuthor === book.authorId ? 'লেখকের ফিল্টার মুছুন' : \`\${book.authorNameBn || book.authorName}-এর বই ফিল্টার করুন\`}`,
  `onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const authorObj = authors?.find(a => a.id === book.authorId);
                                if (authorObj) setViewingAuthor(authorObj);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                color: 'inherit',
                                fontSize: 'inherit',
                                fontFamily: 'inherit',
                              }}
                              onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                              title="লেখকের বিস্তারিত দেখুন"`
);

c = c.replace(
  `onClick={() => setFilterAuthor(filterAuthor === book.authorId ? '' : (book.authorId || ''))}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            color: filterAuthor === book.authorId ? 'var(--accent)' : 'inherit',
                            fontWeight: filterAuthor === book.authorId ? 600 : 500,
                            fontSize: 'inherit',
                            fontFamily: 'inherit',
                            textAlign: 'left'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                          title={filterAuthor === book.authorId ? 'লেখকের ফিল্টার মুছুন' : \`\${book.authorNameBn || book.authorName}-এর বই ফিল্টার করুন\`}`,
  `onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const authorObj = authors?.find(a => a.id === book.authorId);
                            if (authorObj) setViewingAuthor(authorObj);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            color: 'inherit',
                            fontWeight: 500,
                            fontSize: 'inherit',
                            fontFamily: 'inherit',
                            textAlign: 'left'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                          title="লেখকের বিস্তারিত দেখুন"`
);

c = c.replace(
  `onClick={() => setFilterPublisher(filterPublisher === (book.publisherId || book.publisherName) ? '' : (book.publisherId || book.publisherName || ''))}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            color: (filterPublisher === book.publisherId || filterPublisher === book.publisherName) ? 'var(--accent)' : 'inherit',
                            fontWeight: (filterPublisher === book.publisherId || filterPublisher === book.publisherName) ? 600 : 500,
                            fontSize: 'inherit',
                            fontFamily: 'inherit',
                            textAlign: 'left'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                          title={(filterPublisher === book.publisherId || filterPublisher === book.publisherName) ? 'প্রকাশকের ফিল্টার মুছুন' : \`\${book.publisherNameBn || book.publisherName}-এর বই ফিল্টার করুন\`}`,
  `onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const pubObj = publishers?.find(p => p.id === book.publisherId);
                            if (pubObj) setViewingPublisher(pubObj);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            color: 'inherit',
                            fontWeight: 500,
                            fontSize: 'inherit',
                            fontFamily: 'inherit',
                            textAlign: 'left'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                          title="প্রকাশকের বিস্তারিত দেখুন"`
);

const modalHtml = \`      {/* Author Details Modal */}
      {viewingAuthor && (
        <div className="modal-overlay" onClick={() => setViewingAuthor(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📖 লেখকের বিস্তারিত তথ্য</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setViewingAuthor(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="info-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>নাম</label>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{viewingAuthor.name_bn || viewingAuthor.name}</div>
              </div>
              {viewingAuthor.bio && (
                <div className="info-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>জীবনী / বিবরণ</label>
                  <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{viewingAuthor.bio}</div>
                </div>
              )}
              <div className="form-row" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {(viewingAuthor.birth_year || viewingAuthor.death_year) && (
                  <div className="info-group">
                    <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>জীবনকাল</label>
                    <div style={{ color: 'var(--text-primary)' }}>
                      {viewingAuthor.birth_year ? enToBnNumber(viewingAuthor.birth_year.toString()) : 'অজানা'} - {viewingAuthor.death_year ? enToBnNumber(viewingAuthor.death_year.toString()) : 'বর্তমান'}
                    </div>
                  </div>
                )}
                {viewingAuthor.nationality && (
                  <div className="info-group">
                    <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>জাতীয়তা</label>
                    <div style={{ color: 'var(--text-primary)' }}>{viewingAuthor.nationality}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setViewingAuthor(null)}>বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* Publisher Details Modal */}
      {viewingPublisher && (
        <div className="modal-overlay" onClick={() => setViewingPublisher(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📖 প্রকাশকের বিস্তারিত তথ্য</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setViewingPublisher(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="info-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>নাম</label>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{viewingPublisher.name_bn || viewingPublisher.name}</div>
              </div>
              {viewingPublisher.address && (
                <div className="info-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ঠিকানা</label>
                  <div style={{ color: 'var(--text-primary)' }}>{viewingPublisher.address}</div>
                </div>
              )}
              <div className="form-row" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {viewingPublisher.website && (
                  <div className="info-group">
                    <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ওয়েবসাইট</label>
                    <div><a href={viewingPublisher.website.startsWith('http') ? viewingPublisher.website : \`https://\${viewingPublisher.website}\`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>{viewingPublisher.website}</a></div>
                  </div>
                )}
                {viewingPublisher.phone && (
                  <div className="info-group">
                    <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ফোন</label>
                    <div style={{ color: 'var(--text-primary)' }}>{viewingPublisher.phone}</div>
                  </div>
                )}
                {viewingPublisher.email && (
                  <div className="info-group">
                    <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ইমেইল</label>
                    <div><a href={\`mailto:\${viewingPublisher.email}\`} style={{ color: 'var(--primary)' }}>{viewingPublisher.email}</a></div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setViewingPublisher(null)}>বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (\`

c = c.replace('      {deleteId && (', modalHtml);

fs.writeFileSync(p, c);
console.log('Done!');
