# Contoh Testing Authentication API

## Setup
Base URL: `http://localhost:3333`

---

## 1. Test Register Customer

### Request
```bash
curl -X POST http://localhost:3333/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "08123456789",
    "password": "password123"
  }'
```

### Expected Response (201 Created)
```json
{
  "message": "Registration successful",
  "data": {
    "customer": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "name": "John Doe",
      "phone": "08123456789",
      "createdAt": "2026-01-07T06:41:30.123Z",
      "updatedAt": "2026-01-07T06:41:30.123Z"
    },
    "token": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJuYW1lIjoiSm9obiBEb2UiLCJpYXQiOjE3MDQ2MTMyOTAsImV4cCI6MTcwNTIxODA5MH0.abc123xyz",
      "token_type": "Bearer",
      "expires_in": "7d"
    }
  }
}
```

---

## 2. Test Register dengan Email Duplicate

### Request
```bash
curl -X POST http://localhost:3333/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "john@example.com",
    "phone": "08129876543",
    "password": "password456"
  }'
```

### Expected Response (409 Conflict)
```json
{
  "statusCode": 409,
  "message": "Email already registered",
  "error": "Conflict"
}
```

---

## 3. Test Login Customer

### Request
```bash
curl -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Expected Response (200 OK)
```json
{
  "message": "Login successful",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJuYW1lIjoiSm9obiBEb2UiLCJpYXQiOjE3MDQ2MTMzNTAsImV4cCI6MTcwNTIxODE1MH0.def456uvw"
  }
}
```

---

## 4. Test Login dengan Kredensial Salah

### Request
```bash
curl -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "wrongpassword"
  }'
```

### Expected Response (401 Unauthorized)
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

---

## 5. Test Get Profile (Protected Route)

### Request
```bash
# Gunakan access_token dari response login/register
curl -X GET http://localhost:3333/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJuYW1lIjoiSm9obiBEb2UiLCJpYXQiOjE3MDQ2MTMzNTAsImV4cCI6MTcwNTIxODE1MH0.def456uvw"
```

### Expected Response (200 OK)
```json
{
  "message": "Profile retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "08123456789",
    "createdAt": "2026-01-07T06:41:30.123Z",
    "updatedAt": "2026-01-07T06:41:30.123Z"
  }
}
```

---

## 6. Test Get Profile tanpa Token

### Request
```bash
curl -X GET http://localhost:3333/auth/profile
```

### Expected Response (401 Unauthorized)
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## 7. Test Validation Error

### Request - Email tidak valid
```bash
curl -X POST http://localhost:3333/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "invalid-email",
    "password": "123"
  }'
```

### Expected Response (400 Bad Request)
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

---

## Testing dengan Postman/Thunder Client

### 1. Import Collection
Buat collection baru dengan endpoints berikut:

**Collection: Reservasi Futsal - Auth**

### 2. Setup Environment Variables
- `base_url`: `http://localhost:3333`
- `access_token`: (akan diisi otomatis dari response)

### 3. Test Flow
1. **Register** → Save `access_token` dari response
2. **Login** → Update `access_token` jika berbeda
3. **Get Profile** → Gunakan saved `access_token`

### 4. Auto-save Token (Postman)
Di tab "Tests" pada request Login/Register, tambahkan:
```javascript
// Save token to environment
const response = pm.response.json();
if (response.data && response.data.token) {
    pm.environment.set("access_token", response.data.token.access_token);
}
```

Lalu di request Get Profile, di Authorization pilih:
- Type: Bearer Token
- Token: `{{access_token}}`

---

## Security Checklist ✅

- ✅ Password di-hash dengan bcrypt (salt 10)
- ✅ JWT token dengan expiry 7 hari
- ✅ Protected routes dengan JwtAuthGuard
- ✅ Validation untuk semua input
- ✅ Email unique constraint di database
- ✅ Password tidak di-return dalam response
- ✅ Custom decorator untuk get current user
- ✅ Proper HTTP status codes
- ✅ Standardized error responses
