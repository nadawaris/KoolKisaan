# Semantic Vector Search (Intent Engine)

## Concept
Traditional keyword search relies on exact string matching. If a user searches for "financial aid", but the FAQ uses the word "stipend", a keyword search will fail. Semantic Vector Search solves this by understanding the *intent* and *meaning* behind a query rather than just the words.

## Architecture

1. **Embedding Generation**: 
   When an Admin approves a new FAQ (or backfills old ones), the system concatenates the FAQ's `title` and `answer`. It sends this string to **Gemini (`text-embedding-004`)**, which converts the semantic meaning of the text into a **768-dimensional mathematical vector array** (Float64Array). This vector is saved directly into the SQLite database alongside the FAQ.

2. **Query Vectorization**:
   When a user types into any search bar (Global Navbar, Homepage, or FAQ Dashboard) and hits Enter, the query is intercepted. The backend instantly sends the user's search query to Gemini to generate a *query vector*.

3. **Cosine Similarity Algorithm**:
   The backend retrieves all published FAQs from the database. It runs a custom, high-speed **In-Memory Cosine Similarity** mathematical function. It compares the *query vector* against every *FAQ vector* to determine how close they are in the 768-dimensional space.

4. **Ranking & Filtering**:
   FAQs are scored from `0.0` to `1.0`. Any FAQ with a similarity score above `0.55` is returned to the user, sorted from highest relevance to lowest.

## Code Pointers
- Embedding Utils: `backend/utils/embeddings.js`
- FAQ Search Endpoint: `backend/controllers/faqController.js` (`getFAQs`)
