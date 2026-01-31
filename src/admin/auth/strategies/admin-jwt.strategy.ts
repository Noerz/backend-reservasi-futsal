import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';

export interface AdminJwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  roleId: string;
  venueId?: string;
  type: 'admin';
}

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-this',
    });
  }

  async validate(payload: AdminJwtPayload) {
    // Only validate admin tokens
    if (payload.type !== 'admin') {
      throw new UnauthorizedException('Invalid token type');
    }

    const admin = await this.prisma.admin.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        roleId: true,
        venueId: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    return admin;
  }
}
