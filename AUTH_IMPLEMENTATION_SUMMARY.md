# 🔐 Sistem Autentikasi Customer - Struktur & Best Practices

## ✅ Fitur yang Sudah Diimplementasi

### 1. **Authentication Endpoints**
- ✅ `POST /auth/register` - Registrasi customer baru
- ✅ `POST /auth/login` - Login customer
- ✅ `GET /auth/profile` - Get profile (protected)

### 2. **Security Features**
- ✅ Password hashing dengan bcrypt (salt rounds: 10)
- ✅ JWT authentication dengan expiry 7 hari
- ✅ Protected routes menggunakan JwtAuthGuard
- ✅ Request validation dengan class-validator
- ✅ Custom decorator @CurrentUser()
- ✅ Proper error handling

### 3. **Database**
- ✅ Customer model dengan UUID
- ✅ Unique constraint pada email
- ✅ Password tidak pernah di-return dalam response

---

## 📁 Struktur File

```
src/
├── auth/
│   ├── decorators/
│   │   └── current-user.decorator.ts    # Custom decorator untuk get current user
│   ├── dto/
│   │   ├── register.dto.ts              # DTO untuk registrasi
│   │   ├── login.dto.ts                 # DTO untuk login
│   │   └── index.ts                     # Export semua DTOs
│   ├── guards/
│   │   ├── jwt-auth.guard.ts            # Guard untuk protect routes
│   │   └── index.ts                     # Export guards
│   ├── strategies/
│   │   └── jwt.strategy.ts              # JWT strategy untuk Passport
│   ├── auth.controller.ts               # Auth endpoints
│   ├── auth.service.ts                  # Auth business logic
│   └── auth.module.ts                   # Auth module configuration
│
├── prisma/
│   ├── prisma.service.ts                # Prisma client service
│   └── prisma.module.ts                 # Prisma module (Global)
│
└── main.ts                              # Bootstrap dengan ValidationPipe

prisma/
└── schema.prisma                        # Database schema

.env                                     # Environment variables
AUTH_DOCUMENTATION.md                    # API documentation
AUTH_TESTING_EXAMPLES.md                 # Testing examples
```

---

## 🔧 Dependencies yang Diinstall

```json
{
  "dependencies": {
    "@nestjs/jwt": "^10.x",
    "@nestjs/passport": "^10.x",
    "passport": "^0.7.x",
    "passport-jwt": "^4.x",
    "bcryptjs": "^2.x",
    "class-validator": "^0.14.x",
    "class-transformer": "^0.5.x",
    "@prisma/client": "^5.x",
    "prisma": "^5.x"
  },
  "devDependencies": {
    "@types/passport-jwt": "^4.x",
    "@types/bcryptjs": "^2.x"
  }
}
```

---

## 🎯 Best Practices yang Diterapkan

### 1. **Security**
```typescript
// Password Hashing
const hashedPassword = await bcrypt.hash(password, 10);

// JWT Configuration
JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: '7d' },
})

// Protected Routes
@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile(@CurrentUser() user: any) { }
```

### 2. **Validation**
```typescript
// RegisterDto dengan validation rules
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

### 3. **Error Handling**
```typescript
// Consistent error responses
if (existingCustomer) {
  throw new ConflictException('Email already registered');
}

if (!isPasswordValid) {
  throw new UnauthorizedException('Invalid credentials');
}
```

### 4. **Response Format**
```typescript
// Standardized response structure
return {
  message: 'Login successful',
  data: {
    customer: { /* customer data */ },
    token: { /* token data */ }
  }
};
```

### 5. **Data Privacy**
```typescript
// Never return password in response
select: {
  id: true,
  email: true,
  name: true,
  phone: true,
  createdAt: true,
  updatedAt: true,
  // password: false (implicitly excluded)
}
```

---

## 🚀 Cara Menggunakan

### 1. **Protect Single Route**
```typescript
@Controller('bookings')
export class BookingsController {
  
  @Get('my-bookings')
  @UseGuards(JwtAuthGuard)
  async getMyBookings(@CurrentUser() user: any) {
    // user.id, user.email, user.name tersedia
    return this.bookingsService.findByCustomer(user.id);
  }
}
```

### 2. **Protect Entire Controller**
```typescript
@Controller('bookings')
@UseGuards(JwtAuthGuard)  // Semua routes protected
export class BookingsController {
  // All methods require authentication
}
```

### 3. **Optional Authentication**
```typescript
@Get('public-fields')
async getPublicFields(@CurrentUser() user?: any) {
  // Route accessible with or without token
  // user will be undefined if no token
  if (user) {
    // Show personalized data
  } else {
    // Show public data
  }
}
```

---

## 🔐 JWT Payload Structure

```typescript
interface JwtPayload {
  sub: string;      // customer.id (UUID)
  email: string;    // customer.email
  name: string;     // customer.name
  iat: number;      // issued at (timestamp)
  exp: number;      // expires at (timestamp)
}
```

---

## 📝 Environment Variables

```env
# Required
DATABASE_URL="mysql://root:@localhost:3306/db_reservasi_futsal"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Optional
PORT=3333
```

⚠️ **PENTING**: 
- Gunakan JWT_SECRET yang kuat di production (min 32 karakter random)
- Jangan commit `.env` ke version control
- Gunakan `.env.example` sebagai template

---

## 🧪 Testing

### Quick Test Commands
```bash
# Register
curl -X POST http://localhost:3333/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","phone":"08123456789","password":"password123"}'

# Login
curl -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Get Profile (replace TOKEN)
curl -X GET http://localhost:3333/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Lihat [AUTH_TESTING_EXAMPLES.md](AUTH_TESTING_EXAMPLES.md) untuk contoh lengkap.

---

## 📚 Dokumentasi

- [AUTH_DOCUMENTATION.md](AUTH_DOCUMENTATION.md) - API Documentation lengkap
- [AUTH_TESTING_EXAMPLES.md](AUTH_TESTING_EXAMPLES.md) - Testing examples & curl commands

---

## ✨ Next Steps (Opsional)

### 1. **Refresh Token**
Implementasi refresh token untuk security lebih baik:
- Access token: 15 menit
- Refresh token: 7 hari
- Endpoint: `POST /auth/refresh`

### 2. **Email Verification**
- Send verification email setelah register
- Endpoint: `POST /auth/verify-email`

### 3. **Password Reset**
- Forgot password flow
- Endpoint: `POST /auth/forgot-password`
- Endpoint: `POST /auth/reset-password`

### 4. **Rate Limiting**
Implementasi rate limiting untuk prevent brute force:
```typescript
import { ThrottlerGuard } from '@nestjs/throttler';

@UseGuards(ThrottlerGuard)
@Post('login')
async login() { }
```

### 5. **2FA (Two-Factor Authentication)**
Implementasi 2FA dengan OTP/SMS

### 6. **Session Management**
Track active sessions per user

---

## 🎉 Summary

Sistem autentikasi customer sudah lengkap dengan:
- ✅ Registration & Login
- ✅ JWT Authentication
- ✅ Protected Routes & Guards
- ✅ Password Security (bcrypt)
- ✅ Input Validation
- ✅ Error Handling
- ✅ Custom Decorators
- ✅ Best Practices Architecture

**Status**: ✅ Production Ready (dengan catatan ganti JWT_SECRET di production)
