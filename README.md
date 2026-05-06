1. Installation
Install dependencies for all components:
```bash
# Install root dependencies
npm install

# Install Backend dependencies
cd notification_app_be && npm install && cd ..

# Install Frontend dependencies
cd notification_app_fe && npm install && cd ..

# Install Logging Middleware dependencies
cd logging_middleware && npm install && cd ..
```

2. Access Token Setup
The evaluation service tokens expire every 15 minutes. I have provided an automated script to refresh them.
```bash
# Fetches a fresh token and updates .env files automatically
npm run refresh-token
```

3. Running the Project
You need to run both the backend and the frontend:

**Start Backend (Port 4000):**
```bash
npm run start:be
```

**Start Frontend (Port 3000):**
```bash
npm run start:fe
```


## Project Structure

- `/notification_app_fe`: Next.js frontend dashboard using Material UI.
- `/notification_app_be`: Express.js backend for priority logic and notification sorting.
- `/logging_middleware`: Custom, type-safe logging package shared across the stack.
- `refresh-token.js`: Utility script to handle short-lived JWT tokens.


## Key Features

### 1. Reusable Logging Middleware
- Implemented `Log(stack, level, package, message)` signature.
- Handled message truncation (48 chars).
- Integrated into frontend page transitions and backend route handlers.

### 2. Priority Inbox Algorithm
The backend implements a custom weighting algorithm to bubble up the most important notifications:
- Weights: `Placement (3)` > `Result (2)` > `Event (1)`.
- Sorting: Notifications are sorted by weight descending, then by timestamp (recency) descending.
- Returns the Top 10 high-priority notifications.

### 3. Modern Dashboard
- Dark/Light Mode: Toggleable theme with local storage persistence.
- Read/Unread Tracking: Tracked via local storage with an "Undo" feature to mark as unread.
- Filtering & Pagination: Integration with the evaluation service's filtering system.



Candidate: PERI ADITYA GOUTAM  
Roll Number: CB.SC.P2CSE25029  
GitHub: AGMaster009
