# 🚀 Samagama FAQ & Crowdsourcing Platform

A next-generation, AI-powered knowledge base and community Q&A portal. Built on a modern MERN stack to facilitate community knowledge sharing with advanced real-time features, AI moderation, and an expert promotion layer.

---

## 🔥 Flagship Capabilities

Seven flagship capabilities define this platform:

- **Semantic Vector Search (Intent Engine)** — Traditional keyword search is dead. Our platform integrates directly with Gemini `text-embedding-004` to convert FAQs into 768-dimensional mathematical vectors. When a user searches for an abstract concept, our custom In-Memory Cosine Similarity algorithm calculates intent and returns the best semantic match.
- **Deep Auto-Answer Pipeline (Yaksha Bot)** — A fully autonomous pipeline powered by Retrieval-Augmented Generation (RAG). When users post questions, the system vectorizes their query, retrieves relevant contexts from the FAQ database, and feeds it into `gemini-2.5-flash`. The "✨ Yaksha Bot" then magically posts a contextual, friendly markdown response in real-time.
- **AI Toxicity Moderation** — An invisible synchronous AI layer intercepts newly created questions and answers, screening them for abusive or highly toxic content in real-time before saving them to the database.
- **Twitter/Reddit-Style Community Architecture** — A dynamic, scrolling feed of community questions. Users can post answers and drop nested comments mimicking a highly interactive social media thread. Includes personal bookmarks, real-time typing indicators, and robust search capabilities.
- **Expert Promotion & Reputation Engine** — Users earn reputation points (REP) by contributing. Question authors can pin the definitive "Accepted" solution, permanently rewarding the answerer with a massive +20 REP boost. Protected by idempotency guards to prevent abuse.
- **Animated Gamification & Leaderboards** — A beautifully animated, real-time leaderboard featuring 3D-styled podiums for the top 3 contributors. It calculates visual progress bars showing the relative reputation gaps between users. Profiles dynamically display hierarchical roles styled as premium badges.
- **Live Socket Real-Time Interactions** — When a user begins typing an answer, other viewers see a real-time "User is typing..." indicator. Users receive instant, live UI toast notifications when someone comments on their answer or accepts their solution—no page refresh required.
- **Advanced Admin Telemetry & Moderation Queue** — A secure dashboard where moderators review user-submitted FAQs via an expandable inline table. Actions trigger polished, floating toast notifications.

---

## 📚 Technical Documentation

Curious how these features actually work under the hood? Check out our detailed architectural write-ups in the `/docs` folder:

- [Semantic Vector Search Architecture](./docs/semantic-search.md)
- [Deep Auto-Answer Pipeline (Yaksha Bot)](./docs/auto-answer-pipeline.md)
- [Community Q&A Ecosystem](./docs/community-qa.md)
- [Real-Time WebSockets & Notifications](./docs/realtime-notifications.md)
- [Synchronous AI Toxicity Screening](./docs/toxicity-screening.md)

---

## 🛠️ Admin Dashboard

The admin panel provides moderation and operational control. Key areas:
- **Review Queue**: Securely approve or reject pending community FAQs.
- **User Management**: View and manage the roles of the platform's user base.
- **Real-Time Analytics**: Monitor platform health, total published FAQs, unanswered questions, and top contributors.

---

## 👨‍💻 User Experience

The user-facing app gives authenticated users full participation in the knowledge loop:
- **Discover & Ask**: Post creations with validation, tags, and category browsing.
- **Engage**: Upvote with reputation-farming prevention (reverses on removal), bookmark favorites, nest comment threads, and accept definitive answers.
- **Notifications**: In-app bell and live UI event stream.
- **Authentication**: Dual-strategy auth supporting both traditional Email/Password login (secured via `bcryptjs` and JWTs) as well as **Google OAuth 2.0**.

---

## 🏗️ Technology Stack

- **Frontend**: Next.js 16+ (App Router), React, Tailwind CSS v4, Axios
- **Backend**: Node.js, Express.js, Socket.io
- **Database**: MongoDB (via `mongodb-memory-server` for local persistent dev, easily swappable to Atlas), Mongoose
- **Authentication**: Passport.js (Google OAuth), JSON Web Tokens (JWT), bcryptjs
- **AI Engine**: `@google/generative-ai` (Gemini 2.5 Flash)

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v18 or higher)
- A Google Gemini API Key
- A Google OAuth Client ID & Secret

### 1. Clone the repository
```bash
git clone https://github.com/ABHISHEK27Y/faq.git
cd faq
```

### 2. Setup the Backend
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=5000
JWT_SECRET=your_super_secure_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_secret
```
Start the backend server:
```bash
npm run dev
```

### 3. Setup the Frontend
Open a new terminal window:
```bash
cd frontend
npm install
```
Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```
Start the Next.js development server:
```bash
npm run dev
```

### 4. Access the Application
Open your browser and navigate to `http://localhost:3000`.

---
*Built with ❤️ for the Samagama Community.*
