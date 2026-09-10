# Community Q&A Ecosystem

## Concept
Beyond a static FAQ board, the platform features a dynamic, crowdsourced Community Q&A Hub. It operates similarly to Reddit or StackOverflow, allowing users to ask bespoke questions, provide answers, and engage in threaded discussions.

## Architecture

1. **Data Models**: 
   The ecosystem is built on a 3-tier hierarchical schema:
   - `Question`: The root node containing the inquiry.
   - `Answer`: Primary responses to the Question.
   - `Comment`: Nested replies attached directly to Answers.

2. **Reputation Engine**:
   To encourage high-quality contributions, the platform features a gamified reputation system.
   - **Upvoting/Downvoting**: Users can upvote (+10 REP) or downvote (-10 REP) questions and answers. The system features idempotency guards (you cannot upvote twice, and changing from an upvote to a downvote reverses the initial reputation gain).
   - **Accepted Answers**: The original author of a Question can mark one Answer as "Accepted" (`isAccepted: true`). This visually highlights the answer with a green border and permanently awards the answerer a massive **+20 REP** boost.

3. **Telemetry & Tracking**:
   - **View Counts**: The system tracks unique IP addresses arrayed on the `Question` model to increment view counts uniquely without spam.
   - **Sorting**: Users can toggle between `New` (chronological), `Hot` (algorithm factoring views + upvotes), and `Top` (highest upvote count).

## Code Pointers
- QA Models: `backend/models/QA.js`
- Reputation Logic: `backend/controllers/qaController.js` (`voteQuestion`, `voteAnswer`, `acceptAnswer`)
