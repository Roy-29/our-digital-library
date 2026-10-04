const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function updateAuthors() {
  const booksRes = await client.execute('SELECT title, author_id, translator_id, illustrator_id FROM books');
  
  const updates = {};
  function addUpdate(id, name, isTranslator = false) {
    if (!id) return;
    updates[id] = { name, isTranslator };
  }

  for (const book of booksRes.rows) {
    if (book.title.includes('তিন বাহু দশ মুখ')) {
      addUpdate(book.author_id, 'অনির্বাণ মুখার্জী');
    } else if (book.title.includes('সায়েন্স ফিকশন সমগ্র') || book.title.includes('শুভ্র সমগ্র')) {
      addUpdate(book.author_id, 'হুমায়ূন আহমেদ');
    } else if (book.title.includes('জলঙ্গীর অন্ধকারে')) {
      addUpdate(book.author_id, 'হিমাদ্রিকিশোর দাশগুপ্ত');
    } else if (book.title.includes('দেশে বিদেশে')) {
      addUpdate(book.author_id, 'সৈয়দ মুজতবা আলী');
    } else if (book.title.includes('পূর্ব পশ্চিম') || book.title.includes('ভয় সমগ্র')) {
      addUpdate(book.author_id, 'সুনীল গঙ্গোপাধ্যায়');
    } else if (book.title.includes('আর্য দিগন্তে সিন্ধু সভ্যতা')) {
      addUpdate(book.author_id, 'রজত পাল');
    } else if (book.title.includes('উপন্যাস সমগ্র-১')) {
      addUpdate(book.author_id, 'লেখক (উপন্যাস সমগ্র-১)');
    } else if (book.title.includes('জামশেদ মুস্তাফির হাড়')) {
      addUpdate(book.author_id, 'আবদুল হাই মিনার');
    } else if (book.title.includes('টুনটুনি ও ছোটাচ্চু') || book.title.includes('ফেরা')) {
      addUpdate(book.author_id, 'মুহম্মদ জাফর ইকবাল');
    } else if (book.title.includes('সাম্ভালা')) {
      addUpdate(book.author_id, 'শরীফুল হাসান');
    } else if (book.title.includes('ডাইনোসরের ডিম') || book.title.includes('তিন গোয়েন্দা') || book.title.includes('লাল গ্যাং')) {
      addUpdate(book.author_id, 'রকিব হাসান');
    } else if (book.title.includes('দ্য কৃষ্ণ কি')) {
      addUpdate(book.author_id, 'অশ্বিন সাঙ্ঘি');
    } else if (book.title.includes('দ্য সাইন অভ ফোর')) {
      addUpdate(book.author_id, 'স্যার আর্থার কোনান ডয়েল');
      addUpdate(book.translator_id, 'অনুবাদক (দ্য সাইন অভ ফোর)', true);
    } else if (book.title.includes('সসেমিরা')) {
      addUpdate(book.author_id, 'নাবিল মুহতাসিম');
    }
  }

  for (const [id, data] of Object.entries(updates)) {
    console.log(`Updating ${id} to ${data.name}`);
    await client.execute({
      sql: 'UPDATE authors SET name = ?, name_bn = ?, is_author = ?, is_translator = ? WHERE id = ?',
      args: [data.name, data.name, data.isTranslator ? 0 : 1, data.isTranslator ? 1 : 0, id]
    });
  }
  console.log('Update complete!');
}

updateAuthors().catch(console.error);
