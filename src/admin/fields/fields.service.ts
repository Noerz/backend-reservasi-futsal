import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggerService } from '../../common/logger.service';
import {
  CreateFieldDto,
  CreateFieldPriceDto,
  UpdateFieldDto,
  UpdateFieldPriceDto,
} from './dto';
import { DayType } from '@prisma/client';

@Injectable()
export class FieldsService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  private validatePriceRange(input: {
    startHour: number;
    endHour: number;
    price: number;
  }) {
    const { startHour, endHour, price } = input;

    if (endHour <= startHour) {
      throw new BadRequestException('endHour harus lebih besar dari startHour');
    }

    if (price < 0) {
      throw new BadRequestException('price tidak boleh negatif');
    }
  }

  private async ensureNoOverlappingPrices(params: {
    fieldId: string;
    dayType: DayType;
    startHour: number;
    endHour: number;
    excludePriceId?: string;
  }) {
    const { fieldId, dayType, startHour, endHour, excludePriceId } = params;

    const overlap = await this.prisma.fieldPrice.findFirst({
      where: {
        fieldId,
        dayType,
        ...(excludePriceId ? { id: { not: excludePriceId } } : {}),
        AND: [{ startHour: { lt: endHour } }, { endHour: { gt: startHour } }],
      },
    });

    if (overlap) {
      throw new ConflictException(
        `Harga bentrok dengan range existing (${overlap.startHour}-${overlap.endHour}) untuk ${dayType}`,
      );
    }
  }

  private ensureNoOverlappingPricesInPayload(prices: CreateFieldPriceDto[]) {
    for (let i = 0; i < prices.length; i++) {
      const a = prices[i];
      this.validatePriceRange(a);

      for (let j = i + 1; j < prices.length; j++) {
        const b = prices[j];
        if (a.dayType !== b.dayType) continue;

        const overlaps = a.startHour < b.endHour && a.endHour > b.startHour;
        if (overlaps) {
          throw new BadRequestException(
            `Harga bentrok di payload: ${a.dayType} (${a.startHour}-${a.endHour}) overlap (${b.startHour}-${b.endHour})`,
          );
        }
      }
    }
  }

  async create(dto: CreateFieldDto) {
    const { name, type, isActive, prices, lengthMeter, widthMeter, imageUrls } = dto;

    const existing = await this.prisma.field.findFirst({
      where: { name },
    });
    if (existing) {
      throw new ConflictException(
        `Field dengan nama "${name}" sudah ada`,
      );
    }

    if (prices?.length) {
      this.ensureNoOverlappingPricesInPayload(prices);
    }

    if (lengthMeter !== undefined && lengthMeter <= 0) {
      throw new BadRequestException('lengthMeter harus lebih besar dari 0');
    }
    if (widthMeter !== undefined && widthMeter <= 0) {
      throw new BadRequestException('widthMeter harus lebih besar dari 0');
    }

    if (imageUrls?.length) {
      const hasEmpty = imageUrls.some((u) => !u || !u.trim());
      if (hasEmpty) {
        throw new BadRequestException('imageUrls tidak boleh berisi string kosong');
      }
    }

    const field = await this.prisma.field.create({
      data: {
        name,
        type,
        ...(isActive !== undefined ? { isActive } : {}),
        ...(lengthMeter !== undefined ? { lengthMeter } : {}),
        ...(widthMeter !== undefined ? { widthMeter } : {}),
        ...(prices?.length
          ? {
              prices: {
                create: prices.map((p) => ({
                  dayType: p.dayType,
                  startHour: p.startHour,
                  endHour: p.endHour,
                  price: p.price,
                })),
              },
            }
          : {}),
        ...(imageUrls?.length
          ? {
              images: {
                create: imageUrls.map((url, idx) => ({
                  imageUrl: url,
                  isPrimary: idx === 0,
                  order: idx,
                })),
              },
            }
          : {}),
      },
      include: {
        prices: { orderBy: [{ dayType: 'asc' }, { startHour: 'asc' }] },
        images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }, { createdAt: 'asc' }] },
        _count: { select: { bookings: true } },
      },
    });

    this.logger.log(`Field created: ${field.name}`, 'FieldsService');

    return {
      message: 'Field berhasil dibuat',
      data: field,
    };
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    isActive?: boolean;
  }) {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      isActive,
    } = params;

    const skip = (page - 1) * limit;

    const where: any = {
      ...(type ? { type } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(search
        ? {
            name: { contains: search },
          }
        : {}),
    };

    const [fields, total] = await Promise.all([
      this.prisma.field.findMany({
        where,
        include: {
          prices: { orderBy: [{ dayType: 'asc' }, { startHour: 'asc' }] },
          images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }, { createdAt: 'asc' }] },
          _count: { select: { bookings: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.field.count({ where }),
    ]);

    return {
      message: 'Daftar field berhasil diambil',
      data: fields,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const field = await this.prisma.field.findUnique({
      where: { id },
      include: {
        prices: { orderBy: [{ dayType: 'asc' }, { startHour: 'asc' }] },
        images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }, { createdAt: 'asc' }] },
        _count: { select: { bookings: true } },
      },
    });

    if (!field) {
      throw new NotFoundException(`Field dengan ID "${id}" tidak ditemukan`);
    }

    return {
      message: 'Detail field berhasil diambil',
      data: field,
    };
  }

  async update(id: string, dto: UpdateFieldDto) {
    console.log(dto);
    const existing = await this.prisma.field.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Field dengan ID "${id}" tidak ditemukan`);
    }

    if (dto.name && dto.name !== existing.name) {
      const conflict = await this.prisma.field.findFirst({
        where: { name: dto.name },
      });
      if (conflict) {
        throw new ConflictException(
          `Field dengan nama "${dto.name}" sudah ada`,
        );
      }
    }

    if (dto.lengthMeter !== undefined && dto.lengthMeter <= 0) {
      throw new BadRequestException('lengthMeter harus lebih besar dari 0');
    }
    if (dto.widthMeter !== undefined && dto.widthMeter <= 0) {
      throw new BadRequestException('widthMeter harus lebih besar dari 0');
    }

    if (dto.imageUrls?.length) {
      const hasEmpty = dto.imageUrls.some((u) => !u || !u.trim());
      if (hasEmpty) {
        throw new BadRequestException('imageUrls tidak boleh berisi string kosong');
      }
    }

    // Validasi prices jika ada
    if (dto.prices?.length) {
      this.ensureNoOverlappingPricesInPayload(dto.prices);
    }

    const updateData: any = {
      ...(dto.name ? { name: dto.name } : {}),
      ...(dto.type ? { type: dto.type } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.lengthMeter !== undefined ? { lengthMeter: dto.lengthMeter } : {}),
      ...(dto.widthMeter !== undefined ? { widthMeter: dto.widthMeter } : {}),
    };

    const nextImageUrls = dto.imageUrls;
    const nextPrices = dto.prices;

    // Jika ada perubahan imageUrls atau prices, gunakan transaction
    const needsTransaction = nextImageUrls !== undefined || nextPrices !== undefined;

    const field = needsTransaction
      ? await this.prisma.$transaction(async (tx) => {
          // Hapus images lama jika ada imageUrls baru
          if (nextImageUrls !== undefined) {
            await tx.fieldImage.deleteMany({ where: { fieldId: id } });
          }

          // Hapus prices lama jika ada prices baru
          if (nextPrices !== undefined) {
            await tx.fieldPrice.deleteMany({ where: { fieldId: id } });
          }

          return tx.field.update({
            where: { id },
            data: {
              ...updateData,
              ...(nextImageUrls !== undefined && nextImageUrls.length
                ? {
                    images: {
                      create: nextImageUrls.map((url, idx) => ({
                        imageUrl: url,
                        isPrimary: idx === 0,
                        order: idx,
                      })),
                    },
                  }
                : {}),
              ...(nextPrices !== undefined && nextPrices.length
                ? {
                    prices: {
                      create: nextPrices.map((p) => ({
                        dayType: p.dayType,
                        startHour: p.startHour,
                        endHour: p.endHour,
                        price: p.price,
                      })),
                    },
                  }
                : {}),
            },
            include: {
              prices: { orderBy: [{ dayType: 'asc' }, { startHour: 'asc' }] },
              images: {
                orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }, { createdAt: 'asc' }],
              },
              _count: { select: { bookings: true } },
            },
          });
        })
      : await this.prisma.field.update({
          where: { id },
          data: updateData,
          include: {
            prices: { orderBy: [{ dayType: 'asc' }, { startHour: 'asc' }] },
            images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }, { createdAt: 'asc' }] },
            _count: { select: { bookings: true } },
          },
        });

    this.logger.log(`Field updated: ${field.name}`, 'FieldsService');

    return {
      message: 'Field berhasil diupdate',
      data: field,
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.field.findUnique({
      where: { id },
      include: { _count: { select: { bookings: true } } },
    });

    if (!existing) {
      throw new NotFoundException(`Field dengan ID "${id}" tidak ditemukan`);
    }

    if (existing._count.bookings > 0) {
      throw new BadRequestException(
        `Field tidak dapat dihapus karena masih memiliki ${existing._count.bookings} booking`,
      );
    }

    // Delete related records in transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete FieldPrice records first
      await tx.fieldPrice.deleteMany({ where: { fieldId: id } });
      
      // FieldImage will be auto-deleted due to onDelete: Cascade in schema
      // But we can explicitly delete it for clarity
      await tx.fieldImage.deleteMany({ where: { fieldId: id } });
      
      // Finally delete the field
      await tx.field.delete({ where: { id } });
    });

    this.logger.log(`Field deleted: ${existing.name}`, 'FieldsService');

    return {
      message: 'Field berhasil dihapus',
      data: { id },
    };
  }

  async addPrice(fieldId: string, dto: CreateFieldPriceDto) {
    const field = await this.prisma.field.findUnique({ where: { id: fieldId } });
    if (!field) {
      throw new NotFoundException(`Field dengan ID "${fieldId}" tidak ditemukan`);
    }

    this.validatePriceRange(dto);
    await this.ensureNoOverlappingPrices({
      fieldId,
      dayType: dto.dayType,
      startHour: dto.startHour,
      endHour: dto.endHour,
    });

    const price = await this.prisma.fieldPrice.create({
      data: {
        fieldId,
        dayType: dto.dayType,
        startHour: dto.startHour,
        endHour: dto.endHour,
        price: dto.price,
      },
    });

    return {
      message: 'Field price berhasil ditambahkan',
      data: price,
    };
  }

  async listPrices(fieldId: string) {
    const field = await this.prisma.field.findUnique({ where: { id: fieldId } });
    if (!field) {
      throw new NotFoundException(`Field dengan ID "${fieldId}" tidak ditemukan`);
    }

    const prices = await this.prisma.fieldPrice.findMany({
      where: { fieldId },
      orderBy: [{ dayType: 'asc' }, { startHour: 'asc' }],
    });

    return {
      message: 'Daftar field price berhasil diambil',
      data: prices,
    };
  }

  async updatePrice(fieldId: string, priceId: string, dto: UpdateFieldPriceDto) {
    const existing = await this.prisma.fieldPrice.findUnique({
      where: { id: priceId },
    });

    if (!existing || existing.fieldId !== fieldId) {
      throw new NotFoundException(
        `Field price dengan ID "${priceId}" tidak ditemukan untuk field ini`,
      );
    }

    const next = {
      dayType: dto.dayType ?? existing.dayType,
      startHour: dto.startHour ?? existing.startHour,
      endHour: dto.endHour ?? existing.endHour,
      price: dto.price ?? existing.price,
    };

    this.validatePriceRange(next);
    await this.ensureNoOverlappingPrices({
      fieldId,
      dayType: next.dayType,
      startHour: next.startHour,
      endHour: next.endHour,
      excludePriceId: priceId,
    });

    const updated = await this.prisma.fieldPrice.update({
      where: { id: priceId },
      data: {
        ...(dto.dayType ? { dayType: dto.dayType } : {}),
        ...(dto.startHour !== undefined ? { startHour: dto.startHour } : {}),
        ...(dto.endHour !== undefined ? { endHour: dto.endHour } : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
      },
    });

    return {
      message: 'Field price berhasil diupdate',
      data: updated,
    };
  }

  async removePrice(fieldId: string, priceId: string) {
    const existing = await this.prisma.fieldPrice.findUnique({
      where: { id: priceId },
    });

    if (!existing || existing.fieldId !== fieldId) {
      throw new NotFoundException(
        `Field price dengan ID "${priceId}" tidak ditemukan untuk field ini`,
      );
    }

    await this.prisma.fieldPrice.delete({ where: { id: priceId } });

    return {
      message: 'Field price berhasil dihapus',
      data: { id: priceId },
    };
  }
}
