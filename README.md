# 🏙️ CityScope — City Issue Reporting Platform

A full-stack civic technology web application that empowers citizens to report, track, and resolve city infrastructure issues. Built with Django REST Framework and React.

---

## 🚀 Live Features

- 📍 **Report Issues** — Submit complaints with location pinned on an interactive map
- 🗺️ **Map View** — See all reported issues plotted geographically
- 📊 **Dashboard** — Analytics with charts for categories, status, and trends
- 🔔 **Notifications** — Get notified when your issue status changes
- ⬆️ **Upvote System** — Community-driven priority ranking
- 💬 **Comments** — Discuss issues with other citizens
- ⚙️ **Admin Panel** — Full complaint management for administrators
- 🔐 **Role-Based Access** — Separate login flows for users and admins

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Custom CSS (Light Theme) |
| Maps | Leaflet + React-Leaflet |
| Charts | Recharts |
| HTTP Client | Axios |
| Backend | Django 4.1 + Django REST Framework |
| Authentication | JWT (djangorestframework-simplejwt) |
| Database | MySQL (XAMPP) |
| Image Upload | Pillow |
| Fonts | Outfit + Inter (Google Fonts) |

---

## 📁 Project Structure

```
cityscope_v3/
├── backend/
│   ├── cityscope/        # Django project settings
│   ├── accounts/         # User authentication app
│   ├── issues/           # Issues, votes, comments, notifications
│   ├── media/            # Uploaded images
│   ├── manage.py
│   ├── requirements.txt
│   └── .env              # Environment variables (not committed)
│
└── frontend/
    ├── src/
    │   ├── api/          # Axios API calls
    │   ├── context/      # Auth state (user + admin)
    │   ├── components/   # Layout, IssueCard, AdminLayout
    │   ├── pages/        # All page components
    │   │   └── admin/    # Admin panel pages
    │   └── styles/       # Global CSS design system
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- XAMPP (for MySQL)
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/sabarinath-as/CityScope.git
cd CityScope
```

---

### 2. Database Setup

- Open XAMPP Control Panel and start **Apache** and **MySQL**
- Open **http://localhost/phpmyadmin**
- Create a new database: `cityscope_app`
- Collation: `utf8mb4_unicode_ci`

---

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows CMD)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install django==4.1.13 djangorestframework djangorestframework-simplejwt django-cors-headers python-decouple django-filter
pip install Pillow --only-binary=:all:
pip install mysqlclient --only-binary=:all:
```

Create a `.env` file inside the `backend/` folder:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=cityscope_app
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306
```

```bash
# Run migrations
python manage.py makemigrations accounts
python manage.py makemigrations issues
python manage.py migrate

# Create admin superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

Backend running at: **http://127.0.0.1:8000**

---

### 4. Frontend Setup

Open a second terminal:

```bash
cd frontend

# Install packages
npm install

# Start development server
npm run dev
```

Frontend running at: **http://localhost:5173**

---

## 🔗 Access URLs

| URL | Description |
|-----|-------------|
| http://localhost:5173 | Public site |
| http://localhost:5173/admin/login | Admin panel |
| http://127.0.0.1:8000/api/issues/ | API test |
| http://localhost/phpmyadmin | Database |
| http://127.0.0.1:8000/django-admin/ | Django admin |

---

## 📡 API Endpoints

### Auth
```
POST   /api/auth/register/         Register new user
POST   /api/auth/login/            User login
POST   /api/auth/admin-login/      Admin login (staff only)
POST   /api/auth/token/refresh/    Refresh access token
POST   /api/auth/logout/           Logout and blacklist token
GET    /api/auth/me/               Get current user
```

### Issues
```
GET    /api/issues/                List all issues (filter, search, paginate)
POST   /api/issues/                Create new issue
GET    /api/issues/<id>/           Issue detail with comments
POST   /api/issues/<id>/vote/      Toggle upvote
POST   /api/issues/<id>/comments/  Post a comment
GET    /api/dashboard/             Public analytics data
```

### Admin (requires admin JWT)
```
GET    /api/admin/dashboard/           Stats and trends
GET    /api/admin/complaints/          All complaints
PATCH  /api/admin/complaints/<id>/     Update status + remark
DELETE /api/admin/complaints/<id>/     Delete complaint
GET    /api/admin/users/               All registered users
```

---

## ⚡ Priority Algorithm

Issues are ranked using this formula:

```
Priority = (Upvotes × 2) + Severity Weight − Age Factor

Severity Weight : Low = 1 | Medium = 3 | High = 5
Age Factor      : Days since created × 0.1
```

---

## 🔐 Authentication

- Users and admins have **completely separate login flows**
- JWT access tokens expire in **1 hour**
- Refresh tokens valid for **7 days**
- Tokens are auto-refreshed silently via Axios interceptors
- Logout blacklists the refresh token on the server

---

## 👤 User Roles

| Feature | Guest | User | Admin |
|---------|-------|------|-------|
| Browse feed / map / dashboard | ✅ | ✅ | ✅ |
| Submit issues | ❌ | ✅ | ✅ |
| Upvote / comment | ❌ | ✅ | ✅ |
| Update issue status | ❌ | ❌ | ✅ |
| Add admin remarks | ❌ | ❌ | ✅ |
| Delete any complaint | ❌ | ❌ | ✅ |
| View admin panel | ❌ | ❌ | ✅ |

---

## 📸 Issue Categories

| Category | Description |
|----------|-------------|
| 🛣️ Road | Potholes, cracks, damaged footpaths |
| 💧 Water | Leaks, no supply, sewage overflow |
| ⚡ Electricity | Broken lights, transformer issues |
| 🗑️ Waste | Garbage dumping, overflowing bins |

---

## 🧪 Common Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError: django` | Activate venv: `venv\Scripts\activate` |
| `Access denied for root@localhost` | Set `DB_PASSWORD=` (blank) in `.env` |
| `Unknown column 'admin_comment'` | Run in phpMyAdmin SQL: `ALTER TABLE issues_issue ADD COLUMN admin_comment LONGTEXT NOT NULL DEFAULT '';` |
| Pillow install fails | `pip install Pillow --only-binary=:all:` |
| mysqlclient install fails | `pip install mysqlclient --only-binary=:all:` |
| Map shows grey tiles | Internet connection needed for OpenStreetMap |

---

## 🙋 Author

**Sabarinath A S**
- GitHub: [@sabarinath-as](https://github.com/sabarinath-as)

---

## 📄 License

This project is for educational purposes.
