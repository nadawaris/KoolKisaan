# Real-Time Notifications

## Concept
A modern application needs to feel alive. When users interact with each other's questions or answers, they should not have to refresh the page to see if someone replied to them. We use WebSockets to push live events directly into the user's browser in real-time.

## Architecture

1. **Socket.io Integration**: 
   The backend Express server wraps the core `http.Server` with `socket.io`. When a user authenticates on the frontend, the `SocketContext` establishes a persistent, bidirectional WebSocket connection to the backend.

2. **Namespaces & Rooms**:
   When a user connects, the backend reads their user ID from the socket handshake and joins them into a unique private room: `socket.join('user_' + userId)`. This allows the server to emit private notifications targeted directly at specific users.

3. **Live Typing Indicators**:
   When a user views a specific Question Thread (`/qa/[id]`), the frontend joins a specific room for that thread. When anyone types in the answer box, it emits a `typing` event to the server, which broadcasts a `user_typing` event to everyone else in that thread's room, displaying a live "User is typing..." indicator.

4. **Event Triggers**:
   When an action occurs (e.g., accepting an answer, getting auto-answered by Yaksha, or receiving a comment), the `qaController` saves a database notification and triggers `req.io.to('user_' + targetId).emit('new_notification')`. 

5. **Frontend Reaction**:
   The frontend listens for `new_notification`. When fired, it flashes the notification bell, increments the unread counter, and triggers a sliding toast notification to alert the user instantly.

## Code Pointers
- Backend Setup: `backend/server.js` (Socket.io initialization)
- Frontend Context: `frontend/src/contexts/SocketContext.tsx`
