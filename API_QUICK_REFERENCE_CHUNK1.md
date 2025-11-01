# API Quick Reference - Chunk 1: Pet Owner Authentication

## Base URL
```
http://localhost:8000/api/auth/
```

---

## Endpoints

### 1. Register New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "contact_info": "09123456789"
}
```

**Response 201**:
```json
{
  "success": true,
  "user_id": 123,
  "message": "OTP sent to email"
}
```

---

### 2. Send/Resend OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "purpose": "account_creation"
}
```
*Purpose options: `account_creation` | `password_reset`*

**Response 200**:
```json
{
  "success": true,
  "message": "OTP sent to email"
}
```

---

### 3. Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp_code": "123456",
  "purpose": "account_creation"
}
```

**Response 200**:
```json
{
  "success": true,
  "message": "Account verified successfully. You can now log in."
}
```

---

### 4. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response 200**:
```json
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 123,
    "email": "john@example.com",
    "name": "John Doe",
    "username": "john",
    "contact_info": "09123456789",
    "is_verified": true
  }
}
```

---

### 5. Request Password Reset
```http
POST /api/auth/request-password-reset
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response 200**:
```json
{
  "success": true,
  "message": "If the email is registered, a password reset code has been sent."
}
```

---

### 6. Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "john@example.com",
  "otp_code": "654321",
  "new_password": "NewSecurePass123!"
}
```

**Response 200**:
```json
{
  "success": true,
  "message": "Password reset successfully. Please log in with your new password."
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "field_name": ["Error message"]
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid email or password",
  "code": "INVALID_CREDENTIALS"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Account is not active. Please verify your email.",
  "code": "ACCOUNT_INACTIVE"
}
```

### 422 Unprocessable Entity
```json
{
  "success": false,
  "error": "OTP has expired. Please request a new code.",
  "code": "OTP_EXPIRED"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Too many OTP requests. Please try again in 1 hour.",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

---

## Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*(),.?":{}|<>)

**Valid Examples**:
- `SecurePass123!`
- `MyP@ssw0rd`
- `Strong#Password1`

**Invalid Examples**:
- `weak` (too short, no uppercase, no number, no special)
- `password123` (no uppercase, no special)
- `PASSWORD123!` (no lowercase)

---

## OTP Rules
- **Format**: 6-digit numeric code
- **Expiration**: 10 minutes
- **Max Attempts**: 3 failed attempts
- **Cooldown**: 5 minutes after 3 failed attempts
- **Rate Limit**: 3 OTP requests per hour

---

## JWT Token
- **Header**: `Authorization: Bearer <token>`
- **Expiration**: 24 hours
- **Payload**:
  ```json
  {
    "user_id": 123,
    "email": "john@example.com",
    "username": "john",
    "exp": 1762088404,
    "iat": 1762002004
  }
  ```

---

## Common Workflows

### Registration + Verification
```
1. POST /api/auth/register
2. (Check email for OTP)
3. POST /api/auth/verify-otp
4. POST /api/auth/login
```

### Password Reset
```
1. POST /api/auth/request-password-reset
2. (Check email for OTP)
3. POST /api/auth/reset-password
4. POST /api/auth/login (with new password)
```

### Resend OTP
```
POST /api/auth/send-otp
{
  "email": "john@example.com",
  "purpose": "account_creation"
}
```

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "contact_info": "09123456789"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### Verify OTP
```bash
curl -X POST http://localhost:8000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp_code": "123456",
    "purpose": "account_creation"
  }'
```

---

## Postman Collection

Import these endpoints to Postman:

```json
{
  "info": {
    "name": "PawPal Auth - Chunk 1",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Register",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Test User\",\n  \"email\": \"test@example.com\",\n  \"password\": \"SecurePass123!\",\n  \"contact_info\": \"09123456789\"\n}"
        },
        "url": "{{base_url}}/api/auth/register"
      }
    }
  ]
}
```

**Environment Variable**: `base_url = http://localhost:8000`

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/send-otp` | 3 requests | 1 hour |
| `/request-password-reset` | 3 requests | 1 hour |
| `/verify-otp` | 3 attempts | Per OTP code |

---

## Status: ✅ READY FOR PRODUCTION
All endpoints tested and working correctly.

