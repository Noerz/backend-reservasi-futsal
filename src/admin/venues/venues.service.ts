    import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggerService } from '../../common/logger.service';
import { CreateVenueDto, UpdateVenueDto } from './dto';

@Injectable()
export class VenuesService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async create(createVenueDto: CreateVenueDto) {
    const { name, address, description, latitude, longitude } = createVenueDto;

    try {
      // Check if venue name already exists
      const existingVenue = await this.prisma.venue.findFirst({
        where: { name },
      });

      if (existingVenue) {
        throw new ConflictException(`Venue dengan nama "${name}" sudah ada`);
      }

      const venue = await this.prisma.venue.create({
        data: {
          name,
          address,
          description,
          latitude,
          longitude,
        },
      });

      this.logger.log(`Venue created: ${name}`, 'VenuesService');

      return {
        message: 'Venue berhasil dibuat',
        data: venue,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to create venue: ${error.message}`, error.stack, 'VenuesService');
      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    try {
      const skip = (page - 1) * limit;

      const where = search
        ? {
            OR: [
              { name: { contains: search } },
              { address: { contains: search } },
            ],
          }
        : {};

      const [venues, total] = await Promise.all([
        this.prisma.venue.findMany({
          where,
          include: {
            _count: {
              select: {
                fields: true,
                admins: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        this.prisma.venue.count({ where }),
      ]);

      return {
        message: 'Daftar venue berhasil diambil',
        data: venues.map((venue) => ({
          id: venue.id,
          name: venue.name,
          address: venue.address,
          description: venue.description,
          latitude: venue.latitude,
          longitude: venue.longitude,
          fieldCount: venue._count.fields,
          adminCount: venue._count.admins,
          createdAt: venue.createdAt,
          updatedAt: venue.updatedAt,
        })),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch venues: ${error.message}`, error.stack, 'VenuesService');
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const venue = await this.prisma.venue.findUnique({
        where: { id },
        include: {
          fields: {
            select: {
              id: true,
              name: true,
              type: true,
              isActive: true,
              createdAt: true,
            },
          },
          admins: {
            select: {
              id: true,
              name: true,
              email: true,
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!venue) {
        throw new NotFoundException(`Venue dengan ID "${id}" tidak ditemukan`);
      }

      return {
        message: 'Detail venue berhasil diambil',
        data: venue,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch venue: ${error.message}`, error.stack, 'VenuesService');
      throw error;
    }
  }

  async update(id: string, updateVenueDto: UpdateVenueDto) {
    const { name, address, description, latitude, longitude } = updateVenueDto;

    try {
      // Check if venue exists
      const existingVenue = await this.prisma.venue.findUnique({
        where: { id },
      });

      if (!existingVenue) {
        throw new NotFoundException(`Venue dengan ID "${id}" tidak ditemukan`);
      }

      // Check if new name conflicts with existing venue
      if (name && name !== existingVenue.name) {
        const nameConflict = await this.prisma.venue.findFirst({
          where: { name },
        });

        if (nameConflict) {
          throw new ConflictException(`Venue dengan nama "${name}" sudah ada`);
        }
      }

      const venue = await this.prisma.venue.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(address && { address }),
          ...(description !== undefined && { description }),
          ...(latitude !== undefined && { latitude }),
          ...(longitude !== undefined && { longitude }),
        },
      });

      this.logger.log(`Venue updated: ${venue.name}`, 'VenuesService');

      return {
        message: 'Venue berhasil diupdate',
        data: venue,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to update venue: ${error.message}`, error.stack, 'VenuesService');
      throw error;
    }
  }

  async remove(id: string) {
    try {
      // Check if venue exists
      const existingVenue = await this.prisma.venue.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              fields: true,
              admins: true,
            },
          },
        },
      });

      if (!existingVenue) {
        throw new NotFoundException(`Venue dengan ID "${id}" tidak ditemukan`);
      }

      // Check if venue has fields
      if (existingVenue._count.fields > 0) {
        throw new BadRequestException(
          `Venue tidak dapat dihapus karena masih memiliki ${existingVenue._count.fields} lapangan`,
        );
      }

      // Check if venue has admins
      if (existingVenue._count.admins > 0) {
        throw new BadRequestException(
          `Venue tidak dapat dihapus karena masih memiliki ${existingVenue._count.admins} admin`,
        );
      }

      await this.prisma.venue.delete({
        where: { id },
      });

      this.logger.log(`Venue deleted: ${existingVenue.name}`, 'VenuesService');

      return {
        message: 'Venue berhasil dihapus',
        data: { id },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to delete venue: ${error.message}`, error.stack, 'VenuesService');
      throw error;
    }
  }
}
