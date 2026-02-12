# ABIC System - Commands & Troubleshooting Reference

## Essential Commands

### Start Everything

#### Terminal 1 (Backend)
```bash
cd c:\MY PROJECTS\ABIC-ACCOUNTING-FRONTEND\backend
php artisan serve
```

#### Terminal 2 (Frontend)
```bash
cd c:\MY PROJECTS\ABIC-ACCOUNTING-FRONTEND
npm run serve
```

### Database Setup

```bash
# One-time database creation
mysql -u root -p
CREATE DATABASE admin_head;
exit

# Run migrations
cd backend
php artisan migrate

# Reset database (WARNING: deletes all data)
php artisan migrate:refresh

# Check if table exists
php artisan migrate:status
```

### Laravel Commands

```bash
# Interactive console
php artisan tinker

# Generate application key
php artisan key:generate

# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# View logs
tail -f storage/logs/laravel.log

# Create new migration
php artisan make:migration migration_name

# Run migrations
php artisan migrate
```

### NPM Commands

```bash
# Install dependencies
npm install

# Start development server
npm run serve

# Build for production
npm run build

# Run linter
npm run lint
```

---

## Troubleshooting Guide

### Problem: "SQLSTATE[42S02]: Table or view not found"

**Cause**: Database tables not created

**Solution**:
```bash
cd backend
php artisan migrate
```

---

### Problem: "Connection refused" on port 3000/8000

**Cause**: Server not running or port in use

**Solution**:
```bash
# Check if port is in use (Windows)
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# Kill process on port (Windows)
taskkill /PID <PID> /F

# Try different port
php artisan serve --port=8001
npm run dev -- -p 3001
```

---

### Problem: "SMTP Error: Could not authenticate"

**Cause**: Gmail credentials incorrect

**Solution**:
1. Verify app password: `iqoj qqxa ghnq vgim`
2. Check `MAIL_USERNAME` and `MAIL_PASSWORD` in `backend/.env`
3. Ensure 2FA is enabled on Gmail account
4. Regenerate app password if needed

Test connection:
```bash
php artisan tinker
>>> Mail::raw('test', function($msg) { $msg->to('test@example.com'); });
```

---

### Problem: "Access denied for user 'root'@'localhost'"

**Cause**: Database credentials incorrect

**Solution**:
1. Verify MySQL is running
2. Check credentials in `backend/.env`:
   ```
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=admin_head
   DB_USERNAME=root
   DB_PASSWORD=
   ```
3. Test connection:
   ```bash
   mysql -u root
   ```

---

### Problem: "CORS error" or "fetch failed"

**Cause**: Frontend/Backend communication issue

**Solution**:
1. Verify Laravel is running on port 8000
2. Check `LARAVEL_API_URL` in frontend `.env`:
   ```
   LARAVEL_API_URL=http://localhost:8000/api
   ```
3. Verify correct API endpoint in code
4. Check browser console for exact error

---

### Problem: "Module not found" or "Cannot find package"

**Cause**: Dependencies not installed

**Solution**:
```bash
# Frontend
rm -r node_modules package-lock.json
npm install

# Backend
cd backend
rm -r vendor composer.lock
composer install
```

---

### Problem: "TypeError: Cannot read property 'email' of undefined"

**Cause**: Employee not found in database

**Solution**:
1. Verify employee exists:
   ```sql
   SELECT * FROM employees WHERE email = 'test@example.com';
   ```
2. Check email spelling (case-sensitive)
3. Create new employee through admin panel

---

### Problem: "Password not working after creation"

**Cause**: Using old password instead of auto-generated one

**Solution**:
1. Check email for welcome message with temp password
2. If email not received, check spam folder
3. If still not received:
   ```bash
   # Check email logs in Laravel
   php artisan mail:send
   
   # Reset password for employee
   php artisan tinker
   >>> $emp = Employee::find(1);
   >>> $emp->password = Hash::make('newpassword');
   >>> $emp->save();
   ```

---

### Problem: "Email not sending"

**Cause**: Multiple possible causes

**Solution**:

1. **Check email configuration**:
   ```bash
   php artisan tinker
   >>> config('mail')
   ```

