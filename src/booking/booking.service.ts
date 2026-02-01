import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UploadPaymentProofDto, CancelBookingDto } from './dto/update-booking.dto';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../common/logger.service';
import { BookingStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async create(dto: { customerId: string; fieldId: string; startTime: string; endTime: string; proofUrl?: string }) {
    const { customerId, fieldId, startTime, endTime, proofUrl } = dto;

    // Validasi customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException('Customer tidak ditemukan');
    }

    // Validasi field exists dan active
    const field = await this.prisma.field.findUnique({
      where: { id: fieldId },
    });

    if (!field) {
      throw new NotFoundException('Lapangan tidak ditemukan');
    }

    if (!field.isActive) {
      throw new BadRequestException('Lapangan sedang tidak aktif');
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validasi waktu
    if (end <= start) {
      throw new BadRequestException('Waktu selesai harus lebih besar dari waktu mulai');
    }

    if (start < new Date()) {
      throw new BadRequestException('Tidak dapat booking di waktu yang sudah lewat');
    }

    // Cek apakah slot waktu tersedia
    const conflictingBooking = await this.prisma.booking.findFirst({
      where: {
        fieldId,
        status: {
          in: [
            BookingStatus.PENDING,
            BookingStatus.PAID,
          ],
        },
        OR: [
          {
            AND: [{ startTime: { lte: start } }, { endTime: { gt: start } }],
          },
          {
            AND: [{ startTime: { lt: end } }, { endTime: { gte: end } }],
          },
          {
            AND: [{ startTime: { gte: start } }, { endTime: { lte: end } }],
          },
        ],
      },
    });

    if (conflictingBooking) {
      throw new BadRequestException(
        'Slot waktu ini sudah dibooking. Silakan pilih waktu lain.',
      );
    }

    // Hitung harga
    const totalPrice = await this.calculatePrice(fieldId, start, end);

    // Tentukan status awal booking
    const initialStatus = BookingStatus.PENDING;

    // Buat booking dengan payment (jika ada proofUrl)
    const booking = await this.prisma.booking.create({
      data: {
        customerId,
        fieldId,
        startTime: start,
        endTime: end,
        totalPrice,
        status: initialStatus,
        ...(proofUrl
          ? {
              payment: {
                create: {
                  proofUrl,
                  status: PaymentStatus.WAITING_VERIFICATION,
                },
              },
            }
          : {}),
      },
      include: {
        field: {
          select: {
            id: true,
            name: true,
            type: true,
            lengthMeter: true,
            widthMeter: true,
            images: {
              where: { isPrimary: true },
              select: { imageUrl: true },
              take: 1,
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        payment: {
          select: {
            id: true,
            proofUrl: true,
            status: true,
          },
        },
      },
    });

    const logMessage = proofUrl
      ? `Booking created with payment proof: ${booking.id} by customer ${customer.name}`
      : `Booking created: ${booking.id} by customer ${customer.name}`;
    
    this.logger.log(logMessage, 'BookingService');

    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const bookingNumber = this.generateBookingNumber(booking.createdAt);
    const displayStatus = this.getDisplayStatus(booking.status);

    return {
      message: 'Booking berhasil dibuat',
      data: {
        ...booking,
        bookingNumber,
        displayStatus,
        durationHours,
        fieldName: booking.field.name,
        primaryImage: booking.field.images[0]?.imageUrl || null,
      },
    };
  }

  private async calculatePrice(
    fieldId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<number> {
    // Ambil semua harga untuk field ini
    const prices = await this.prisma.fieldPrice.findMany({
      where: { fieldId },
    });

    if (prices.length === 0) {
      throw new BadRequestException(
        'Lapangan ini belum memiliki konfigurasi harga',
      );
    }

    let totalPrice = 0;
    const currentDate = new Date(startTime);

    while (currentDate < endTime) {
      const nextHour = new Date(currentDate);
      nextHour.setHours(currentDate.getHours() + 1);

      const endOfSlot = nextHour > endTime ? endTime : nextHour;
      const duration = (endOfSlot.getTime() - currentDate.getTime()) / (1000 * 60 * 60);

      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dayType = isWeekend ? 'WEEKEND' : 'WEEKDAY';
      const hour = currentDate.getHours();

      // Cari harga yang sesuai
      const applicablePrice = prices.find(
        (p) =>
          p.dayType === dayType &&
          p.startHour <= hour &&
          p.endHour > hour,
      );

      if (!applicablePrice) {
        throw new BadRequestException(
          `Tidak ada harga yang tersedia untuk ${dayType} jam ${hour}:00`,
        );
      }

      totalPrice += applicablePrice.price * duration;
      currentDate.setTime(endOfSlot.getTime());
    }

    return Math.round(totalPrice);
  }

  async getMyBookings(customerId: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, page = 1, limit = 20 } = params || {};
    const skip = (page - 1) * limit;

    const where: any = {
      customerId,
      ...(status ? { status: status as BookingStatus } : {}),
    };

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          field: {
            select: {
              id: true,
              name: true,
              type: true,
              images: {
                where: { isPrimary: true },
                select: { imageUrl: true },
                take: 1,
              },
            },
          },
          payment: {
            select: {
              id: true,
              status: true,
              proofUrl: true,
              verifiedAt: true,
              note: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    const bookingsWithDetails = bookings.map((booking) => {
      const durationHours =
        (new Date(booking.endTime).getTime() -
          new Date(booking.startTime).getTime()) /
        (1000 * 60 * 60);

      // Generate booking number dari timestamp
      const bookingNumber = this.generateBookingNumber(booking.createdAt);

      // Map status untuk mobile app
      const displayStatus = this.getDisplayStatus(booking.status);

      return {
        id: booking.id,
        bookingNumber,
        fieldName: booking.field.name,
        status: displayStatus,
        date: booking.startTime,
        startTime: booking.startTime,
        durationHours,
      };
    });

    return {
      message: 'Daftar booking berhasil diambil',
      data: bookingsWithDetails,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private generateBookingNumber(createdAt: Date): string {
    // Format: #YYMMDD + urutan dari timestamp
    const date = new Date(createdAt);
    const yy = date.getFullYear().toString().slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const seq = String(date.getTime()).slice(-4);
    
    return `#${yy}${mm}${dd}${seq}`;
  }

  private getDisplayStatus(status: BookingStatus): {
    label: string;
    color: string;
  } {
    const statusMap = {
      [BookingStatus.PAID]: { label: 'Approved', color: 'success' },
      [BookingStatus.PENDING]: { label: 'Pending', color: 'warning' },
      [BookingStatus.WAITING_PAYMENT]: { label: 'Pending', color: 'warning' },
      [BookingStatus.CANCELLED]: { label: 'Cancelled', color: 'danger' },
      [BookingStatus.COMPLETED]: { label: 'Completed', color: 'info' },
    };

    return statusMap[status] || { label: status, color: 'default' };
  }

  async findOne(id: string, customerId?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        field: {
          select: {
            id: true,
            name: true,
            type: true,
            lengthMeter: true,
            widthMeter: true,
            images: {
              orderBy: [
                { isPrimary: 'desc' },
                { order: 'asc' },
              ],
              select: {
                imageUrl: true,
                isPrimary: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        payment: {
          select: {
            id: true,
            proofUrl: true,
            status: true,
            verifiedAt: true,
            note: true,
            createdAt: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking tidak ditemukan');
    }

    if (customerId && booking.customerId !== customerId) {
      throw new BadRequestException('Anda tidak memiliki akses ke booking ini');
    }

    const durationHours =
      (new Date(booking.endTime).getTime() -
        new Date(booking.startTime).getTime()) /
      (1000 * 60 * 60);

    const bookingNumber = this.generateBookingNumber(booking.createdAt);
    const displayStatus = this.getDisplayStatus(booking.status);

    return {
      message: 'Detail booking berhasil diambil',
      data: {
        ...booking,
        bookingNumber,
        displayStatus,
        durationHours,
        fieldName: booking.field.name,
        primaryImage: booking.field.images[0]?.imageUrl || null,
      },
    };
  }

  async uploadPaymentProof(bookingId: string, customerId: string, dto: UploadPaymentProofDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking tidak ditemukan');
    }

    if (booking.customerId !== customerId) {
      throw new BadRequestException('Anda tidak memiliki akses ke booking ini');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking sudah dibatalkan');
    }

    if (booking.status === BookingStatus.PAID) {
      throw new BadRequestException('Booking sudah dibayar dan diverifikasi');
    }

    // Jika sudah ada payment, update. Jika belum, create
    let payment;
    if (booking.payment) {
      payment = await this.prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          proofUrl: dto.proofUrl,
          status: PaymentStatus.WAITING_VERIFICATION,
        },
      });
    } else {
      payment = await this.prisma.payment.create({
        data: {
          bookingId,
          proofUrl: dto.proofUrl,
          status: PaymentStatus.WAITING_VERIFICATION,
        },
      });
    }

    // Update status booking
    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.WAITING_PAYMENT },
      include: {
        field: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(
      `Payment proof uploaded for booking ${bookingId}`,
      'BookingService',
    );

    return {
      message: 'Bukti pembayaran berhasil diupload',
      data: {
        booking: updatedBooking,
        payment,
      },
    };
  }

  async cancelBooking(bookingId: string, customerId: string, dto: CancelBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking tidak ditemukan');
    }

    if (booking.customerId !== customerId) {
      throw new BadRequestException('Anda tidak memiliki akses ke booking ini');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking sudah dibatalkan sebelumnya');
    }

    if (booking.status === BookingStatus.PAID) {
      throw new BadRequestException(
        'Booking yang sudah dibayar tidak dapat dibatalkan. Silakan hubungi admin.',
      );
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Booking yang sudah selesai tidak dapat dibatalkan');
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
      include: {
        field: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(
      `Booking ${bookingId} cancelled by customer. Reason: ${dto.reason}`,
      'BookingService',
    );

    return {
      message: 'Booking berhasil dibatalkan',
      data: updatedBooking,
    };
  }
}
