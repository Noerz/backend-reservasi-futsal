import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggerService } from '../../common/logger.service';
import { RegisterAdminDto, LoginAdminDto } from './dto';

@Injectable()
export class AdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private logger: LoggerService,
  ) {}

  async register(registerDto: RegisterAdminDto) {
    const { email, password, name, roleId, venueId } = registerDto;

    try {
      // Check if admin already exists
      const existingAdmin = await this.prisma.admin.findUnique({
        where: { email },
      });

      if (existingAdmin) {
        throw new ConflictException('Email sudah terdaftar');
      }

      // Check if role exists
      const role = await this.prisma.adminRole.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        throw new NotFoundException('Role tidak ditemukan');
      }

      // Check if venue exists (if provided)
      if (venueId) {
        const venue = await this.prisma.venue.findUnique({
          where: { id: venueId },
        });

        if (!venue) {
          throw new NotFoundException('Venue tidak ditemukan');
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create admin
      const admin = await this.prisma.admin.create({
        data: {
          email,
          password: hashedPassword,
          name,
          roleId,
          venueId,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          venue: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });

      // Generate JWT token
      const token = await this.generateToken(admin);

      this.logger.log(`Admin registered: ${email}`, 'AdminAuth');

      return {
        message: 'Registrasi admin berhasil',
        data: {
          id: admin.id,
          name: admin.name,
          role: admin.role.name,
          access_token: token.access_token,
        },
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`Failed to register admin: ${error.message}`, error.stack, 'AdminAuth');
      throw error;
    }
  }

  async login(loginDto: LoginAdminDto) {
    const { email, password } = loginDto;

    try {
      // Find admin by email
      const admin = await this.prisma.admin.findUnique({
        where: { email },
        include: {
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          venue: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!admin) {
        this.logger.warn(`Login attempt failed - Admin not found: ${email}`, 'AdminAuth');
        throw new UnauthorizedException('Email atau password salah');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, admin.password);

      if (!isPasswordValid) {
        this.logger.warn(`Login attempt failed - Invalid password: ${email}`, 'AdminAuth');
        throw new UnauthorizedException('Email atau password salah');
      }

      // Generate JWT token
      const token = await this.generateToken(admin);

      this.logger.log(`Admin login successful: ${email}`, 'AdminAuth');

      return {
        message: 'Login berhasil',
        data: {
          id: admin.id,
          name: admin.name,
          role: admin.role.name,
          access_token: token.access_token,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Failed to login admin: ${error.message}`, error.stack, 'AdminAuth');
      throw error;
    }
  }

  async getProfile(adminId: string) {
    try {
      const admin = await this.prisma.admin.findUnique({
        where: { id: adminId },
        select: {
          id: true,
          email: true,
          name: true,
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          venue: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!admin) {
        throw new BadRequestException('Admin tidak ditemukan');
      }

      return {
        message: 'Profile admin berhasil diambil',
        data: admin,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to get admin profile: ${error.message}`, error.stack, 'AdminAuth');
      throw error;
    }
  }

  private async generateToken(admin: any) {
    const payload = {
      sub: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role.name,
      roleId: admin.role.id,
      venueId: admin.venueId || admin.venue?.id || null,
      type: 'admin',
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
