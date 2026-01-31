import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from '../common/logger.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private logger: LoggerService) {
    const adapter = new PrismaMariaDb({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'db_reservasi_lapangan',
      connectionLimit: 10,
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.logDatabaseConnection();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
