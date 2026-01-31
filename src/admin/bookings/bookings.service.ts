import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggerService } from '../../common/logger.service';
import { EmailService } from '../../common/email.service';
import { VerifyPaymentDto } from './dto';
import { BookingStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private emailService: EmailService,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    fieldId?: string;
    venueId?: string;
    startDate?: string;
    endDate?: string;
    today?: boolean;
  }) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      fieldId,
      venueId,
      today = false,
    } = params;

    let { startDate, endDate } = params as { startDate?: string; endDate?: string };

    const skip = (page - 1) * limit;

    // If today flag is provided, compute today's range and override startDate/endDate
    if (today) {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const tomorrow = new Date(todayDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      // override startDate and endDate
      startDate = todayDate.toISOString();
      endDate = tomorrow.toISOString();
    }

    const where: any = {
      ...(fieldId ? { fieldId } : {}),
      ...(status ? { status: status as BookingStatus } : {}),
      ...(venueId ? { field: { venueId } } : {}),
      ...(startDate || endDate
        ? {
            startTime: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search } },
              { customer: { name: { contains: search } } },
              { customer: { email: { contains: search } } },
              { field: { name: { contains: search } } },
              { field: { venue: { name: { contains: search } } } },
            ],
          }
        : {}),
    };

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          field: {
            select: {
              id: true,
              name: true,
              type: true,
              venue: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          payment: {
            select: {
              id: true,
              proofUrl: true,
              status: true,
              verifiedAt: true,
              verifiedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
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

    return {
      message: 'Daftar booking berhasil diambil',
      data: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        field: {
          select: {
            id: true,
            name: true,
            type: true,
            venue: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            proofUrl: true,
            status: true,
            verifiedAt: true,
            verifiedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            note: true,
            createdAt: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking dengan ID "${id}" tidak ditemukan`);
    }

    return {
      message: 'Detail booking berhasil diambil',
      data: booking,
    };
  }

  async getPendingVerification(params: {
    page?: number;
    limit?: number;
    venueId?: string;
  }) {
    const { page = 1, limit = 10, venueId } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      payment: {
        status: PaymentStatus.WAITING_VERIFICATION,
      },
      ...(venueId ? { field: { venueId } } : {}),
    };

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          field: {
            select: {
              id: true,
              name: true,
              type: true,
              venue: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          payment: {
            select: {
              id: true,
              proofUrl: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      message: 'Daftar booking menunggu verifikasi berhasil diambil',
      data: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async verifyPayment(bookingId: string, dto: VerifyPaymentDto, adminId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        customer: {
          select: { name: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(
        `Booking dengan ID "${bookingId}" tidak ditemukan`,
      );
    }

    if (!booking.payment) {
      throw new BadRequestException('Booking ini belum memiliki data payment');
    }

    if (booking.payment.status !== PaymentStatus.WAITING_VERIFICATION) {
      throw new BadRequestException(
        `Payment sudah diverifikasi dengan status: ${booking.payment.status}`,
      );
    }

    const { approved, note } = dto;

    const newPaymentStatus = approved
      ? PaymentStatus.APPROVED
      : PaymentStatus.REJECTED;

    const newBookingStatus = approved
      ? BookingStatus.PAID
      : BookingStatus.CANCELLED;

    const [updatedPayment, updatedBooking] = await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: newPaymentStatus,
          verifiedById: adminId,
          verifiedAt: new Date(),
          note: note || null,
        },
        include: {
          verifiedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: newBookingStatus },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          field: {
            select: {
              id: true,
              name: true,
              venue: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    this.logger.log(
      `Payment ${approved ? 'approved' : 'rejected'} for booking ${bookingId} by admin ${adminId}`,
      'BookingsService',
    );

    // Send email notification to customer
    const emailDetails = {
      bookingId: updatedBooking.id,
      fieldName: updatedBooking.field.name,
      venueName: updatedBooking.field.venue.name,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalPrice: booking.totalPrice,
      rejectionNote: note,
    };

    if (approved) {
      await this.emailService.sendBookingApproved(
        updatedBooking.customer.email,
        updatedBooking.customer.name,
        emailDetails,
      );
    } else {
      await this.emailService.sendBookingRejected(
        updatedBooking.customer.email,
        updatedBooking.customer.name,
        emailDetails,
      );
    }

    return {
      message: `Payment berhasil ${approved ? 'disetujui' : 'ditolak'}`,
      data: {
        booking: updatedBooking,
        payment: updatedPayment,
      },
    };
  }

  async getStats(venueId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const venueFilter = venueId ? { field: { venueId } } : {};

    const [
      todayBookingsCount,
      activeBookingsCount,
      monthlyRevenue,
      pendingVerificationCount,
    ] = await Promise.all([
      // Pesanan hari ini
      this.prisma.booking.count({
        where: {
          ...venueFilter,
          startTime: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      // Pesanan aktif (PAID atau WAITING_PAYMENT)
      this.prisma.booking.count({
        where: {
          ...venueFilter,
          status: {
            in: [BookingStatus.PAID, BookingStatus.WAITING_PAYMENT],
          },
        },
      }),
      // Pendapatan bulan ini (hanya yang PAID)
      this.prisma.booking.aggregate({
        where: {
          ...venueFilter,
          status: BookingStatus.PAID,
          createdAt: {
            gte: firstDayOfMonth,
            lt: firstDayOfNextMonth,
          },
        },
        _sum: {
          totalPrice: true,
        },
      }),
      // Menunggu verifikasi
      this.prisma.booking.count({
        where: {
          ...venueFilter,
          payment: {
            status: PaymentStatus.WAITING_VERIFICATION,
          },
        },
      }),
    ]);

    return {
      message: 'Statistik dashboard berhasil diambil',
      data: {
        todayBookings: todayBookingsCount,
        activeBookings: activeBookingsCount,
        monthlyRevenue: monthlyRevenue._sum.totalPrice || 0,
        pendingVerification: pendingVerificationCount,
      },
    };
  }
}
