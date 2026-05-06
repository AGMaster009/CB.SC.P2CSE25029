# Notification System Design

## Stage 1
### REST API Design
To make a good notification platform, I defined these core actions and endpoints:

1. Fetch Notifications
   - Endpoint: GET /api/v1/notifications
   - Headers: Authorization: Bearer <token>
   - Query Params: page (integer), limit (integer), type (Event | Result | Placement), status (unread | all)
   - Response:
     ```json
     {
       "data": [
         {
           "id": "uuid",
           "type": "Placement",
           "message": "CSX Corporation hiring",
           "is_read": false,
           "created_at": "2026-04-22T17:51:18Z"
         }
       ],
       "meta": { "total": 45, "page": 1, "limit": 10 }
     }
     ```

2. Mark Notification as Read
   - Endpoint: PATCH /api/v1/notifications/{id}/read
   - Headers: Authorization: Bearer <token>
   - Response: 200 OK

3. Mark All as Read
   - Endpoint: POST /api/v1/notifications/read-all
   - Headers: Authorization: Bearer <token>
   - Response: 200 OK

### Real-time Notifications Mechanism
For real-time delivery, WebSockets (like Socket.io) should be used. When a user logs in, the frontend makes a persistent connection. The backend sends events to a specific user channel whenever a new notification comes in, so the UI reacts instantly without needing to refresh.

---

## Stage 2
### Persistent Storage Choice
I recommend using PostgreSQL. It is a solid relational database. Relational DBs are great for notifications because we have a clear structure and need to filter by things like type or unread status and sort by time.

### Database Schema
```sql
CREATE TYPE notif_type AS ENUM ('Event', 'Result', 'Placement');

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id INT NOT NULL,
    type notif_type NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Scaling Problems & Solutions
- Problem: If the data gets huge (millions of rows), simple queries will get slow because the table is too big.
- Solution: 
  1. Table Partitioning: Split the notifications table by date (like every month). Old notifications don't get checked much anyway.
  2. Read Replicas: Send read queries to a copy of the database so the main one doesn't get overwhelmed.
  3. Data Archival: Move notifications older than 6 months to a separate storage (like S3).

---

## Stage 3
### Query Analysis
The query given is:
```sql
SELECT * FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt ASC;
```
- Accuracy: This query works to find unread notifications for a student. But usually, apps show the newest stuff first, so ORDER BY createdAt DESC would be better for the user.
- Why is it slow? Without a proper index, the database has to scan the whole table or sort everything in memory. With 5 million rows, sorting unindexed data takes way too long.
- Changes & Computation Cost: I would add a composite index: CREATE INDEX idx_student_unread_date ON notifications (studentID, isRead, createdAt DESC). This makes the query much faster (logarithmic time).

### Indexing Every Column?
Adding an index on every single column is bad advice. 
- Why? Every index makes INSERT, UPDATE, and DELETE slower because the database has to update those indexes too. It also uses up a lot of extra space. You should only index columns you actually use in WHERE or ORDER BY.

### Query for Placement Notifications
```sql
SELECT DISTINCT studentID 
FROM notifications 
WHERE notificationType = 'Placement' 
  AND createdAt >= NOW() - INTERVAL '7 days';
```

---

## Stage 4
### Performance Solutions for High Page Load Reads
If every page load triggers a database read and slows things down:
1. Caching (Redis): Save the recent notifications and unread counts in Redis. When a page loads, the frontend gets data from Redis (which is super fast) instead of checking the main database. You only update the cache when a new notification is made.
2. Pagination: Don't fetch everything at once. Just get 10 at a time using LIMIT.

### Tradeoffs
- Redis: Pros: Way faster and saves the database from work. Cons: It's another thing to manage and sometimes the cache might have old data.
- Pagination: Pros: Very easy to do in SQL. Cons: If a user tries to go to page 10,000, it starts getting slow.

---

## Stage 5
### Shortcomings of the notify_all pseudocode
1. Sequential loop: The loop goes one by one. If sending one email takes half a second, sending 50,000 will take hours.
2. No Error Handling: If it crashes in the middle, some students get it and some don't. If you run it again, the first group gets a duplicate email.
3. Database and Email issues: If the database fails after the email is sent, the records won't match reality.

### Redesign
Saving to the DB and sending the email shouldn't happen at the exact same time in the same loop. You should use a Message Queue. You save the notification job in the database first, and then background workers process that list and handle retries if something fails.

### Revised Pseudocode
```python
# Just save the job to the database quickly
function notify_all(student_ids: array, message: string):
    enqueue_notification_jobs(student_ids, message)
    return "Notifications scheduled"

# Background worker handles the actual work
function process_job_from_queue():
    while job = pop_from_queue():
        try:
            save_to_db(job.student_id, job.message)
            push_to_app(job.student_id, job.message)
            send_email(job.student_id, job.message)
            mark_job_success(job.id)
        except Exception:
            # Retry if it fails
            mark_job_failed_for_retry(job.id)
```

---

## Stage 6
### Priority Algorithm Approach
To show the Top 10 notifications:
1. Scoring: Give points based on type: Placement = 300, Result = 200, Event = 100. Newer ones get a bonus.
2. Sorting: Get the notifications, calculate the score for each, sort them, and pick the top 10.
3. Heap: To keep it fast when new notifications come in, you can use a Min-Heap of size 10. If a new one has a higher score than the lowest in the heap, you swap them.
