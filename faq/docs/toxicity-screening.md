# AI Toxicity Screening

## Concept
In any crowdsourced platform, bad actors may attempt to spam the community with abusive, highly toxic, or inappropriate content. To protect the integrity of the platform without requiring 24/7 human moderation, we implemented an invisible, synchronous AI Toxicity filter.

## Architecture

1. **Synchronous Interception**: 
   When a user attempts to POST a new Question or Answer, the backend halts the standard database saving procedure.

2. **AI Evaluation**:
   The text payload is sent directly to `gemini-2.5-flash`. The system prompt is highly constrained:
   > "Analyze the following text. Is it abusive, highly toxic, or sexual? Reply strictly with exactly 'SAFE' or 'REJECT'."

3. **Gating Logic**:
   - If the AI returns `REJECT`, the backend immediately aborts the HTTP request, throwing a `400 Bad Request` with the message "Content rejected by automated moderation."
   - If the AI returns `SAFE`, the pipeline proceeds to save the content to the MongoDB database.

4. **Fail-open Design**:
   If the Gemini API is down or times out, the `catch` block defaults to `false` (allowing the content through) to ensure the platform remains usable during AI outages.

## Code Pointers
- Screening Logic: `backend/controllers/qaController.js` (`checkModeration`)
