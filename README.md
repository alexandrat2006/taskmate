# TaskMate

A web application that helps students create, organize and track assignments and deadlines.

**Stack:** React (Vite) · Node.js · Express · MySQL · JWT · Git

## Features

- Sign up / log in with JWT authentication (passwords hashed with bcrypt)
- Create, edit, delete tasks with deadline, priority, status, course and category
- Deadline markers that show how many days are left, or how late a task is
- Filter by status, course, category, priority and due date (overdue, today, next 7 days)
- Full-text style search in title and notes
- Sort by deadline, priority, date added or title (ascending / descending)
- Progress overview in the sidebar
- Every query is scoped to the logged-in user

## Database

Four tables, defined in [`database/schema.sql`](database/schema.sql):

```
users (id, name, email, password_hash, created_at)
courses (id, user_id → users, name, color)
categories (id, user_id → users, name)
tasks (id, user_id → users, course_id → courses, category_id → categories,
       title, description, deadline, priority, status, created_at, updated_at)
```

Deleting a user removes their data. Deleting a course or category keeps its tasks (`ON DELETE SET NULL`).

## Getting started

Requirements: Node.js 18+ and MySQL 8+.

```bash
# 1. Database
mysql -u root -p < database/schema.sql

# 2. API
cd server
cp .env.example .env        # then edit DB_PASSWORD and JWT_SECRET
npm install
npm run dev                 # http://localhost:5000

# 3. Client (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

Open http://localhost:5173, create an account and add your first course.
Optional demo data: `mysql -u root -p taskmate < database/seed.sql` (after registering the first user).

## REST API

All routes except `/api/auth/*` need the header `Authorization: Bearer <token>`.

| Method | Route | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in, returns token |
| GET | `/api/auth/me` | Current user |
| GET | `/api/tasks` | List tasks. Query: `status`, `course_id`, `category_id`, `priority`, `due`, `q`, `sort`, `order` |
| GET | `/api/tasks/stats` | Totals, done, overdue, due this week |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET/POST/DELETE | `/api/courses` | Manage courses |
| GET/POST/DELETE | `/api/categories` | Manage categories |

Example:

```
GET /api/tasks?status=open&course_id=2&sort=priority&order=asc
```

## Project structure

```
taskmate/
├── database/   schema.sql, seed.sql
├── server/     Express API (routes, auth middleware, MySQL pool)
└── client/     React app (Vite)
```

## Git workflow

Work was done on feature branches (`feature/auth`, `feature/tasks-api`, `feature/ui`, …) with regular commits, merged into `main`.

## Author

Alexandra Trifut, [github.com/alexandrat2006](https://github.com/alexandrat2006)
