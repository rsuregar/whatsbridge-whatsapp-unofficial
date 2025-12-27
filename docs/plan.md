# NotifWA Development Plan

## Completed Features

### 1. User Management System ✅
- **Database Support**: SQLite (default), MySQL/MariaDB, PostgreSQL
- **User Registration**: Email, username, password with plan selection (free/pro)
- **User Authentication**: Login with email/username and password
- **API Key Management**: Per-user API key generation and management
- **User Profile**: View and manage user profile information

### 2. Database Configuration ✅
- TypeORM integration with multiple database support
- Environment-based configuration
- Automatic schema synchronization
- Database connection management with graceful shutdown

### 3. API Authentication ✅
- Updated API key middleware to support:
  - User-based API keys (from database)
  - Legacy global API key (environment variable)
  - Fallback to open access if neither is configured

### 4. Dashboard Updates ✅
- User registration form with plan selection
- Login/Register toggle
- User profile display in header
- API key management modal
- Generate/regenerate API keys from dashboard

## Current Implementation

### Database Models
- **User**: Stores user information, API keys, and subscription plans

### API Routes
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User authentication
- `GET /api/users/profile` - Get user profile (protected)
- `POST /api/users/api-key/generate` - Generate API key (protected)
- `PATCH /api/users/plan` - Update user plan (protected)

### Environment Variables
- `DB_TYPE` - Database type (sqlite, mysql, mariadb, postgres)
- `DB_PATH` - SQLite database path (default: data)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - Database connection (for MySQL/PostgreSQL)
- `DB_SYNC` - Auto-sync schema (default: true for SQLite)
- `DB_LOGGING` - Enable query logging

## Next Steps (Optional Enhancements)

1. **Admin Panel**: Admin user management interface
2. **Plan Features**: Implement plan-based feature restrictions
3. **Rate Limiting**: Per-user rate limiting based on plan
4. **Session Management**: User session tracking and management
5. **Password Reset**: Email-based password reset functionality
6. **Two-Factor Authentication**: Optional 2FA for enhanced security

## Technical Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **Database ORM**: TypeORM
- **Authentication**: bcryptjs for password hashing
- **API Key Generation**: crypto.randomBytes
