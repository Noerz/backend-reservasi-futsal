# Email Notification Setup

Sistem notifikasi email akan otomatis mengirim email ke customer ketika admin melakukan verifikasi pembayaran booking.

## Setup SMTP Configuration

### 1. Tambahkan Environment Variables

Tambahkan konfigurasi SMTP ke file `.env` Anda:

```env
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=Reservasi Futsal
SMTP_FROM_EMAIL=your-email@gmail.com
```

### 2. Setup Gmail (Recommended)

Jika menggunakan Gmail:

1. **Aktifkan 2-Factor Authentication** di akun Google Anda
2. **Buat App Password**:
   - Buka [Google Account Security](https://myaccount.google.com/security)
   - Pilih "2-Step Verification"
   - Scroll ke bawah dan pilih "App passwords"
   - Pilih "Mail" dan "Other (Custom name)"
   - Masukkan nama: "Reservasi Futsal"
   - Copy password yang dihasilkan dan gunakan sebagai `SMTP_PASS`

3. **Update .env**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=youremail@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # App password dari langkah 2
SMTP_FROM_NAME=Reservasi Futsal
SMTP_FROM_EMAIL=youremail@gmail.com
```

### 3. Setup Provider Lain

#### Mailtrap (Testing)
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-pass
SMTP_FROM_NAME=Reservasi Futsal
SMTP_FROM_EMAIL=noreply@reservasi-futsal.com
```

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM_NAME=Reservasi Futsal
SMTP_FROM_EMAIL=your-verified-sender@yourdomain.com
```

#### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-aws-smtp-username
SMTP_PASS=your-aws-smtp-password
SMTP_FROM_NAME=Reservasi Futsal
SMTP_FROM_EMAIL=verified@yourdomain.com
```

## Fitur Email Notification

### 1. Email Pembayaran Disetujui (Approved)

Email dikirim ketika admin menyetujui pembayaran booking dengan konten:
- Header sukses dengan icon ✅
- Nama customer
- Detail booking (ID, venue, lapangan, waktu, total harga)
- Informasi untuk datang tepat waktu

### 2. Email Pembayaran Ditolak (Rejected)

Email dikirim ketika admin menolak pembayaran booking dengan konten:
- Header penolakan dengan icon ❌
- Nama customer
- Detail booking
- Alasan penolakan (jika ada catatan dari admin)
- Instruksi untuk booking ulang

## Testing

### 1. Test dengan Mailtrap (Recommended untuk Development)

1. Daftar di [Mailtrap.io](https://mailtrap.io)
2. Buat inbox baru
3. Copy kredensial SMTP ke `.env`
4. Lakukan verifikasi booking
5. Cek email di Mailtrap inbox

### 2. Manual Testing Flow

1. Customer membuat booking dengan upload bukti pembayaran
2. Admin login dan akses endpoint verify payment:
   ```
   PATCH /api/v1/admin/bookings/verify-payment/:bookingId
   Body: { "approved": true, "note": "optional note" }
   ```
3. Check email customer (atau mailtrap inbox)

### 3. Test dengan Curl

```bash
# Approve payment
curl -X PATCH http://localhost:3333/api/v1/admin/bookings/verify-payment/BOOKING_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'

# Reject payment
curl -X PATCH http://localhost:3333/api/v1/admin/bookings/verify-payment/BOOKING_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"approved": false, "note": "Bukti pembayaran tidak jelas"}'
```

## Error Handling

Email service didesain agar **tidak mengganggu proses bisnis utama**:

- Jika pengiriman email gagal, error akan di-log tapi **tidak akan throw exception**
- Proses verifikasi pembayaran tetap berhasil meskipun email gagal terkirim
- Admin dapat melihat error di log aplikasi

## Troubleshooting

### Email tidak terkirim

1. **Cek log aplikasi** untuk error message
2. **Verify SMTP credentials** di .env sudah benar
3. **Test SMTP connection**:
   ```bash
   # Install nodemailer-smtp-test
   npm install -g nodemailer-smtp-test
   
   # Test connection
   nodemailer-smtp-test
   ```

### Gmail menolak login

- Pastikan 2FA aktif
- Gunakan App Password, **bukan** password akun Google biasa
- Pastikan "Less secure app access" tidak diperlukan (App Password sudah cukup)

### Email masuk spam

- Setup SPF, DKIM, DMARC untuk domain Anda
- Gunakan email sender yang verified
- Gunakan service seperti SendGrid/AWS SES untuk production

## Production Recommendations

1. **Jangan gunakan Gmail** untuk production high-volume
2. **Gunakan dedicated email service**:
   - SendGrid (12,000 emails/month free)
   - AWS SES (62,000 emails/month free)
   - Mailgun (5,000 emails/month free)
3. **Setup proper domain authentication** (SPF, DKIM, DMARC)
4. **Monitor email deliverability**
5. **Implement email queue** untuk volume tinggi (gunakan Bull/BullMQ)

## Customization

### Edit Email Template

Template email ada di `src/common/email.service.ts`:

```typescript
// Method untuk approved email
async sendBookingApproved(...)

// Method untuk rejected email  
async sendBookingRejected(...)
```

Anda bisa customize:
- HTML template
- Subject line
- Formatting tanggal/waktu
- Styling CSS inline

### Tambah Email Type Baru

1. Tambahkan method baru di `EmailService`
2. Panggil dari service yang relevan
3. Design HTML template sesuai kebutuhan
