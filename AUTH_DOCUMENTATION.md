# Authentication API Documentation

## Overview
Sistem autentikasi untuk customer menggunakan JWT (JSON Web Token) dengan best practices security.

## Endpoints

### 1. Register Customer
**POST** `/auth/register`

Mendaftarkan customer baru ke sistem.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "08123456789",
  "password": "password123"
}
```

**Response Success (201):**
```json
{
  "message": "Registration successful",
  "data": {
    "customer": {
      "id": "uuid-string",
      "email": "john@example.com",
      "name": "John Doe",
      "phone": "08123456789",
      "createdAt": "2026-01-07T02:30:00.000Z",
      "updatedAt": "2026-01-07T02:30:00.000Z"
    },
    "token": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "Bearer",
      "expires_in": "7d"
    }
  }
}
```

**Response Error (409):**
```json
{
  "statusCode": 409,
  "message": "Email already registered",
  "error": "Conflict"
}
```

---

### 2. Login Customer
**POST** `/auth/login`

Login customer yang sudah terdaftar.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response Success (200):**
```json
{
  "message": "Login successful",
  "data": {
    "id": "uuid-string",
    "name": "John Doe",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response Error (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

---

### 3. Get Profile (Protected)
**GET** `/auth/profile`

Mendapatkan informasi profile customer yang sedang login.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response Success (200):**
```json
{
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid-string",
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "08123456789",
    "createdAt": "2026-01-07T02:30:00.000Z",
    "updatedAt": "2026-01-07T02:30:00.000Z"
  }
}
```

**Response Error (401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## Validation Rules

### Register DTO
- `name`: Required, string
- `email`: Required, valid email format
- `phone`: Optional, string
- `password`: Required, minimum 6 characters

### Login DTO
- `email`: Required, valid email format
- `password`: Required, string

---

## Security Features

1. **Password Hashing**: Menggunakan bcrypt dengan salt rounds 10
2. **JWT Token**: Token valid selama 7 hari
3. **Validation Pipe**: Otomatis validasi semua request DTO
4. **Protected Routes**: Menggunakan JwtAuthGuard untuk route yang memerlukan autentikasi
5. **Current User Decorator**: Custom decorator untuk mendapatkan user dari JWT payload

---

## How to Use JWT Guard

### Protect Single Route
```typescript
@Get('protected-route')
@UseGuards(JwtAuthGuard)
async protectedRoute(@CurrentUser() user: any) {
  return { message: 'This is protected', user };
}
```

### Protect Entire Controller
```typescript
@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  // All routes in this controller are protected
}
```

### Get Current User
```typescript
@Get('my-bookings')
@UseGuards(JwtAuthGuard)
async getMyBookings(@CurrentUser() user: any) {
  // user object contains: id, email, name, phone, createdAt, updatedAt
  return this.bookingsService.findByCustomer(user.id);
}
```

---

## Testing with Postman/Thunder Client

1. **Register/Login** untuk mendapatkan access_token
2. Copy `access_token` dari response
3. Untuk protected routes, tambahkan di Headers:
   - Key: `Authorization`
   - Value: `Bearer <paste-your-token-here>`

---

## Environment Variables

Pastikan file `.env` memiliki:
```env
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
DATABASE_URL="mysql://root:@localhost:3306/db_reservasi_futsal"
PORT=3333
```

⚠️ **PENTING**: Ganti `JWT_SECRET` dengan key yang kuat di production!
