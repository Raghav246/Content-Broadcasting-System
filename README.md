# Content Broadcasting System

A backend system for broadcasting educational content from teachers to students, with principal-based approval workflow.

## Tech Stack
- **Runtime**: Node.js (Express)
- **Database**: PostgreSQL
- **Auth**: JWT + bcrypt
- **File Upload**: Multer — local storage (default) or AWS S3 (bonus)
- **Caching**: Redis via ioredis (bonus)
- **Rate Limiting**: express-rate-limit (bonus)

## Setup

### 1. Prerequisites
- Node.js >= 18
- PostgreSQL running locally
- Redis (optional — for caching bonus)

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your DB credentials and JWT secret
```

### 4. Create database and run schema
```bash
psql -U postgres -c "CREATE DATABASE content_broadcasting;"
psql -U postgres -d content_broadcasting -f src/utils/schema.sql
```

### 5. Start the server
```bash
npm run dev      # development (nodemon)
npm start        # production
```

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a user (principal/teacher) |
| POST | `/auth/login` | Login and receive JWT |

**Register body:**
```json
{ "name": "John", "email": "john@example.com", "password": "secret", "role": "teacher" }
```

**Login body:**
```json
{ "email": "john@example.com", "password": "secret" }
```

---

### Content (Protected — Bearer Token required)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/content/upload` | Teacher | Upload content (multipart/form-data) |
| GET | `/content/my` | Teacher | View own uploaded content |
| GET | `/content` | Principal | View all content with filters & pagination |
| PATCH | `/content/:id/approve` | Principal | Approve content |
| PATCH | `/content/:id/reject` | Principal | Reject content with reason |

**Upload form fields:**
- `file` (required) — JPG/PNG/GIF, max 10MB
- `title` (required)
- `subject` (required) — e.g. maths, science
- `description` (optional)
- `start_time` (optional) — ISO datetime
- `end_time` (optional) — ISO datetime
- `rotation_duration` (optional) — minutes per slot (default: 5)

**GET /content query params (all optional):**
- `?status=pending` — filter by status (pending/approved/rejected)
- `?subject=maths` — filter by subject
- `?teacher_id=1` — filter by teacher
- `?page=1&limit=20` — pagination (default: page 1, limit 20, max 100)

**Reject body:**
```json
{ "rejection_reason": "Content is not relevant" }
```

---

### Public Broadcasting (No auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/content/live/:teacherId` | Get currently active content for a teacher |

**Query params:**
- `?subject=maths` — filter by subject (optional)

**Rate limit:** 60 requests/minute per IP

**Response (active content):**
```json
{
  "active_content": [
    {
      "id": 1,
      "title": "Algebra Basics",
      "subject": "maths",
      "file_url": "/uploads/filename.jpg",
      "start_time": "...",
      "end_time": "...",
      "rotation_order": 1,
      "duration": 5
    }
  ]
}
```

**Response (no content):**
```json
{ "message": "No content available" }
```

---

### Analytics (Protected — Principal only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/subjects` | Most active subjects by hit count |
| GET | `/analytics/content` | Top 50 most-served content items |

**Subject analytics response:**
```json
{
  "analytics": [
    { "subject": "maths", "total_hits": 120, "unique_content_served": 3, "last_accessed": "..." }
  ]
}
```

---

## Content Lifecycle
```
uploaded → pending → approved / rejected
```
- Approved content is only shown within its `start_time` / `end_time` window
- Multiple approved content items per subject rotate based on `duration` (minutes)

## Scheduling Logic
- Each subject has an independent rotation cycle
- Active content is determined by: `(NOW - anchor) % totalCycleDuration`
- Stateless — computed on every request, no cron jobs needed

## Bonus Features Implemented
| Feature | Status | Details |
|---------|--------|---------|
| Redis Caching | ✅ | `/content/live` cached with configurable TTL (default 30s). Gracefully disabled if Redis unavailable. |
| Rate Limiting | ✅ | 60 req/min per IP on public broadcast endpoint |
| S3 Upload | ✅ | Set `USE_S3=true` in `.env` with AWS credentials to switch from local to S3 storage |
| Subject-wise Analytics | ✅ | `/analytics/subjects` and `/analytics/content` endpoints |
| Pagination & Filters | ✅ | `GET /content` supports `status`, `subject`, `teacher_id`, `page`, `limit` |

## Assumptions
- A user can only be either a principal or a teacher (set at registration)
- Content without `start_time`/`end_time` is never shown on the live endpoint
- `rotation_duration` at upload time auto-creates the schedule entry
- Redis is optional — system works without it (cache silently disabled)
- S3 is optional — local storage is the default
