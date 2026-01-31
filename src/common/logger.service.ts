import { Injectable, ConsoleLogger, LogLevel } from '@nestjs/common';

@Injectable()
export class LoggerService extends ConsoleLogger {
  constructor() {
    super('ReservasiFutsal');
  }

  logServerInfo(port: number) {
    this.log(`🚀 Server running on http://localhost:${port}`, 'Bootstrap');
    this.log('', 'Bootstrap');
    this.log('⚽ === BACKEND RESERVASI FUTSAL API === ⚽', 'Bootstrap');
    this.log('', 'Bootstrap');
    this.log('📚 Customer Auth Endpoints:', 'Bootstrap');
    this.log('   POST /auth/register        - Registrasi customer', 'Bootstrap');
    this.log('   POST /auth/login           - Login customer', 'Bootstrap');
    this.log('   GET  /auth/profile         - Get profile customer (🔒)', 'Bootstrap');
    this.log('', 'Bootstrap');
    this.log('⚽ Customer Booking Endpoints: (Coming Soon)', 'Bootstrap');
    this.log('   GET  /bookings             - List lapangan tersedia', 'Bootstrap');
    this.log('   POST /bookings             - Buat booking baru (🔒)', 'Bootstrap');
    this.log('   GET  /bookings/my          - Booking saya (🔒)', 'Bootstrap');
    this.log('   GET  /bookings/:id         - Detail booking (🔒)', 'Bootstrap');
    this.log('   PUT  /bookings/:id/cancel  - Cancel booking (🔒)', 'Bootstrap');
    this.log('', 'Bootstrap');
    this.log('💳 Payment Endpoints: (Coming Soon)', 'Bootstrap');
    this.log('   POST /payments/:bookingId  - Proses pembayaran (🔒)', 'Bootstrap');
    this.log('   GET  /payments/my          - Riwayat pembayaran (🔒)', 'Bootstrap');
    this.log('', 'Bootstrap');
    this.log('🔐 Admin Auth Endpoints: (Coming Soon)', 'Bootstrap');
    this.log('   POST /admin/auth/login     - Login admin', 'Bootstrap');
    this.log('   GET  /admin/auth/profile   - Profile admin (🔒)', 'Bootstrap');
    this.log('', 'Bootstrap');
    this.log('🔐 Admin Management Endpoints: (Coming Soon)', 'Bootstrap');
    this.log('   GET  /admin/fields         - Kelola lapangan (🔒)', 'Bootstrap');
    this.log('   GET  /admin/bookings       - Kelola booking (🔒)', 'Bootstrap');
    this.log('   GET  /admin/customers      - Kelola customer (🔒)', 'Bootstrap');
    this.log('   GET  /admin/reports        - Laporan & statistik (🔒)', 'Bootstrap');
    this.log('', 'Bootstrap');
    this.log('🔒 = Protected (Memerlukan JWT Token)', 'Bootstrap');
    this.log('', 'Bootstrap');
  }

  logDatabaseConnection() {
    this.log('✅ Database connected successfully', 'Database');
  }

  logAuthSuccess(identifier: string, action: string) {
    this.log(`✅ ${action} berhasil - ${identifier}`, 'Auth');
  }

  logAuthError(identifier: string, action: string, error: string) {
    this.warn(`❌ ${action} gagal - ${identifier}: ${error}`, 'Auth');
  }

  logBookingCreated(customerId: string, fieldName: string) {
    this.log(`⚽ Booking dibuat - Customer: ${customerId}, Lapangan: ${fieldName}`, 'Booking');
  }

  logBookingCancelled(bookingId: string, customerId: string) {
    this.warn(`❌ Booking dibatalkan - ID: ${bookingId}, Customer: ${customerId}`, 'Booking');
  }

  logPaymentSuccess(bookingId: string, amount: number) {
    this.log(`💰 Pembayaran berhasil - Booking: ${bookingId}, Amount: Rp ${amount.toLocaleString('id-ID')}`, 'Payment');
  }

  logPaymentFailed(bookingId: string, reason: string) {
    this.error(`💳 Pembayaran gagal - Booking: ${bookingId}, Reason: ${reason}`, 'Payment');
  }

  logAdminAction(adminEmail: string, action: string, target: string) {
    this.log(`👤 Admin action - ${adminEmail}: ${action} on ${target}`, 'Admin');
  }

  logError(context: string, error: any) {
    this.error(`🔥 Error in ${context}: ${error.message || error}`, 'Error');
    if (error.stack) {
      this.debug(error.stack, 'Error');
    }
  }
}
