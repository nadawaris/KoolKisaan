# Samagama: FAQ & Crowdsourcing Platform - Product Document

## 1. Product Overview
**Samagama** (Sanskrit for "confluence") is an AI-powered FAQ and Community knowledge-sharing platform. It bridges authoritative institutional knowledge with decentralized community support, eliminating the common issues of search failure (No Results Found) and delayed community answers.

## 2. Product Goals
* **Eradicate Search Frustration:** Replace traditional keyword-based search with an Intent Engine capable of understanding user queries mathematically, regardless of synonyms or phrasing.
* **Achieve Zero-Latency Support:** Provide users with instantaneous, perfectly accurate answers to their questions 24/7 without requiring human administrative intervention.
* **Maintain Platform Safety:** Ensure the digital environment is strictly professional by proactively blocking toxic, abusive, or spam content before it enters the database.
* **Foster Community Engagement:** Incentivize domain experts to share their knowledge by gamifying the process through a reputation and ranking system.

## 3. Product Requirements

### 3.1 Functional Requirements
* **Role-Based Access Control (RBAC):** The system must differentiate between Standard Users and Administrators via secure JWT authentication.
* **Knowledge Management:** Administrators must be able to Create, Read, Update, and Delete authoritative FAQ entries.
* **Community Q&A:** Users must be able to post questions, submit answers to other users' questions, and upvote/accept answers.
* **Vector Search:** The system must vectorize all FAQs and execute high-speed mathematical Cosine Similarity calculations to rank results.

### 3.2 Non-Functional Requirements
* **Real-Time Responsiveness:** The UI must update instantaneously across all connected clients when a user is typing or when a new answer is posted (WebSocket telemetry).
* **High Availability & Speed:** Initial page loads must be fast and SEO-friendly (Next.js SSR). Background AI tasks must not block the main Node.js event loop.
* **Security:** All user passwords must be hashed. The platform must be impervious to Cross-Site Scripting (XSS) via strict `HttpOnly` cookie usage.

## 4. Expected Features (Core Modules)

### 4.1 Semantic Vector Search (Intent Engine)
Unlike legacy SQL `LIKE` searches, Samagama utilizes Google's `text-embedding-004` to convert text into 768-dimensional float arrays. It matches what the user *means*, not just the exact words they type, fundamentally solving the "No Results Found" dead end.

### 4.2 Deep Auto-Answer Pipeline (Yaksha Bot)
When a user asks a question in the community forum, an autonomous background daemon instantly vectorizes the question, performs a RAG (Retrieval-Augmented Generation) search against the official FAQs, and uses `gemini-2.5-flash` to synthesize a highly accurate, polite response within seconds.

### 4.3 Synchronous AI Toxicity Moderation
A zero-shot AI layer intercepts every HTTP POST request to the community forum. If a user attempts to post abusive or sexually explicit content, the model throws a `400 Bad Request` and blocks the database transaction entirely, ensuring a pristine environment.

### 4.4 Gamified Reputation Engine
Users accumulate points (REP) for receiving upvotes (+10 REP) and having their answers marked as accepted (+20 REP) by the original question author. This mathematically surfaces the highest-quality truth and incentivizes experts.

### 4.5 Socket.io Live Telemetry
The platform provides a Slack-like experience. When User A is typing an answer to User B's thread, User B sees a live "User is typing..." indicator. When the answer is posted, User B receives an instant toast notification without refreshing the page.
