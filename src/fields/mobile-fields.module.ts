import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MobileFieldsController } from './mobile-fields.controller';
import { MobileFieldsService } from './mobile-fields.service';

@Module({
  imports: [PrismaModule],
  controllers: [MobileFieldsController],
  providers: [MobileFieldsService],
})
export class MobileFieldsModule {}
