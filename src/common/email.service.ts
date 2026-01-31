import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { LoggerService } from './logger.service';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private logger: LoggerService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify connection configuration
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error('Error configuring email transport', error.message, 'EmailService');
      } else {
        this.logger.log('Email service is ready', 'EmailService');
      }
    });
  }

  async sendBookingApproved(
    customerEmail: string,
    customerName: string,
    bookingDetails: {
      bookingId: string;
      fieldName: string;
      venueName: string;
      startTime: Date;
      endTime: Date;
      totalPrice: number;
    },
  ): Promise<void> {
    const { bookingId, fieldName, venueName, startTime, endTime, totalPrice } = bookingDetails;

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Reservasi Futsal'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: '✅ Pembayaran Booking Disetujui',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Pembayaran Disetujui!</h2>
          <p>Halo <strong>${customerName}</strong>,</p>
          <p>Kami dengan senang hati menginformasikan bahwa pembayaran untuk booking Anda telah <strong>disetujui</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Detail Booking:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;"><strong>ID Booking:</strong></td>
                <td style="padding: 8px 0;">${bookingId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Venue:</strong></td>
                <td style="padding: 8px 0;">${venueName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Lapangan:</strong></td>
                <td style="padding: 8px 0;">${fieldName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Waktu:</strong></td>
                <td style="padding: 8px 0;">${this.formatDateTime(startTime)} - ${this.formatTime(endTime)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Total:</strong></td>
                <td style="padding: 8px 0; color: #28a745; font-weight: bold;">Rp ${this.formatPrice(totalPrice)}</td>
              </tr>
            </table>
          </div>

          <p>Silakan datang tepat waktu sesuai jadwal booking Anda.</p>
          <p>Terima kasih telah menggunakan layanan kami!</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 12px;">
            Email ini dikirim otomatis. Jika ada pertanyaan, silakan hubungi kami.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Booking approved email sent to ${customerEmail}`, 'EmailService');
    } catch (error) {
      this.logger.error(`Failed to send email to ${customerEmail}`, error.message, 'EmailService');
      // Don't throw - we don't want to fail the booking process if email fails
    }
  }

  async sendBookingRejected(
    customerEmail: string,
    customerName: string,
    bookingDetails: {
      bookingId: string;
      fieldName: string;
      venueName: string;
      startTime: Date;
      endTime: Date;
      totalPrice: number;
      rejectionNote?: string;
    },
  ): Promise<void> {
    const { bookingId, fieldName, venueName, startTime, endTime, totalPrice, rejectionNote } = bookingDetails;

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Reservasi Futsal'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: '❌ Pembayaran Booking Ditolak',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Pembayaran Ditolak</h2>
          <p>Halo <strong>${customerName}</strong>,</p>
          <p>Mohon maaf, pembayaran untuk booking Anda <strong>tidak dapat disetujui</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Detail Booking:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;"><strong>ID Booking:</strong></td>
                <td style="padding: 8px 0;">${bookingId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Venue:</strong></td>
                <td style="padding: 8px 0;">${venueName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Lapangan:</strong></td>
                <td style="padding: 8px 0;">${fieldName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Waktu:</strong></td>
                <td style="padding: 8px 0;">${this.formatDateTime(startTime)} - ${this.formatTime(endTime)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Total:</strong></td>
                <td style="padding: 8px 0;">Rp ${this.formatPrice(totalPrice)}</td>
              </tr>
            </table>
          </div>

          ${rejectionNote ? `
            <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <strong>Alasan:</strong>
              <p style="margin: 5px 0 0 0;">${rejectionNote}</p>
            </div>
          ` : ''}

          <p>Silakan lakukan booking ulang dengan bukti pembayaran yang valid.</p>
          <p>Jika ada pertanyaan, silakan hubungi admin kami.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 12px;">
            Email ini dikirim otomatis. Jika ada pertanyaan, silakan hubungi kami.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Booking rejected email sent to ${customerEmail}`, 'EmailService');
    } catch (error) {
      this.logger.error(`Failed to send email to ${customerEmail}`, error.message, 'EmailService');
      // Don't throw - we don't want to fail the booking process if email fails
    }
  }

  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private formatPrice(price: number): string {
    return new Intl.NumberFormat('id-ID').format(price);
  }
}
