# 🤖 AI Recruiter

AI Recruiter is a full-stack voice interview platform that uses OpenRouter's Gemini model to generate custom interview questions and conduct AI-powered interviews via Vapi. It features real-time voice interaction, dynamic feedback storage, and a clean dashboard to manage candidates.

🌐 Live Site → [ai-recruiter-one.vercel.app](https://ai-recruiter-one.vercel.app)

---

## 🚀 Quick Start (Local)

```bash
git clone https://github.com/Saadcoder28/AI-Recruiter.git
cd AI-Recruiter
pnpm install          # or npm / yarn

cp .env.local.example .env.local
# …fill in the keys …

pnpm dev              # http://localhost:3000
```

---

## 🔐 Environment Variables

Create a `.env.local` file at the root and fill in your secrets:

```env
# — Supabase —
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# — OpenRouter / Gemini —
OPENROUTER_API_KEY=your_openrouter_key

# — Vapi —
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_vapi_assistant_id

# (Optional) Stripe
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

⚠️ Never commit real secrets — keep them in `.env.local`.

---

## 📁 Important Folders

| Path                                    | Purpose                                   |
|-----------------------------------------|-------------------------------------------|
| `app/api/interviews/generate`          | Serverless function → Gemini Q-gen        |
| `app/api/interviews/[id]/feedback`     | Store 1–5 ⭐ rating & comments             |
| `app/interview/[id]`                   | Candidate voice-call page (Vapi)          |
| `app/dashboard`                        | Protected recruiter UI                    |
| `lib/utils.js`                         | Small helpers (date, sleep, etc.)         |

---

## 🧭 Roadmap

- 📧 Email invitations & reminders  
- 🔍 Vector search for better follow-ups  
- 📊 Analytics dashboard (avg score, drop-off)  
- 🧾 PDF export of transcript & summary  
- 💳 Stripe billing (pay-per-interview)  

---

## 🤝 Contributing

Fork the repo & create your branch  
Follow the commit-lint & Prettier rules (`pnpm lint && pnpm format`)  
Open a PR — every improvement is welcome!

---

## ⚖️ License

MIT

---

© 2025 — crafted with 🧠 & 🤖 by **Saad Amin**  
Built using OpenAI technologies & community SDKs.  
Not affiliated with Google, Supabase, or Vapi.
