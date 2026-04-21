# CityScope — Full Stack City Issue Reporting Platform

> Django + DRF + React + Vite + MySQL

---

## Project Structure

```
cityscope/
├── backend/
│   ├── cityscope/          # Django project (settings, urls, wsgi)
│   ├── accounts/           # User auth app
│   ├── issues/             # Issues, votes, comments, notifications
│   ├── media/              # Uploaded images (auto-created)
│   ├── manage.py
│   ├── requirements.txt
│   └── .env                # ← You must edit this
│
└── frontend/
    ├── src/
    │   ├── api/            # Axios + all API calls
    │   ├── context/        # AuthContext (JWT state)
    │   ├── pages/          # Login, Register, Feed, Report, Map, Dashboard, Detail
    │   ├── components/     # Layout, IssueCard
    │   ├── styles/         # global.css
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Step 1 — Prerequisites

Install the following before starting:
- **Python 3.10+** → https://www.python.org/downloads/
- **Node.js 18+** → https://nodejs.org/
- **MySQL 8+** → https://dev.mysql.com/downloads/mysql/
- **Git** (optional)

---

## Step 2 — MySQL Database Setup

Open your MySQL client (MySQL Workbench or terminal):

```sql
-- Create the database
CREATE DATABASE cityscope_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a user (or use root for development)
CREATE USER 'cityscope_user'@'localhost' IDENTIFIED BY 'yourpassword';
GRANT ALL PRIVILEGES ON cityscope_db.* TO 'cityscope_user'@'localhost';
FLUSH PRIVILEGES;
```

If you want to use the root user directly (simpler for dev), skip user creation — just note your root password.

---

## Step 3 — Backend Setup

### 3.1 Create and activate a virtual environment

```bash
cd cityscope/backend

# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 3.2 Install Python dependencies

```bash
pip install -r requirements.txt
```

> **macOS only:** If mysqlclient fails, install it first:
> ```bash
> brew install pkg-config mysqlclient
> ```
> **Windows:** If mysqlclient fails, install the binary wheel:
> ```bash
> pip install mysqlclient --only-binary=:all:
> ```

### 3.3 Configure environment variables

Edit the `.env` file in the `backend/` folder:

```env
SECRET_KEY=django-insecure-cityscope-change-this-in-production-xyz123
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=cityscope_db
DB_USER=root               # or cityscope_user
DB_PASSWORD=yourpassword   # ← change this
DB_HOST=127.0.0.1
DB_PORT=3306
```

### 3.4 Run database migrations

```bash
python manage.py makemigrations accounts
python manage.py makemigrations issues
python manage.py migrate
```

### 3.5 Create a superuser (admin)

```bash
python manage.py createsuperuser
# Enter: username, email, password
```

### 3.6 Start the Django development server

```bash
python manage.py runserver
```

Backend is now running at: **http://127.0.0.1:8000**
Django Admin panel: **http://127.0.0.1:8000/admin/**

---

## Step 4 — Frontend Setup

Open a **second terminal** (keep Django running in the first):

```bash
cd cityscope/frontend

# Install all npm packages
npm install

# Start the Vite dev server
npm run dev
```

Frontend is now running at: **http://localhost:5173**

> The Vite proxy in `vite.config.js` automatically forwards `/api` and `/media`
> requests to Django — no CORS issues in development.

---

## Step 5 — How to Use CityScope

1. Open **http://localhost:5173** in your browser
2. Click **Register** → create an account
3. Use **Report Issue** to file a city issue (click map to pin location)
4. Browse the **Feed** — sort by Priority, Severity, or Date
5. Open any issue → **Upvote** it or leave a **Comment**
6. Open the **Map** tab to see all issues plotted geographically
7. Open the **Dashboard** for category/status/trend charts
8. Log in as your **superuser** → the admin panel at `/admin` or the Issue Detail page shows a status-update control

---

## Step 6 — Testing with Postman

Import this base URL: `http://127.0.0.1:8000/api`