2. **Send test email**:
   ```bash
   php artisan mail:send --class=EmployeeWelcome --to=test@example.com
   ```

3. **Check logs**:
   ```bash
   tail -f storage/logs/laravel.log
   ```

4. **Verify Gmail settings**:
   - Check 2FA is enabled
   - Generate new app password
   - Add to `backend/.env`

5. **Alternative**: Use different email provider in `backend/.env`

---

### Problem: "localStorage is not defined"

**Cause**: Running in server-side rendering context

**Solution**: Verify `"use client"` at top of page:
```tsx
"use client"

import React from 'react'
```

---

### Problem: "Cannot read property 'push' of undefined"

**Cause**: Router not initialized in client component

**Solution**: Add proper imports and usage:
```tsx
"use client"

import { useRouter } from 'next/navigation'

export default function MyComponent() {
  const router = useRouter()
  // Use router.push()
}
```

---

## Database Query Examples

### Check all employees
```sql
SELECT id, first_name, last_name, email, created_at FROM employees;
```

### Find employee by email
```sql
SELECT * FROM employees WHERE email = 'john@example.com';
```

### Count total employees
```sql
SELECT COUNT(*) FROM employees;
```

### Get employees created today
```sql
SELECT * FROM employees WHERE DATE(created_at) = CURDATE();
```

### Update employee password (Emergency)
```sql
UPDATE employees SET password = '$2y$12$hashedpassword' WHERE email = 'test@example.com';
```

### Delete employee
```sql
DELETE FROM employees WHERE id = 1;
```

---

## API Testing with cURL

### Create Employee
```bash
curl -X POST http://localhost:8000/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/employees/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "temporary123"
  }'
```

### Get Employee Profile
```bash
curl -X GET "http://localhost:8000/api/employees-profile?email=john@example.com"
```

### Update Employee
```bash
curl -X PUT http://localhost:8000/api/employees/1 \
  -H "Content-Type: application/json" \
  -d '{
    "position": "Manager",
    "mobile_number": "09123456789"
  }'
```

### Change Password
```bash
curl -X POST http://localhost:8000/api/employees/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "old_password": "temporary123",
    "new_password": "newpassword123",
    "new_password_confirmation": "newpassword123"
  }'
```

---

## Development Tips

### Enable Query Logging (Debug queries)
In `backend/config/database.php`:
```php
'connections' => [
    'mysql' => [
        ...
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ],
    ],
],
```

### Get SQL queries executed
```bash
php artisan tinker
>>> DB::enableQueryLog();
>>> Employee::all();
>>> dd(DB::getQueryLog());
```

### Check Node version
```bash
node --version
npm --version
```

### Check PHP version
```bash
php --version
php artisan --version
```

### Check Composer version
```bash
composer --version
```

---

## Performance Tips

### Clear Caches (improves performance)
```bash
php artisan optimize:clear
```

### Enable Query Caching
```bash
php artisan config:cache
php artisan route:cache
```

### Monitor with Laravel Telescope
```bash
composer require laravel/telescope
php artisan telescope:install
```

---

## Security Checks

### Enable HTTPS in production
```bash
# Update APP_URL in .env
APP_URL=https://yourdomain.com

# Update FRONTEND_URL
FRONTEND_URL=https://yourdomain.com
```

### Restrict API endpoints
Add authentication middleware to sensitive routes:
```php
// In routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    // Protected routes
});
```

---

## Emergency Procedures

### Restore from backup
```bash
# If database corrupted
mysql admin_head < backup.sql
```

### Force reset (ALL DATA LOST)
```bash
# Drop and recreate database
mysql -u root -p
DROP DATABASE admin_head;
CREATE DATABASE admin_head;
exit

# Run migrations
php artisan migrate
```

### Restart everything
```bash
# Kill all Node processes
taskkill /F /IM node.exe

# Kill all PHP processes
taskkill /F /IM php.exe

# Restart servers
```

---

## Useful Resources

- [Laravel Documentation](https://laravel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Composer Documentation](https://getcomposer.org/doc/)
- [NPM Documentation](https://docs.npmjs.com/)

---

**Last Updated**: February 12, 2026
