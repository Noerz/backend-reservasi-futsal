import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { LoggerService } from 'src/common/logger.service';

@Global()
@Module({
  providers: [PrismaService, LoggerService],
  exports: [PrismaService],
})
export class PrismaModule {}