### Auth

| Method | Endpoint            | Body                                              |
|--------|---------------------|---------------------------------------------------|
| POST   | /auth/register/     | `{username, email, first_name, last_name, password, password2}` |
| POST   | /auth/login/        | `{username, password}` → returns `access` + `refresh` |
| POST   | /auth/token/refresh/| `{refresh}` → returns new `access`                |
| POST   | /auth/logout/       | `{refresh}` (Bearer header required)              |
| GET    | /auth/me/           | Bearer token required                             |

### Issues

| Method | Endpoint                   | Notes                              |
|--------|----------------------------|------------------------------------|
| GET    | /issues/                   | Supports: `?category=road&severity=high&status=reported&search=pothole&ordering=-priority_score` |
| POST   | /issues/                   | Multipart form: title, description, image, latitude, longitude, category, severity |
| GET    | /issues/{id}/              | Full detail with comments          |
| PATCH  | /issues/{id}/              | Owner can edit; admin can set status |
| DELETE | /issues/{id}/              | Owner or admin                     |
| GET    | /issues/mine/              | Your issues (auth required)        |

### Votes

| Method | Endpoint                   | Notes                              |
|--------|----------------------------|------------------------------------|
| POST   | /issues/{id}/vote/         | Toggles vote on/off (auth required)|

### Comments

| Method | Endpoint                       | Body                |
|--------|-------------------------------|---------------------|
| GET    | /issues/{id}/comments/        | List comments       |
| POST   | /issues/{id}/comments/        | `{text: "..."}` (auth required) |
| DELETE | /comments/{id}/               | Owner or admin      |

### Notifications

| Method | Endpoint                        | Notes                          |
|--------|---------------------------------|--------------------------------|
| GET    | /notifications/                 | Your notifications             |
| GET    | /notifications/unread-count/    | Returns `{unread_count: N}`    |
| POST   | /notifications/read/            | Mark all as read               |
| PATCH  | /notifications/{id}/read/       | Mark single as read            |

### Dashboard

| Method | Endpoint     | Notes           |
|--------|-------------|-----------------|
| GET    | /dashboard/ | Public endpoint |

### Admin Status Update

| Method | Endpoint                  | Body               | Auth       |
|--------|---------------------------|--------------------|------------|
| PATCH  | /issues/{id}/status/      | `{status: "resolved"}` | Admin only |

---

## Setting Authorization in Postman

1. Log in via `/auth/login/` → copy the `access` token
2. In any protected request: go to **Authorization** tab
3. Type: **Bearer Token**
4. Paste your access token

---

## Priority Algorithm

```
priority = (upvotes × 2) + severity_weight − age_factor

severity_weight:  low=1, medium=3, high=5
age_factor:       days_since_created × 0.1
```

Priority is automatically recalculated every time a vote is added/removed.

---

## Environment Notes

- **Media files** (issue photos) are stored in `backend/media/issues/`
- **JWT access token** expires in 1 hour; refresh token lasts 7 days
- **Admin panel** is available at `/admin/` — log in with your superuser
- **CORS** is configured to allow `localhost:5173` (Vite dev server only)
- For **production**, set `DEBUG=False`, configure a proper `SECRET_KEY`, and serve media/static files via nginx

---

## Common Troubleshooting

| Problem | Fix |
|---------|-----|
| `mysqlclient` install fails | Install MySQL dev headers: `sudo apt install libmysqlclient-dev` (Linux) / `brew install mysql` (macOS) |
| `django.db.utils.OperationalError` | Check `.env` DB credentials; ensure MySQL is running |
| Map not showing tiles | Ensure you have an internet connection (OpenStreetMap tiles) |
| CORS error | Make sure Django is on port 8000; Vite proxy handles `/api` |
| 401 Unauthorized in Postman | Add `Authorization: Bearer <your_access_token>` header |
| Images not loading | Ensure `DEBUG=True` and you're using the proxy (Vite dev server) |

