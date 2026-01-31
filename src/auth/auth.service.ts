import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../common/logger.service';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private logger: LoggerService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name, phone } = registerDto;

    try {
      // Check if customer already exists
      const existingCustomer = await this.prisma.customer.findUnique({
        where: { email },
      });

      if (existingCustomer) {
        this.logger.logAuthError(email, 'Register', 'Email already registered');
        throw new ConflictException('Email already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create customer
      const customer = await this.prisma.customer.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Generate JWT token
      const token = await this.generateToken(customer.id, customer.email, customer.name);

      this.logger.logAuthSuccess(email, 'Register');

      return {
        message: 'Registration successful',
        data: {
          customer,
          token,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.logError('Register', error);
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    try {
      // Find customer by email
      const customer = await this.prisma.customer.findUnique({
        where: { email },
      });

      if (!customer) {
        this.logger.logAuthError(email, 'Login', 'Invalid credentials');
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, customer.password);

      if (!isPasswordValid) {
        this.logger.logAuthError(email, 'Login', 'Invalid credentials');
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate JWT token
      const token = await this.generateToken(customer.id, customer.email, customer.name);

      this.logger.logAuthSuccess(email, 'Login');

      return {
        message: 'Login successful',
        data: {
          id: customer.id,
          name: customer.name,
          access_token: token.access_token,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.logError('Login', error);
      throw error;
    }
  }

  async getProfile(customerId: string) {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!customer) {
        throw new BadRequestException('Customer not found');
      }

      return {
        message: 'Profile retrieved successfully',
        data: customer,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.logError('GetProfile', error);
      throw error;
    }
  }

  private async generateToken(id: string, email: string, name: string) {
    const payload = { sub: id, email, name };
    
    return {
      access_token: await this.jwtService.signAsync(payload),
      token_type: 'Bearer',
      expires_in: '7d',
    };
  }
}
