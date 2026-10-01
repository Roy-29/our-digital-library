# 📚 ডিজিটাল বইয়ের ঘর — Digital Library

Swapnil ও Bipro-এর ব্যক্তিগত ডিজিটাল লাইব্রেরি ও বই ব্যবস্থাপনা সিস্টেম।

A personal digital library and book management system for Swapnil & Bipro — completely replaces Excel/Google Sheets.

## 🌟 Features

- **📚 Complete Book Management** — Add, edit, delete, search books with full metadata
- **📖 Reading Tracker** — Track progress, ratings, reviews, favorite quotes
- **📤 Lending Management** — Lend/return books, track overdue, lending history
- **🛒 Wishlist** — Track books to buy, one-click purchase-to-collection
- **📍 Physical Location** — Room → Shelf → Rack → Position mapping
- **👥 People Management** — Borrowers with contact info and history
- **📊 Dashboard** — Real-time statistics, collection value, reading stats
- **🔍 Powerful Search & Filter** — Multi-field search with combined filters
- **📱 Mobile Responsive** — Full functionality on phone with bottom navigation
- **💾 Backup & Restore** — JSON/CSV export, full database restore
- **🔐 Secure Auth** — Supabase authentication, private access only

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 (App Router, TypeScript)
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage (book covers)
- **Hosting:** Vercel
- **Styling:** Vanilla CSS (custom literary design system)

## 🚀 Setup

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/our-digital-library.git
cd our-digital-library
npm install
```

### 2. Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → Run the contents of `supabase/schema.sql`
3. Go to **Authentication** → Create two users:
   - `swapnil@yourdomain.com` (or any email)
   - `bipro@yourdomain.com`
4. Go to **Storage** → Create a public bucket named `covers`
5. Copy your project URL and anon key from **Settings → API**

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🌐 Deploy to Vercel

1. Push to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Login
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Design system
│   └── dashboard/
│       ├── layout.tsx              # Dashboard shell (sidebar + nav)
│       ├── page.tsx                # Dashboard stats
│       ├── books/
│       │   ├── page.tsx            # Book list (grid/list/shelf)
│       │   ├── add/page.tsx        # Add book form
│       │   └── [id]/
│       │       ├── page.tsx        # Book detail
│       │       └── edit/page.tsx   # Edit book
│       ├── authors/page.tsx        # Author management
│       ├── publishers/page.tsx     # Publisher management
│       ├── categories/page.tsx     # Category & Genre
│       ├── lending/page.tsx        # Lending management
│       ├── wishlist/page.tsx       # Wishlist
│       ├── reading/page.tsx        # Reading tracker
│       ├── people/page.tsx         # Borrowers
│       ├── locations/page.tsx      # Room/Shelf/Rack
│       ├── activity/page.tsx       # Activity log
│       ├── backup/page.tsx         # Backup & restore
│       └── more/page.tsx           # Mobile menu
├── contexts/
│   └── AuthContext.tsx             # Authentication
├── lib/
│   ├── supabase.ts                # Supabase client
│   └── types.ts                   # TypeScript types
└── supabase/
    └── schema.sql                  # Database schema
```

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Only authenticated users can access data
- Environment variables for all credentials
- No hardcoded secrets

## 📄 License

Private project for personal use.

---

Built with ❤️ for our personal library — **ডিজিটাল বইয়ের ঘর**
