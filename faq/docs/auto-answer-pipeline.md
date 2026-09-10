# Deep Auto-Answer Pipeline (Yaksha Bot)

## Concept
When a user asks a question in the Community Hub, they shouldn't have to wait hours for a human to respond if the answer already exists in the Knowledge Base. The Deep Auto-Answer Pipeline uses Retrieval-Augmented Generation (RAG) to instantly answer community questions using verified FAQs.

## Architecture

1. **Asynchronous Trigger**: 
   When a user submits a question via `POST /api/qa`, the backend saves the question to the database and responds with a `201 Created` immediately. Behind the scenes, it kicks off a non-blocking background worker `autoAnswerQuestion()`.

2. **Semantic Retrieval**:
   The worker takes the title and body of the new question and vectorizes it using `gemini-embedding-2`. It performs a Semantic Vector Search against the `FAQ` collection to retrieve the **Top 3 most relevant Knowledge Base articles**.

3. **Context Assembly**:
   If the Top 3 FAQs meet a strict confidence threshold (Cosine Similarity > 0.65), their titles and answers are concatenated into a pure text "Context Block".

4. **Generative AI (Gemini 2.5 Flash)**:
   The backend passes the Context Block and the User's Question to the ultra-fast `gemini-2.5-flash` model. It injects a system prompt instructing the AI to act as **Yaksha**, the official Gen-Z/Hinglish platform assistant, and answer the question *strictly* using the provided context.

5. **Real-time Delivery**:
   The AI's generated markdown response is saved as an `Answer` document flagged with `isAI: true`. The backend then fires a Socket.io `new_notification` event, and the frontend instantly renders the answer in the user's browser, complete with a special ✨ Yaksha Bot gradient UI badge.

## Code Pointers
- Background Worker: `backend/controllers/qaController.js` (`autoAnswerQuestion`)
- Frontend Rendering: `frontend/src/app/qa/[id]/page.tsx`
