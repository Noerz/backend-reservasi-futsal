import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggerService } from '../../common/logger.service';
import { CreateRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const { name, description } = createRoleDto;

    try {
      // Check if role name already exists
      const existingRole = await this.prisma.adminRole.findUnique({
        where: { name },
      });

      if (existingRole) {
        throw new ConflictException(`Role dengan nama "${name}" sudah ada`);
      }

      const role = await this.prisma.adminRole.create({
        data: {
          name,
          description,
        },
      });

      this.logger.log(`Role created: ${name}`, 'RolesService');

      return {
        message: 'Role berhasil dibuat',
        data: role,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to create role: ${error.message}`, error.stack, 'RolesService');
      throw error;
    }
  }

  async findAll() {
    try {
      const roles = await this.prisma.adminRole.findMany({
        include: {
          _count: {
            select: { admins: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        message: 'Daftar role berhasil diambil',
        data: roles.map((role) => ({
          id: role.id,
          name: role.name,
          description: role.description,
          adminCount: role._count.admins,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch roles: ${error.message}`, error.stack, 'RolesService');
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const role = await this.prisma.adminRole.findUnique({
        where: { id },
        include: {
          admins: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          },
        },
      });

      if (!role) {
        throw new NotFoundException(`Role dengan ID "${id}" tidak ditemukan`);
      }

      return {
        message: 'Detail role berhasil diambil',
        data: role,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch role: ${error.message}`, error.stack, 'RolesService');
      throw error;
    }
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const { name, description } = updateRoleDto;

    try {
      // Check if role exists
      const existingRole = await this.prisma.adminRole.findUnique({
        where: { id },
      });

      if (!existingRole) {
        throw new NotFoundException(`Role dengan ID "${id}" tidak ditemukan`);
      }

      // Check if new name conflicts with existing role
      if (name && name !== existingRole.name) {
        const nameConflict = await this.prisma.adminRole.findUnique({
          where: { name },
        });

        if (nameConflict) {
          throw new ConflictException(`Role dengan nama "${name}" sudah ada`);
        }
      }

      const role = await this.prisma.adminRole.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
        },
      });

      this.logger.log(`Role updated: ${role.name}`, 'RolesService');

      return {
        message: 'Role berhasil diupdate',
        data: role,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to update role: ${error.message}`, error.stack, 'RolesService');
      throw error;
    }
  }

  async remove(id: string) {
    try {
      // Check if role exists
      const existingRole = await this.prisma.adminRole.findUnique({
        where: { id },
        include: {
          _count: {
            select: { admins: true },
          },
        },
      });

      if (!existingRole) {
        throw new NotFoundException(`Role dengan ID "${id}" tidak ditemukan`);
      }

      // Check if role has admins
      if (existingRole._count.admins > 0) {
        throw new BadRequestException(
          `Role tidak dapat dihapus karena masih memiliki ${existingRole._count.admins} admin`,
        );
      }

      await this.prisma.adminRole.delete({
        where: { id },
      });

      this.logger.log(`Role deleted: ${existingRole.name}`, 'RolesService');

      return {
        message: 'Role berhasil dihapus',
        data: { id },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to delete role: ${error.message}`, error.stack, 'RolesService');
      throw error;
    }
  }
}
