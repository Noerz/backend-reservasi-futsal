import { BadRequestException, Injectable } from '@nestjs/common';
import { BookingStatus, DayType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

function isWeekend(date: Date) {
  const day = date.getDay();
  // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
}

function roundUpToNextHour(date: Date) {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  if (date.getMinutes() !== 0 || date.getSeconds() !== 0 || date.getMilliseconds() !== 0) {
    d.setHours(d.getHours() + 1);
  }
  return d;
}

function parseLocalDateYYYYMMDD(value: string): { year: number; month: number; day: number } {
  const match = /^\d{4}-\d{2}-\d{2}$/.exec(value);
  if (!match) {
    throw new BadRequestException('date harus format YYYY-MM-DD');
  }
  const [yearStr, monthStr, dayStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    throw new BadRequestException('date tidak valid');
  }
  return { year, month, day };
}

@Injectable()
export class MobileFieldsService {
  constructor(private prisma: PrismaService) {}

  private resolveSlot(params: {
    startTime?: string;
    endTime?: string;
    date?: string;
    startHour?: number;
    durationHours?: number;
  }): { start: Date; end: Date } {
    const { startTime, endTime, date, startHour, durationHours } = params;

    if (startTime || endTime) {
      if (!startTime || !endTime) {
        throw new BadRequestException('startTime dan endTime harus diisi bersama');
      }
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new BadRequestException('startTime/endTime tidak valid');
      }
      if (end <= start) {
        throw new BadRequestException('endTime harus lebih besar dari startTime');
      }
      // basic guardrail
      const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (diffHours > 24) {
        throw new BadRequestException('Range waktu maksimal 24 jam');
      }
      return { start, end };
    }

    const now = new Date();
    const start = roundUpToNextHour(now);

    let base = start;
    if (date) {
      const { year, month, day } = parseLocalDateYYYYMMDD(date);
      base = new Date(year, month - 1, day, 0, 0, 0, 0);
    }

    const hour = startHour ?? (date ? 8 : start.getHours());
    const dur = durationHours ?? 1;
    if (hour + dur > 24) {
      throw new BadRequestException('Slot waktu melewati batas hari (24 jam)');
    }

    const slotStart = new Date(base);
    slotStart.setHours(hour, 0, 0, 0);

    const slotEnd = new Date(slotStart);
    slotEnd.setHours(slotEnd.getHours() + dur);

    return { start: slotStart, end: slotEnd };
  }

  private getPricePerHourForSlot(input: {
    prices: { dayType: DayType; startHour: number; endHour: number; price: number }[];
    slotStart: Date;
  }): number | null {
    const { prices, slotStart } = input;
    const dayType: DayType = isWeekend(slotStart) ? DayType.WEEKEND : DayType.WEEKDAY;
    const hour = slotStart.getHours();

    const match = prices.find(
      (p) => p.dayType === dayType && p.startHour <= hour && p.endHour > hour,
    );

    return match ? match.price : null;
  }

  async listMobileFields(params: {
    startTime?: string;
    endTime?: string;
    date?: string;
    startHour?: number;
    durationHours?: number;
    search?: string;
    venueId?: string;
    onlyAvailable?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { start, end } = this.resolveSlot(params);
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      ...(params.venueId ? { venueId: params.venueId } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search } },
              { venue: { name: { contains: params.search } } },
            ],
          }
        : {}),
    };

    const [fields, total] = await Promise.all([
      this.prisma.field.findMany({
        where,
        include: {
          venue: { select: { id: true, name: true } },
          prices: { orderBy: [{ dayType: 'asc' }, { startHour: 'asc' }] },
          images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }, { createdAt: 'asc' }] },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.field.count({ where }),
    ]);

    const fieldIds = fields.map((f) => f.id);

    // Find any booking that overlaps the slot
    const busyBookings = fieldIds.length
      ? await this.prisma.booking.findMany({
          where: {
            fieldId: { in: fieldIds },
            status: { not: BookingStatus.CANCELLED },
            AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
          },
          select: { fieldId: true },
        })
      : [];

    const busySet = new Set(busyBookings.map((b) => b.fieldId));

    const mapped = fields
      .map((f) => {
        const isAvailable = !busySet.has(f.id);
        const pricePerHour = this.getPricePerHourForSlot({
          prices: f.prices,
          slotStart: start,
        });

        const primaryImageUrl = f.images?.[0]?.imageUrl ?? null;

        return {
          id: f.id,
          name: f.name,
          type: f.type,
          venue: f.venue,
          imageUrl: primaryImageUrl,
          size: {
            lengthMeter: f.lengthMeter ?? null,
            widthMeter: f.widthMeter ?? null,
          },
          pricePerHour,
          isAvailable,
        };
      })
      .filter((x) => (params.onlyAvailable ? x.isAvailable : true))
      .sort((a, b) => {
        // Available first
        if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
        // Then by venue name, then field name
        const av = a.venue?.name ?? '';
        const bv = b.venue?.name ?? '';
        const venueCmp = av.localeCompare(bv);
        if (venueCmp !== 0) return venueCmp;
        return a.name.localeCompare(b.name);
      });

    return {
      message: 'Daftar lapangan (mobile) berhasil diambil',
      slot: {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
      data: mapped,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMobileFieldDetail(
    id: string,
    params: {
      startTime?: string;
      endTime?: string;
      date?: string;
      startHour?: number;
      durationHours?: number;
    },
  ) {
    const { start, end } = this.resolveSlot(params);

    const field = await this.prisma.field.findUnique({
      where: { id },
      include: {
        venue: { select: { id: true, name: true } },
        prices: { orderBy: [{ dayType: 'asc' }, { startHour: 'asc' }] },
        images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }, { createdAt: 'asc' }] },
      },
    });

    if (!field || !field.isActive) {
      return {
        message: 'Lapangan tidak ditemukan',
        data: null,
      };
    }

    const busy = await this.prisma.booking.findFirst({
      where: {
        fieldId: id,
        status: { not: BookingStatus.CANCELLED },
        AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
      },
      select: { id: true },
    });

    const pricePerHour = this.getPricePerHourForSlot({
      prices: field.prices,
      slotStart: start,
    });

    return {
      message: 'Detail lapangan (mobile) berhasil diambil',
      slot: {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
      data: {
        id: field.id,
        name: field.name,
        type: field.type,
        venue: field.venue,
        imageUrl: field.images?.[0]?.imageUrl ?? null,
        size: {
          lengthMeter: field.lengthMeter ?? null,
          widthMeter: field.widthMeter ?? null,
        },
        pricePerHour,
        isAvailable: !busy,
        images: field.images.map((img) => ({
          id: img.id,
          imageUrl: img.imageUrl,
          isPrimary: img.isPrimary,
          order: img.order,
        })),
      },
    };
  }
}
